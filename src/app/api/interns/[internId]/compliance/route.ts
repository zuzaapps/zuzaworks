import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ internId: string }> }
) {
  try {
    const { internId } = await params;

    // Verify intern exists
    const intern = queryOne<any>(`
      SELECT i.id, i.intern_number, i.first_name, i.last_name, i.status,
             i.start_date, i.end_date, i.id_number, i.stipend_amount,
             ip.program_name, ip.program_type, ip.seta_id
      FROM interns i
      LEFT JOIN intern_programs ip ON i.program_id = ip.id
      WHERE i.id = ?
    `, [internId]);

    if (!intern) {
      return NextResponse.json(
        { success: false, error: 'Intern not found' },
        { status: 404 }
      );
    }

    // Check various compliance requirements
    const checks: any[] = [];

    // 1. Contract / Agreement check
    checks.push({
      category: 'Documentation',
      item: 'Learnership/Internship Agreement',
      description: 'Written agreement signed by intern, employer, and training provider',
      status: intern.start_date ? 'compliant' : 'non_compliant',
      required: true,
    });

    // 2. Stipend payments
    const stipendCount = queryOne<any>(`
      SELECT COUNT(*) as count FROM intern_stipend_payments
      WHERE intern_id = ? AND status = 'paid'
    `, [internId]);

    const expectedMonths = intern.start_date
      ? Math.max(1, Math.ceil((Date.now() - new Date(intern.start_date).getTime()) / (30 * 24 * 60 * 60 * 1000)))
      : 0;

    checks.push({
      category: 'Stipend',
      item: 'Stipend Payments Up to Date',
      description: `${stipendCount?.count || 0} of ${expectedMonths} expected payments made`,
      status: (stipendCount?.count || 0) >= expectedMonths ? 'compliant' : 'non_compliant',
      required: true,
    });

    // 3. Mentorship sessions
    const mentorshipCount = queryOne<any>(`
      SELECT COUNT(*) as count FROM intern_mentorship_sessions
      WHERE intern_id = ? AND status = 'completed'
    `, [internId]);

    checks.push({
      category: 'Mentorship',
      item: 'Regular Mentorship Sessions',
      description: `${mentorshipCount?.count || 0} sessions completed`,
      status: (mentorshipCount?.count || 0) > 0 ? 'compliant' : 'pending',
      required: true,
    });

    // 4. Assessments
    const assessmentCount = queryOne<any>(`
      SELECT COUNT(*) as count FROM intern_assessments
      WHERE intern_id = ? AND status = 'completed'
    `, [internId]);

    checks.push({
      category: 'Assessment',
      item: 'Performance Assessments',
      description: `${assessmentCount?.count || 0} assessments completed`,
      status: (assessmentCount?.count || 0) > 0 ? 'compliant' : 'pending',
      required: true,
    });

    // 5. SETA registration (if applicable)
    if (intern.seta_id) {
      checks.push({
        category: 'SETA',
        item: 'SETA Registration',
        description: `Registered with SETA: ${intern.seta_id}`,
        status: 'compliant',
        required: true,
      });
    }

    // Calculate overall score
    const requiredChecks = checks.filter(c => c.required);
    const compliantChecks = requiredChecks.filter(c => c.status === 'compliant');
    const complianceScore = requiredChecks.length > 0
      ? Math.round((compliantChecks.length / requiredChecks.length) * 100)
      : 0;

    // Active alerts
    const alerts = query<any>(`
      SELECT * FROM compliance_alerts
      WHERE employee_id = ? AND status IN ('new', 'acknowledged')
      ORDER BY severity DESC, due_date ASC
    `, [internId]);

    return NextResponse.json({
      success: true,
      data: {
        intern: {
          id: intern.id,
          intern_number: intern.intern_number,
          name: `${intern.first_name} ${intern.last_name}`,
          program: intern.program_name,
          status: intern.status,
        },
        compliance_score: complianceScore,
        checks,
        alerts,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch intern compliance status', message: String(error) },
      { status: 500 }
    );
  }
}
