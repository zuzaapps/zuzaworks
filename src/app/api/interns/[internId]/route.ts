import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ internId: string }> }
) {
  try {
    const { internId } = await params;

    const intern = queryOne<any>(`
      SELECT i.*, ip.program_name, ip.program_type, ip.seta_name,
        ip.qualification_title, ip.qualification_nqf_level, ip.stipend_amount,
        ip.funding_source, ip.duration_months
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

    // Fetch SETA registration if applicable
    const setaRegistration = queryOne<any>(`
      SELECT * FROM seta_registrations WHERE intern_id = ?
    `, [internId]);

    // Fetch YES registration if applicable
    const yesRegistration = queryOne<any>(`
      SELECT * FROM yes_registrations WHERE intern_id = ?
    `, [internId]);

    // Fetch learning plan
    const learningPlan = queryOne<any>(`
      SELECT * FROM intern_learning_plans
      WHERE intern_id = ? ORDER BY plan_version DESC LIMIT 1
    `, [internId]);

    // Fetch recent assessments
    const assessments = query<any>(`
      SELECT * FROM intern_assessments
      WHERE intern_id = ?
      ORDER BY assessment_date DESC
      LIMIT 5
    `, [internId]);

    // Fetch completion record if exists
    const completion = queryOne<any>(`
      SELECT * FROM intern_completions WHERE intern_id = ?
    `, [internId]);

    return NextResponse.json({
      success: true,
      data: {
        ...intern,
        setaRegistration,
        yesRegistration,
        learningPlan,
        assessments,
        completion,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch intern', message: error.message },
      { status: 500 }
    );
  }
}
