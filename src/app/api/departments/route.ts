import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const departments = query<any>(`
      SELECT d.*, o.name as organization_name, l.name as location_name,
        m.first_name || ' ' || m.last_name as manager_name,
        COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN organizations o ON d.organization_id = o.id
      LEFT JOIN locations l ON d.location_id = l.id
      LEFT JOIN employees m ON d.manager_id = m.id
      LEFT JOIN employees e ON e.department_id = d.id AND e.is_active = 1
      GROUP BY d.id
      ORDER BY d.name
    `);

    return NextResponse.json({ success: true, data: departments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch departments', message: error.message }, { status: 500 });
  }
}
