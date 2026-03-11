import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');
    const violationType = searchParams.get('violation_type');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    let sql = `
      SELECT
        bv.id,
        bv.employee_id,
        bv.violation_type,
        bv.violation_date,
        bv.description,
        bv.severity,
        bv.status,
        bv.resolution_notes,
        bv.resolved_by,
        bv.resolved_at,
        bv.is_recurring,
        bv.preventive_action,
        bv.created_at,
        e.first_name,
        e.last_name,
        e.employee_number,
        d.name as department_name
      FROM bcea_violations bv
      LEFT JOIN employees e ON bv.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;

    const params: unknown[] = [];

    if (employeeId) {
      sql += ` AND bv.employee_id = ?`;
      params.push(employeeId);
    }
    if (violationType) {
      sql += ` AND bv.violation_type = ?`;
      params.push(violationType);
    }
    if (severity) {
      sql += ` AND bv.severity = ?`;
      params.push(severity);
    }
    if (status) {
      sql += ` AND bv.status = ?`;
      params.push(status);
    }
    if (fromDate) {
      sql += ` AND bv.violation_date >= ?`;
      params.push(fromDate);
    }
    if (toDate) {
      sql += ` AND bv.violation_date <= ?`;
      params.push(toDate);
    }

    sql += ` ORDER BY bv.violation_date DESC`;

    const violations = query<any>(sql, params);

    // Summary stats
    const summary = query<any>(`
      SELECT
        violation_type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count
      FROM bcea_violations
      GROUP BY violation_type
      ORDER BY count DESC
    `);

    return NextResponse.json({
      success: true,
      data: {
        violations,
        summary,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch working time violations', message: String(error) },
      { status: 500 }
    );
  }
}
