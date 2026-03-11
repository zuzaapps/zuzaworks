import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ internId: string }> }
) {
  const { internId } = await params;

  try {
    // Get intern with program info
    const intern = queryOne<any>(`
      SELECT i.*, ip.program_name, ip.program_type, ip.seta_name, ip.funding_source
      FROM interns i
      LEFT JOIN intern_programs ip ON i.program_id = ip.id
      WHERE i.id = ?
    `, [internId]);

    if (!intern) {
      return NextResponse.json({ success: false, error: 'Intern not found' }, { status: 404 });
    }

    const checks: any[] = [];

    // Data consent check
    checks.push({
      item: 'POPIA Data Consent',
      status: intern.data_consent ? 'compliant' : 'non_compliant',
      details: intern.data_consent ? `Consent given on ${intern.data_consent_date}` : 'Data consent not obtained'
    });

    // Document checks
    checks.push({
      item: 'ID Copy',
      status: intern.id_copy_path ? 'compliant' : 'missing',
      details: intern.id_copy_path ? 'Document on file' : 'ID copy not uploaded'
    });
    checks.push({
      item: 'CV',
      status: intern.cv_path ? 'compliant' : 'missing',
      details: intern.cv_path ? 'Document on file' : 'CV not uploaded'
    });

    // SETA compliance (if applicable)
    let setaCompliance = null;
    if (['seta_learnership', 'seta_internship', 'seta_apprenticeship', 'seta_skills_programme'].includes(intern.program_type)) {
      const setaReg = queryOne<any>('SELECT * FROM seta_registrations WHERE intern_id = ?', [internId]);
      if (setaReg) {
        checks.push({
          item: 'SETA Registration',
          status: setaReg.registration_status === 'registered' ? 'compliant' : 'pending',
          details: `Status: ${setaReg.registration_status}`
        });
        checks.push({
          item: 'SETA Agreement',
          status: setaReg.agreement_signed_date ? 'compliant' : 'non_compliant',
          details: setaReg.agreement_signed_date ? `Signed on ${setaReg.agreement_signed_date}` : 'Agreement not signed'
        });
        checks.push({
          item: 'SETA Quarterly Report',
          status: setaReg.next_quarterly_report_due && new Date(setaReg.next_quarterly_report_due) < new Date() ? 'overdue' : 'compliant',
          details: setaReg.next_quarterly_report_due ? `Next due: ${setaReg.next_quarterly_report_due}` : 'No report schedule set'
        });
        setaCompliance = setaReg;
      } else {
        checks.push({
          item: 'SETA Registration',
          status: 'non_compliant',
          details: 'No SETA registration record found'
        });
      }
    }

    // YES compliance (if applicable)
    let yesCompliance = null;
    if (intern.program_type === 'yes_program') {
      const yesReg = queryOne<any>('SELECT * FROM yes_registrations WHERE intern_id = ?', [internId]);
      if (yesReg) {
        checks.push({
          item: 'YES Registration',
          status: ['verified', 'active'].includes(yesReg.registration_status) ? 'compliant' : 'pending',
          details: `Status: ${yesReg.registration_status}`
        });
        checks.push({
          item: 'YES Agreement',
          status: yesReg.agreement_signed_date ? 'compliant' : 'non_compliant',
          details: yesReg.agreement_signed_date ? `Signed on ${yesReg.agreement_signed_date}` : 'Agreement not signed'
        });
        checks.push({
          item: 'YES Monthly Report',
          status: yesReg.next_monthly_report_due && new Date(yesReg.next_monthly_report_due) < new Date() ? 'overdue' : 'compliant',
          details: yesReg.next_monthly_report_due ? `Next due: ${yesReg.next_monthly_report_due}` : 'No report schedule set'
        });
        yesCompliance = yesReg;
      } else {
        checks.push({
          item: 'YES Registration',
          status: 'non_compliant',
          details: 'No YES registration record found'
        });
      }
    }

    // Learning plan check
    const learningPlan = queryOne<any>(
      'SELECT id, status FROM intern_learning_plans WHERE intern_id = ? ORDER BY plan_version DESC LIMIT 1',
      [internId]
    );
    checks.push({
      item: 'Learning Plan',
      status: learningPlan ? (learningPlan.status === 'active' ? 'compliant' : 'pending') : 'missing',
      details: learningPlan ? `Status: ${learningPlan.status}` : 'No learning plan created'
    });

    // Assessment check (at least one assessment in last 3 months)
    const recentAssessment = queryOne<any>(`
      SELECT id, assessment_date FROM intern_assessments
      WHERE intern_id = ? AND assessment_date >= date('now', '-3 months')
      ORDER BY assessment_date DESC LIMIT 1
    `, [internId]);
    checks.push({
      item: 'Recent Assessment',
      status: recentAssessment ? 'compliant' : 'overdue',
      details: recentAssessment ? `Last assessed: ${recentAssessment.assessment_date}` : 'No assessment in last 3 months'
    });

    // Mentorship check (at least one session in last month)
    const recentMentorship = queryOne<any>(`
      SELECT id, session_date FROM intern_mentorship_sessions
      WHERE intern_id = ? AND session_date >= date('now', '-1 month')
      ORDER BY session_date DESC LIMIT 1
    `, [internId]);
    checks.push({
      item: 'Recent Mentorship Session',
      status: recentMentorship ? 'compliant' : 'overdue',
      details: recentMentorship ? `Last session: ${recentMentorship.session_date}` : 'No mentorship session in last month'
    });

    // Stipend check (payment for current/last month)
    const now = new Date();
    const recentStipend = queryOne<any>(`
      SELECT id, payment_month, payment_year FROM intern_stipend_payments
      WHERE intern_id = ? AND (
        (payment_year = ? AND payment_month = ?) OR
        (payment_year = ? AND payment_month = ?)
      )
      ORDER BY payment_year DESC, payment_month DESC LIMIT 1
    `, [
      internId,
      now.getFullYear(), now.getMonth() + 1,
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(),
      now.getMonth() === 0 ? 12 : now.getMonth()
    ]);
    checks.push({
      item: 'Stipend Payment',
      status: recentStipend ? 'compliant' : 'overdue',
      details: recentStipend
        ? `Last payment: ${recentStipend.payment_year}-${String(recentStipend.payment_month).padStart(2, '0')}`
        : 'No recent stipend payment'
    });

    // Calculate overall compliance score
    const compliantCount = checks.filter(c => c.status === 'compliant').length;
    const overallScore = Math.round((compliantCount / checks.length) * 100);

    return NextResponse.json({
      success: true,
      data: {
        intern: {
          id: intern.id,
          first_name: intern.first_name,
          last_name: intern.last_name,
          program_type: intern.program_type,
          legal_status: intern.legal_status
        },
        complianceScore: overallScore,
        checks,
        setaCompliance,
        yesCompliance
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch compliance status', message: error.message },
      { status: 500 }
    );
  }
}
