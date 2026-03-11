import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rules = query<any>(`
      SELECT ar.*,
        d.name as department_name,
        l.name as location_name
      FROM attendance_rules ar
      LEFT JOIN departments d ON ar.department_id = d.id
      LEFT JOIN locations l ON ar.location_id = l.id
      WHERE ar.is_active = 1
      ORDER BY ar.rule_type, ar.rule_name
    `);

    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch attendance rules', message: error.message }, { status: 500 });
  }
}
