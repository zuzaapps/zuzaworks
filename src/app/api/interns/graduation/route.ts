import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('program_id');
    const daysUntilEnd = searchParams.get('days_until_end') || '30';

    // Interns approaching end date who are ready for graduation
    let sql = `
      SELECT
        i.id,
        i.intern_number,
        i.first_name,
        i.last_name,
        i.email,
        i.start_date,
        i.end_date,
        i.status,
        i.stipend_amount,
        ip.program_name,
        ip.program_type,
        ip.nqf_level,
        ip.credits as required_credits,
        ip.duration_months,
        CAST(julianday(i.end_date) - julianday('now') AS INTEGER) as days_remaining,
        (SELECT COUNT(*) FROM intern_assessments ia WHERE ia.intern_id = i.id AND ia.status = 'completed') as assessments_completed,
        (SELECT AVG(ia.percentage) FROM intern_assessments ia WHERE ia.intern_id = i.id AND ia.status = 'completed') as average_score,
        (SELECT COUNT(*) FROM intern_mentorship_sessions ms WHERE ms.intern_id = i.id AND ms.status = 'completed') as mentorship_sessions,
        (SELECT COALESCE(SUM(ms.duration_hours), 0) FROM intern_mentorship_sessions ms WHERE ms.intern_id = i.id AND ms.status = 'completed') as mentorship_hours,
        (SELECT COUNT(*) FROM intern_stipend_payments sp WHERE sp.intern_id = i.id AND sp.status = 'paid') as stipend_payments_made
      FROM interns i
      JOIN intern_programs ip ON i.program_id = ip.id
      WHERE i.status = 'active'
        AND i.end_date IS NOT NULL
        AND i.end_date <= DATE('now', '+' || ? || ' days')
    `;

    const params: unknown[] = [daysUntilEnd];

    if (programId) {
      sql += ` AND i.program_id = ?`;
      params.push(programId);
    }

    sql += ` ORDER BY i.end_date ASC`;

    const graduationCandidates = query<any>(sql, params);

    // Add readiness assessment for each candidate
    const candidates = graduationCandidates.map((candidate: any) => {
      const readinessChecks = [];
      let readyCount = 0;
      const totalChecks = 4;

      // Check assessments
      const hasAssessments = (candidate.assessments_completed || 0) > 0;
      readinessChecks.push({ check: 'Assessments completed', passed: hasAssessments });
      if (hasAssessments) readyCount++;

      // Check average score
      const passingScore = (candidate.average_score || 0) >= 50;
      readinessChecks.push({ check: 'Passing average score (>=50%)', passed: passingScore });
      if (passingScore) readyCount++;

      // Check mentorship
      const hasMentorship = (candidate.mentorship_sessions || 0) >= 3;
      readinessChecks.push({ check: 'Minimum mentorship sessions (>=3)', passed: hasMentorship });
      if (hasMentorship) readyCount++;

      // Check stipend payments
      const stipendUpToDate = (candidate.stipend_payments_made || 0) > 0;
      readinessChecks.push({ check: 'Stipend payments made', passed: stipendUpToDate });
      if (stipendUpToDate) readyCount++;

      return {
        ...candidate,
        readiness_score: Math.round((readyCount / totalChecks) * 100),
        ready_for_graduation: readyCount === totalChecks,
        readiness_checks: readinessChecks,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        total_candidates: candidates.length,
        ready_count: candidates.filter((c: any) => c.ready_for_graduation).length,
        not_ready_count: candidates.filter((c: any) => !c.ready_for_graduation).length,
        candidates,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch graduation candidates', message: String(error) },
      { status: 500 }
    );
  }
}
