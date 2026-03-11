import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      intern_id, assessment_type, assessment_date, assessed_by,
      competencies_assessed, overall_rating, technical_skills_rating,
      soft_skills_rating, workplace_behavior_rating,
      strengths, areas_for_improvement, recommendations, outcome, notes
    } = body;

    if (!intern_id || !assessment_type || !assessment_date) {
      return NextResponse.json(
        { success: false, error: 'intern_id, assessment_type, and assessment_date are required' },
        { status: 400 }
      );
    }

    // Verify intern exists
    const intern = queryOne<any>('SELECT id FROM interns WHERE id = ?', [intern_id]);
    if (!intern) {
      return NextResponse.json({ success: false, error: 'Intern not found' }, { status: 404 });
    }

    const result = execute(`
      INSERT INTO intern_assessments (
        intern_id, assessment_type, assessment_date, assessed_by,
        competencies_assessed, overall_rating, technical_skills_rating,
        soft_skills_rating, workplace_behavior_rating,
        strengths, areas_for_improvement, recommendations, outcome, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      intern_id, assessment_type, assessment_date, assessed_by || null,
      competencies_assessed ? (typeof competencies_assessed === 'string' ? competencies_assessed : JSON.stringify(competencies_assessed)) : null,
      overall_rating || null, technical_skills_rating || null,
      soft_skills_rating || null, workplace_behavior_rating || null,
      strengths || null, areas_for_improvement || null,
      recommendations || null, outcome || null, notes || null
    ]);

    return NextResponse.json(
      { success: true, data: { id: result.lastInsertRowid }, message: 'Assessment recorded successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to record assessment', message: error.message },
      { status: 500 }
    );
  }
}
