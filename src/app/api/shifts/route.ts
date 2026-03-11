import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const location_id = searchParams.get('location_id');
    const department_id = searchParams.get('department_id');
    const employee_id = searchParams.get('employee_id');
    const status = searchParams.get('status');

    let whereClause = 'WHERE 1=1';
    const params: unknown[] = [];

    if (date) {
      whereClause += ' AND s.shift_date = ?';
      params.push(date);
    } else if (start_date && end_date) {
      whereClause += ' AND s.shift_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    if (location_id) {
      whereClause += ' AND s.location_id = ?';
      params.push(location_id);
    }
    if (department_id) {
      whereClause += ' AND s.department_id = ?';
      params.push(department_id);
    }
    if (employee_id) {
      whereClause += ' AND s.employee_id = ?';
      params.push(employee_id);
    }
    if (status) {
      whereClause += ' AND s.status = ?';
      params.push(status);
    }

    const shifts = query<any>(`
      SELECT s.*,
        e.first_name || ' ' || e.last_name as employee_name,
        l.name as location_name,
        d.name as department_name
      FROM shifts s
      LEFT JOIN employees e ON s.employee_id = e.id
      LEFT JOIN locations l ON s.location_id = l.id
      LEFT JOIN departments d ON s.department_id = d.id
      ${whereClause}
      ORDER BY s.shift_date, s.start_time
      LIMIT 200
    `, params);

    return NextResponse.json({ success: true, data: shifts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch shifts', message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organization_id, employee_id, location_id, department_id,
      shift_date, start_time, end_time, duration_hours,
      shift_type, pay_multiplier, break_duration_minutes,
      required_skills, notes, shift_template_id,
    } = body;

    if (!location_id || !shift_date || !start_time || !end_time || !duration_hours) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: location_id, shift_date, start_time, end_time, duration_hours' },
        { status: 400 }
      );
    }

    const result = execute(`
      INSERT INTO shifts (
        organization_id, shift_template_id, employee_id, location_id, department_id,
        shift_date, start_time, end_time, duration_hours,
        break_duration_minutes, shift_type, pay_multiplier,
        required_skills, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled')
    `, [
      organization_id || 1, shift_template_id || null, employee_id || null,
      location_id, department_id || null, shift_date, start_time, end_time,
      duration_hours, break_duration_minutes || 0, shift_type || 'Regular',
      pay_multiplier || 1.0, required_skills || null, notes || null,
    ]);

    const shift = queryOne<any>('SELECT * FROM shifts WHERE id = ?', [result.lastInsertRowid]);

    return NextResponse.json({ success: true, data: shift }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to create shift', message: error.message }, { status: 500 });
  }
}
