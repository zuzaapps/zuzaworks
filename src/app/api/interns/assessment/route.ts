import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      intern_id,
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
    } = body;

    if (!intern_id || !assessment_type || !assessment_date) {
      return NextResponse.json(
        { success: false, error: 'intern_id, assessment_type, and assessment_date are required' },
        { status: 400 }
      );
    }

    // Verify intern exists
    const intern = queryOne<any>(
      `SELECT id FROM interns WHERE id = ?`,
      [intern_id]
    );

    if (!intern) {
      return NextResponse.json(
        { success: false, error: 'Intern not found' },
        { status: 404 }
      );
    }

    const calculatedPercentage = percentage || (score && max_score ? Math.round((score / max_score) * 100) : null);

    const result = execute(
      `INSERT INTO intern_assessments (
        intern_id, assessment_type, assessment_date, assessor_id,
        assessor_name, score, max_score, percentage, grade,
        competencies_assessed, strengths, areas_for_improvement,
        recommendations, intern_comments, assessor_comments,
        next_assessment_date, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
      [
        intern_id,
        assessment_type,
        assessment_date,
        assessor_id || null,
        assessor_name || null,
        score || null,
        max_score || null,
        calculatedPercentage,
        grade || null,
        competencies_assessed || null,
        strengths || null,
        areas_for_improvement || null,
        recommendations || null,
        intern_comments || null,
        assessor_comments || null,
        next_assessment_date || null,
        notes || null,
      ]
    );

    const assessment = queryOne<any>(
      `SELECT a.*, i.first_name, i.last_name, i.intern_number
       FROM intern_assessments a
       JOIN interns i ON a.intern_id = i.id
       WHERE a.id = ?`,
      [result.lastInsertRowid]
    );

    return NextResponse.json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to record assessment', message: String(error) },
      { status: 500 }
    );
  }
}
