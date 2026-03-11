import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const employee = queryOne<any>(`
      SELECT e.*, d.name as department_name, l.name as location_name,
        m.first_name || ' ' || m.last_name as manager_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN locations l ON e.location_id = l.id
      LEFT JOIN employees m ON e.manager_id = m.id
      WHERE e.id = ?
    `, [id]);

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch employee', message: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = queryOne<any>('SELECT id FROM employees WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    const allowedFields = [
      'first_name', 'last_name', 'email', 'phone_mobile', 'phone_home',
      'address_line1', 'address_line2', 'city', 'province', 'postal_code',
      'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
      'employment_type', 'employment_status', 'department_id', 'location_id',
      'job_title', 'job_level', 'manager_id', 'salary_amount', 'salary_frequency',
      'contracted_hours_per_week', 'shift_pattern', 'profile_photo_url',
      'probation_end_date', 'contract_start_date', 'contract_end_date',
      'termination_date', 'is_active',
    ];

    const setClauses: string[] = [];
    const values: unknown[] = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    execute(`UPDATE employees SET ${setClauses.join(', ')} WHERE id = ?`, values);

    const updated = queryOne<any>(`
      SELECT e.*, d.name as department_name, l.name as location_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN locations l ON e.location_id = l.id
      WHERE e.id = ?
    `, [id]);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to update employee', message: error.message }, { status: 500 });
  }
}
