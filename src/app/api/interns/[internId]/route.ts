import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ internId: string }> }
) {
  const { internId } = await params;

  try {
    // Get intern with program details
    const intern = queryOne<any>(`
      SELECT i.*, ip.program_name, ip.program_type, ip.seta_name,
        ip.qualification_title, ip.qualification_nqf_level, ip.funding_source,
        ip.stipend_amount AS program_stipend_amount, ip.duration_months
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

    // Get SETA registration if applicable
    const setaRegistration = queryOne<any>(
      'SELECT * FROM seta_registrations WHERE intern_id = ?',
      [internId]
    );

    // Get YES registration if applicable
    const yesRegistration = queryOne<any>(
      'SELECT * FROM yes_registrations WHERE intern_id = ?',
      [internId]
    );

    // Get NYS registration if applicable
    const nysRegistration = queryOne<any>(
      'SELECT * FROM nys_registrations WHERE intern_id = ?',
      [internId]
    );

    // Get learning plan
    const learningPlan = queryOne<any>(
      'SELECT * FROM intern_learning_plans WHERE intern_id = ? ORDER BY plan_version DESC LIMIT 1',
      [internId]
    );

    // Get recent assessments
    const assessments = query<any>(
      'SELECT * FROM intern_assessments WHERE intern_id = ? ORDER BY assessment_date DESC LIMIT 5',
      [internId]
    );

    // Get recent mentorship sessions
    const mentorshipSessions = query<any>(
      'SELECT * FROM intern_mentorship_sessions WHERE intern_id = ? ORDER BY session_date DESC LIMIT 5',
      [internId]
    );

    // Get completion record if exists
    const completion = queryOne<any>(
      'SELECT * FROM intern_completions WHERE intern_id = ?',
      [internId]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...intern,
        setaRegistration,
        yesRegistration,
        nysRegistration,
        learningPlan,
        assessments,
        mentorshipSessions,
        completion
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch intern', message: error.message },
      { status: 500 }
    );
  }
}
