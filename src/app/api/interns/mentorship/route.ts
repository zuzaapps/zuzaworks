import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      intern_id, mentor_id, session_date, session_duration_minutes,
      session_type, topics_discussed, challenges_raised, support_provided,
      action_items, progress_rating, progress_notes, next_session_scheduled, notes
    } = body;

    if (!intern_id || !mentor_id || !session_date) {
      return NextResponse.json(
        { success: false, error: 'intern_id, mentor_id, and session_date are required' },
        { status: 400 }
      );
    }

    // Verify intern exists
    const intern = queryOne<any>('SELECT id FROM interns WHERE id = ?', [intern_id]);
    if (!intern) {
      return NextResponse.json({ success: false, error: 'Intern not found' }, { status: 404 });
    }

    const result = execute(`
      INSERT INTO intern_mentorship_sessions (
        intern_id, mentor_id, session_date, session_duration_minutes,
        session_type, topics_discussed, challenges_raised, support_provided,
        action_items, progress_rating, progress_notes, next_session_scheduled, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      intern_id, mentor_id, session_date, session_duration_minutes || null,
      session_type || null, topics_discussed || null, challenges_raised || null,
      support_provided || null,
      action_items ? (typeof action_items === 'string' ? action_items : JSON.stringify(action_items)) : null,
      progress_rating || null, progress_notes || null,
      next_session_scheduled || null, notes || null
    ]);

    return NextResponse.json(
      { success: true, data: { id: result.lastInsertRowid }, message: 'Mentorship session recorded successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to record mentorship session', message: error.message },
      { status: 500 }
    );
  }
}
