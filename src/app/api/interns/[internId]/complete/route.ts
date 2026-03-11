import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ internId: string }> }
) {
  try {
    const { internId } = await params;
    const body = await request.json();
    const {
      completion_date,
      completion_type,
      certificate_number,
      certificate_issued,
      final_assessment_score,
      final_grade,
      competencies_achieved,
      hours_completed,
      credits_achieved,
      employer_recommendation,
      mentor_comments,
      intern_feedback,
      employment_offered,
      employment_start_date,
      notes,
    } = body;

    // Verify intern exists and is active
    const intern = queryOne<any>(`
      SELECT i.*, ip.program_name, ip.credits as required_credits, ip.duration_months
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

    if (intern.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Intern program already completed' },
        { status: 409 }
      );
    }

    const effectiveDate = completion_date || new Date().toISOString().split('T')[0];

    // Update intern status
    execute(
      `UPDATE interns
       SET status = 'completed',
           completion_date = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      [effectiveDate, internId]
    );

    // Create completion record
    const result = execute(
      `INSERT INTO intern_completions (
        intern_id, completion_date, completion_type,
        certificate_number, certificate_issued,
        final_assessment_score, final_grade,
        competencies_achieved, hours_completed, credits_achieved,
        employer_recommendation, mentor_comments, intern_feedback,
        employment_offered, employment_start_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        internId,
        effectiveDate,
        completion_type || 'successful',
        certificate_number || null,
        certificate_issued ? 1 : 0,
        final_assessment_score || null,
        final_grade || null,
        competencies_achieved || null,
        hours_completed || null,
        credits_achieved || null,
        employer_recommendation || null,
        mentor_comments || null,
        intern_feedback || null,
        employment_offered ? 1 : 0,
        employment_start_date || null,
        notes || null,
      ]
    );

    const completion = queryOne<any>(
      `SELECT c.*, i.first_name, i.last_name, i.intern_number, ip.program_name
       FROM intern_completions c
       JOIN interns i ON c.intern_id = i.id
       LEFT JOIN intern_programs ip ON i.program_id = ip.id
       WHERE c.id = ?`,
      [result.lastInsertRowid]
    );

    return NextResponse.json({
      success: true,
      data: completion,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to complete intern program', message: String(error) },
      { status: 500 }
    );
  }
}
