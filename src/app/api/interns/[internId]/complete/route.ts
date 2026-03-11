import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ internId: string }> }
) {
  const { internId } = await params;

  try {
    const body = await request.json();
    const {
      completion_date, completion_status, qualification_achieved,
      qualification_title, certificate_number, certificate_issue_date,
      skills_acquired, competencies_achieved, final_assessment_rating,
      final_assessment_notes, employment_status, employment_start_date,
      job_title, reference_provided, notes
    } = body;

    if (!completion_date || !completion_status) {
      return NextResponse.json(
        { success: false, error: 'completion_date and completion_status are required' },
        { status: 400 }
      );
    }

    // Verify intern exists
    const intern = queryOne<any>('SELECT id, intern_status FROM interns WHERE id = ?', [internId]);
    if (!intern) {
      return NextResponse.json({ success: false, error: 'Intern not found' }, { status: 404 });
    }

    // Check if already completed
    const existingCompletion = queryOne<any>('SELECT id FROM intern_completions WHERE intern_id = ?', [internId]);
    if (existingCompletion) {
      return NextResponse.json(
        { success: false, error: 'Completion record already exists for this intern' },
        { status: 409 }
      );
    }

    // Insert completion record
    const result = execute(`
      INSERT INTO intern_completions (
        intern_id, completion_date, completion_status, qualification_achieved,
        qualification_title, certificate_number, certificate_issue_date,
        skills_acquired, competencies_achieved, final_assessment_rating,
        final_assessment_notes, employment_status, employment_start_date,
        job_title, reference_provided, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      internId, completion_date, completion_status,
      qualification_achieved ? 1 : 0, qualification_title || null,
      certificate_number || null, certificate_issue_date || null,
      skills_acquired ? (typeof skills_acquired === 'string' ? skills_acquired : JSON.stringify(skills_acquired)) : null,
      competencies_achieved || null, final_assessment_rating || null,
      final_assessment_notes || null, employment_status || null,
      employment_start_date || null, job_title || null,
      reference_provided ? 1 : 0, notes || null
    ]);

    // Update intern status
    const newStatus = completion_status === 'completed_successfully' ? 'completed'
      : completion_status === 'withdrawn' ? 'withdrawn'
      : completion_status === 'terminated' ? 'terminated'
      : 'completed';

    execute(
      'UPDATE interns SET intern_status = ?, actual_end_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, completion_date, internId]
    );

    return NextResponse.json(
      {
        success: true,
        data: { id: result.lastInsertRowid, intern_status: newStatus },
        message: 'Intern program completion recorded successfully'
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to complete intern program', message: error.message },
      { status: 500 }
    );
  }
}
