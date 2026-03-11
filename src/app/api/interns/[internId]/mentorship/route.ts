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

    const sessions = query<any>(`
      SELECT ms.*
      FROM intern_mentorship_sessions ms
      WHERE ms.intern_id = ?
      ORDER BY ms.session_date DESC
    `, [internId]);

    // Summary stats
    const summary = queryOne<any>(`
      SELECT
        COUNT(*) AS total_sessions,
        COALESCE(AVG(progress_rating), 0) AS avg_progress_rating,
        COALESCE(SUM(session_duration_minutes), 0) AS total_minutes,
        MAX(session_date) AS last_session_date,
        MIN(next_session_scheduled) AS next_scheduled
      FROM intern_mentorship_sessions
      WHERE intern_id = ?
    `, [internId]);

    return NextResponse.json({
      success: true,
      data: {
        intern: { id: intern.id, first_name: intern.first_name, last_name: intern.last_name },
        sessions,
        summary
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mentorship sessions', message: error.message },
      { status: 500 }
    );
  }
}
