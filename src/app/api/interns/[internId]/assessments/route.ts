import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ internId: string }> }
) {
  const { internId } = await params;

  try {
    // Verify intern exists
    const intern = queryOne<any>('SELECT id, first_name, last_name FROM interns WHERE id = ?', [internId]);
    if (!intern) {
      return NextResponse.json({ success: false, error: 'Intern not found' }, { status: 404 });
    }

    const assessments = query<any>(`
      SELECT * FROM intern_assessments
      WHERE intern_id = ?
      ORDER BY assessment_date DESC
    `, [internId]);

    // Summary stats
    const summary = queryOne<any>(`
      SELECT
        COUNT(*) AS total_assessments,
        COALESCE(AVG(overall_rating), 0) AS avg_overall_rating,
        COALESCE(AVG(technical_skills_rating), 0) AS avg_technical_rating,
        COALESCE(AVG(soft_skills_rating), 0) AS avg_soft_skills_rating,
        COALESCE(AVG(workplace_behavior_rating), 0) AS avg_behavior_rating,
        MAX(assessment_date) AS last_assessment_date
      FROM intern_assessments
      WHERE intern_id = ?
    `, [internId]);

    // Latest outcome
    const latestOutcome = queryOne<any>(`
      SELECT outcome, assessment_date, assessment_type
      FROM intern_assessments
      WHERE intern_id = ? AND outcome IS NOT NULL
      ORDER BY assessment_date DESC LIMIT 1
    `, [internId]);

    return NextResponse.json({
      success: true,
      data: {
        intern: { id: intern.id, first_name: intern.first_name, last_name: intern.last_name },
        assessments,
        summary,
        latestOutcome
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assessments', message: error.message },
      { status: 500 }
    );
  }
}
