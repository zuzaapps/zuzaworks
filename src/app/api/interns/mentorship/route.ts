import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      intern_id,
      mentor_id,
      session_date,
      duration_hours,
      session_type,
      topics_covered,
      objectives,
      outcomes,
      intern_feedback,
      mentor_feedback,
      next_session_date,
      action_items,
      notes,
    } = body;

    if (!intern_id || !session_date) {
      return NextResponse.json(
        { success: false, error: 'intern_id and session_date are required' },
        { status: 400 }
      );
    }

    // Verify intern exists
    const intern = queryOne<any>(
      `SELECT id, mentor_id as default_mentor_id FROM interns WHERE id = ?`,
      [intern_id]
    );

    if (!intern) {
      return NextResponse.json(
        { success: false, error: 'Intern not found' },
        { status: 404 }
      );
    }

    const effectiveMentorId = mentor_id || intern.default_mentor_id;

    const result = execute(
      `INSERT INTO intern_mentorship_sessions (
        intern_id, mentor_id, session_date, duration_hours,
        session_type, topics_covered, objectives, outcomes,
        intern_feedback, mentor_feedback, next_session_date,
        action_items, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
      [
        intern_id,
        effectiveMentorId || null,
        session_date,
        duration_hours || null,
        session_type || 'one_on_one',
        topics_covered || null,
        objectives || null,
        outcomes || null,
        intern_feedback || null,
        mentor_feedback || null,
        next_session_date || null,
        action_items || null,
        notes || null,
      ]
    );

    const session = queryOne<any>(
      `SELECT ms.*, i.first_name as intern_first_name, i.last_name as intern_last_name,
              m.first_name as mentor_first_name, m.last_name as mentor_last_name
       FROM intern_mentorship_sessions ms
       LEFT JOIN interns i ON ms.intern_id = i.id
       LEFT JOIN employees m ON ms.mentor_id = m.id
       WHERE ms.id = ?`,
      [result.lastInsertRowid]
    );

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to record mentorship session', message: String(error) },
      { status: 500 }
    );
  }
}
