import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const entries = query<any>(`
      SELECT te.*, e.first_name || ' ' || e.last_name as employee_name
      FROM time_entries te LEFT JOIN employees e ON te.employee_id = e.id
      ORDER BY te.clock_in_time DESC LIMIT 100
    `);
    return NextResponse.json({ success: true, data: entries });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch time entries', message: error.message }, { status: 500 });
  }
}
