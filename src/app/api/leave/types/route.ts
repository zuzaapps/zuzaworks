import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const leaveTypes = query<any>(`
      SELECT * FROM leave_types
      WHERE is_active = 1
      ORDER BY name
    `);

    return NextResponse.json({ success: true, data: leaveTypes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch leave types', message: error.message }, { status: 500 });
  }
}
