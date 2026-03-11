import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ internId: string }> }
) {
  try {
    const { internId } = await params;

    // Verify intern exists
    const intern = queryOne<any>(
      `SELECT id, intern_number, first_name, last_name FROM interns WHERE id = ?`,
      [internId]
    );

    if (!intern) {
      return NextResponse.json(
        { success: false, error: 'Intern not found' },
        { status: 404 }
      );
    }

    const assessments = query<any>(`
      SELECT
        id,
        assessment_type,
        assessment_date,
        assessor_id,
        assessor_name,
        score,
        max_score,
        percentage,
        grade,
        competencies_assessed,
        strengths,
        areas_for_improvement,
        recommendations,
        intern_comments,
        assessor_comments,
        next_assessment_date,
        notes,
        status,
        created_at
      FROM intern_assessments
      WHERE intern_id = ?
      ORDER BY assessment_date DESC
    `, [internId]);

    // Summary
    const summary = queryOne<any>(`
      SELECT
        COUNT(*) as total_assessments,
        AVG(percentage) as average_percentage,
        MAX(percentage) as highest_percentage,
        MIN(percentage) as lowest_percentage,
        MIN(assessment_date) as first_assessment,
        MAX(assessment_date) as last_assessment
      FROM intern_assessments
      WHERE intern_id = ? AND status = 'completed'
    `, [internId]);

    return NextResponse.json({
      success: true,
      data: {
        intern: {
          id: intern.id,
          intern_number: intern.intern_number,
          name: `${intern.first_name} ${intern.last_name}`,
        },
        assessments,
        summary,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assessments', message: String(error) },
      { status: 500 }
    );
  }
}
