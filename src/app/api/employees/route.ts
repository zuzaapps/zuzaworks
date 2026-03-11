import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute, parsePagination, paginatedResponse } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, perPage, offset } = parsePagination(searchParams);

    const department_id = searchParams.get('department_id');
    const location_id = searchParams.get('location_id');
    const employment_status = searchParams.get('employment_status');
    const employment_type = searchParams.get('employment_type');
    const search = searchParams.get('search');

    let whereClause = 'WHERE e.is_active = 1';
    const params: unknown[] = [];

    if (department_id) {
      whereClause += ' AND e.department_id = ?';
      params.push(department_id);
    }
    if (location_id) {
      whereClause += ' AND e.location_id = ?';
      params.push(location_id);
    }
    if (employment_status) {
      whereClause += ' AND e.employment_status = ?';
      params.push(employment_status);
    }
    if (employment_type) {
      whereClause += ' AND e.employment_type = ?';
      params.push(employment_type);
    }
    if (search) {
      whereClause += ' AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.employee_number LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const countResult = queryOne<any>(`SELECT COUNT(*) as total FROM employees e ${whereClause}`, params);
    const total = countResult?.total || 0;

    const employees = query<any>(`
      SELECT e.*, d.name as department_name, l.name as location_name,
        m.first_name || ' ' || m.last_name as manager_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN locations l ON e.location_id = l.id
      LEFT JOIN employees m ON e.manager_id = m.id
      ${whereClause}
      ORDER BY e.last_name, e.first_name
      LIMIT ? OFFSET ?
    `, [...params, perPage, offset]);

    return NextResponse.json(paginatedResponse(employees, page, perPage, total));
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch employees', message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organization_id, employee_number, first_name, last_name, id_number,
      date_of_birth, gender, nationality, race, email, phone_mobile,
      employment_type, department_id, location_id, job_title, job_level,
      manager_id, hire_date, salary_amount, salary_frequency,
      contracted_hours_per_week,
    } = body;

    if (!first_name || !last_name || !email || !employee_number || !job_title || !hire_date || !employment_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: first_name, last_name, email, employee_number, job_title, hire_date, employment_type' },
        { status: 400 }
      );
    }

    const result = execute(`
      INSERT INTO employees (
        organization_id, employee_number, first_name, last_name, id_number,
        date_of_birth, gender, nationality, race, email, phone_mobile,
        employment_type, department_id, location_id, job_title, job_level,
        manager_id, hire_date, salary_amount, salary_frequency,
        contracted_hours_per_week
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      organization_id || 1, employee_number, first_name, last_name, id_number || null,
      date_of_birth || null, gender || null, nationality || 'South African', race || null,
      email, phone_mobile || null, employment_type, department_id || null,
      location_id || null, job_title, job_level || null, manager_id || null,
      hire_date, salary_amount || null, salary_frequency || 'Monthly',
      contracted_hours_per_week || 40,
    ]);

    const employee = queryOne<any>('SELECT * FROM employees WHERE id = ?', [result.lastInsertRowid]);

    return NextResponse.json({ success: true, data: employee }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to create employee', message: error.message }, { status: 500 });
  }
}
