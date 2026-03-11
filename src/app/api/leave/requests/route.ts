import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute, parsePagination, paginatedResponse } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, perPage, offset } = parsePagination(searchParams);

    const employee_id = searchParams.get('employee_id');
    const status = searchParams.get('status');

    let whereClause = 'WHERE 1=1';
    const params: unknown[] = [];

    if (employee_id) {
      whereClause += ' AND lr.employee_id = ?';
      params.push(employee_id);
    }
    if (status) {
      whereClause += ' AND lr.status = ?';
      params.push(status);
    }

    const countResult = queryOne<any>(
      `SELECT COUNT(*) as total FROM leave_requests lr ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    const requests = query<any>(`
      SELECT lr.*,
        e.first_name || ' ' || e.last_name as employee_name,
        lt.name as leave_type_name, lt.category as leave_type_category,
        r.first_name || ' ' || r.last_name as reviewed_by_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN employees r ON lr.reviewed_by = r.id
      ${whereClause}
      ORDER BY lr.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, perPage, offset]);

    return NextResponse.json(paginatedResponse(requests, page, perPage, total));
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch leave requests', message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employee_id, leave_type_id, start_date, end_date,
      total_days, reason, supporting_document_url, document_type,
    } = body;

    if (!employee_id || !leave_type_id || !start_date || !end_date || !total_days) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: employee_id, leave_type_id, start_date, end_date, total_days' },
        { status: 400 }
      );
    }

    // Get current leave balance
    const employee = queryOne<any>(
      'SELECT leave_annual_balance, leave_sick_balance, leave_family_balance FROM employees WHERE id = ?',
      [employee_id]
    );
    const leaveType = queryOne<any>('SELECT * FROM leave_types WHERE id = ?', [leave_type_id]);

    let balanceBefore: number | null = null;
    let balanceAfter: number | null = null;

    if (employee && leaveType) {
      if (leaveType.category === 'Annual') {
        balanceBefore = employee.leave_annual_balance;
        balanceAfter = employee.leave_annual_balance - total_days;
      } else if (leaveType.category === 'Sick') {
        balanceBefore = employee.leave_sick_balance;
        balanceAfter = employee.leave_sick_balance - total_days;
      } else if (leaveType.category === 'Family Responsibility') {
        balanceBefore = employee.leave_family_balance;
        balanceAfter = employee.leave_family_balance - total_days;
      }
    }

    const result = execute(`
      INSERT INTO leave_requests (
        employee_id, leave_type_id, start_date, end_date, total_days,
        reason, supporting_document_url, document_type,
        balance_before, balance_after, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
    `, [
      employee_id, leave_type_id, start_date, end_date, total_days,
      reason || null, supporting_document_url || null, document_type || null,
      balanceBefore, balanceAfter,
    ]);

    const leaveRequest = queryOne<any>('SELECT * FROM leave_requests WHERE id = ?', [result.lastInsertRowid]);

    return NextResponse.json({ success: true, data: leaveRequest }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to create leave request', message: error.message }, { status: 500 });
  }
}
