import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get('department_id');
  const period = searchParams.get('period') || 'all_time';
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '25'));

  try {
    const conditions: string[] = ['e.is_active = 1'];
    const params: any[] = [];

    if (departmentId) {
      conditions.push('e.department_id = ?');
      params.push(departmentId);
    }

    params.push(limit);

    const leaderboard = query<any>(`
      SELECT
        e.id, e.first_name || ' ' || e.last_name as name, e.profile_photo_url as photo,
        e.job_title, d.name as department_name,
        COALESCE(e.gamification_points, 0) as total_points,
        COALESCE(e.gamification_level, 1) as level,
        ROW_NUMBER() OVER (ORDER BY COALESCE(e.gamification_points, 0) DESC) as rank
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY COALESCE(e.gamification_points, 0) DESC
      LIMIT ?
    `, params);

    return NextResponse.json({ success: true, data: leaderboard, meta: { period } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch leaderboard', message: error.message }, { status: 500 });
  }
}
