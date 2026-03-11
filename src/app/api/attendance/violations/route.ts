import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, parsePagination, paginatedResponse } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, perPage, offset } = parsePagination(searchParams);

    const employee_id = searchParams.get('employee_id');
    const violation_type = searchParams.get('violation_type');
    const status = searchParams.get('status');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    let whereClause = 'WHERE 1=1';
    const params: unknown[] = [];

    if (employee_id) {
      whereClause += ' AND av.employee_id = ?';
      params.push(employee_id);
    }
    if (violation_type) {
      whereClause += ' AND av.violation_type = ?';
      params.push(violation_type);
    }
    if (status) {
      whereClause += ' AND av.status = ?';
      params.push(status);
    }
    if (start_date && end_date) {
      whereClause += ' AND av.violation_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    const countResult = queryOne<any>(
      `SELECT COUNT(*) as total FROM attendance_violations av ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    const violations = query<any>(`
      SELECT av.*,
        e.first_name || ' ' || e.last_name as employee_name,
        e.employee_number,
        ar.rule_name,
        ar.rule_type
      FROM attendance_violations av
      LEFT JOIN employees e ON av.employee_id = e.id
      LEFT JOIN attendance_rules ar ON av.attendance_rule_id = ar.id
      ${whereClause}
      ORDER BY av.violation_date DESC, av.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, perPage, offset]);

    return NextResponse.json(paginatedResponse(violations, page, perPage, total));
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch attendance violations', message: error.message }, { status: 500 });
  }
}
