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
      `SELECT id, intern_number, first_name, last_name, mentor_id FROM interns WHERE id = ?`,
      [internId]
    );

    if (!intern) {
      return NextResponse.json(
        { success: false, error: 'Intern not found' },
        { status: 404 }
      );
    }

    const sessions = query<any>(`
      SELECT
        ms.id,
        ms.mentor_id,
        ms.session_date,
        ms.duration_hours,
        ms.session_type,
        ms.topics_covered,
        ms.objectives,
        ms.outcomes,
        ms.intern_feedback,
        ms.mentor_feedback,
        ms.next_session_date,
        ms.action_items,
        ms.notes,
        ms.status,
        ms.created_at,
        m.first_name as mentor_first_name,
        m.last_name as mentor_last_name
      FROM intern_mentorship_sessions ms
      LEFT JOIN employees m ON ms.mentor_id = m.id
      WHERE ms.intern_id = ?
      ORDER BY ms.session_date DESC
    `, [internId]);

    // Summary
    const summary = queryOne<any>(`
      SELECT
        COUNT(*) as total_sessions,
        COALESCE(SUM(duration_hours), 0) as total_hours,
        MIN(session_date) as first_session,
        MAX(session_date) as last_session
      FROM intern_mentorship_sessions
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
        sessions,
        summary,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mentorship sessions', message: String(error) },
      { status: 500 }
    );
  }
}
