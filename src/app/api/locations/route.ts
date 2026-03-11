import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const locations = query<any>(`
      SELECT l.*, o.name as organization_name,
        COUNT(e.id) as employee_count
      FROM locations l
      LEFT JOIN organizations o ON l.organization_id = o.id
      LEFT JOIN employees e ON e.location_id = l.id AND e.is_active = 1
      WHERE l.is_active = 1
      GROUP BY l.id
      ORDER BY l.name
    `);

    return NextResponse.json({ success: true, data: locations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch locations', message: error.message }, { status: 500 });
  }
}
