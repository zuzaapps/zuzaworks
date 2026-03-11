import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    let sql = `
      SELECT
        ci.id,
        ci.incident_number,
        ci.employee_id,
        ci.incident_date,
        ci.incident_time,
        ci.incident_type,
        ci.location_description,
        ci.description,
        ci.injury_description,
        ci.body_part_injured,
        ci.injury_severity,
        ci.days_absent,
        ci.status,
        ci.wcl2_submitted,
        ci.reported_by,
        ci.created_at,
        e.first_name,
        e.last_name,
        e.employee_number,
        d.name as department_name
      FROM coida_incidents ci
      LEFT JOIN employees e ON ci.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;

    const params: unknown[] = [];

    if (employeeId) {
      sql += ` AND ci.employee_id = ?`;
      params.push(employeeId);
    }
    if (status) {
      sql += ` AND ci.status = ?`;
      params.push(status);
    }
    if (severity) {
      sql += ` AND ci.injury_severity = ?`;
      params.push(severity);
    }
    if (fromDate) {
      sql += ` AND ci.incident_date >= ?`;
      params.push(fromDate);
    }
    if (toDate) {
      sql += ` AND ci.incident_date <= ?`;
      params.push(toDate);
    }

    sql += ` ORDER BY ci.incident_date DESC`;

    const incidents = query<any>(sql, params);

    return NextResponse.json({
      success: true,
      data: incidents,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch incidents', message: String(error) },
      { status: 500 }
    );
  }
}
