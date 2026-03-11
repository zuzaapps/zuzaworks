import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');
    const status = searchParams.get('status');
    const claimType = searchParams.get('claim_type');

    let sql = `
      SELECT
        cc.id,
        cc.claim_reference,
        cc.incident_id,
        cc.employee_id,
        cc.claim_type,
        cc.claim_description,
        cc.medical_costs,
        cc.temporary_disability_days,
        cc.permanent_disability_percentage,
        cc.fatal,
        cc.submission_date,
        cc.submitted_by,
        cc.acceptance_date,
        cc.rejection_reason,
        cc.compensation_amount,
        cc.compensation_paid_date,
        cc.status,
        cc.notes,
        cc.created_at,
        ci.incident_number,
        ci.incident_date,
        ci.injury_severity,
        e.first_name,
        e.last_name,
        e.employee_number,
        d.name as department_name
      FROM coida_claims cc
      LEFT JOIN coida_incidents ci ON cc.incident_id = ci.id
      LEFT JOIN employees e ON cc.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;

    const params: unknown[] = [];

    if (employeeId) {
      sql += ` AND cc.employee_id = ?`;
      params.push(employeeId);
    }
    if (status) {
      sql += ` AND cc.status = ?`;
      params.push(status);
    }
    if (claimType) {
      sql += ` AND cc.claim_type = ?`;
      params.push(claimType);
    }

    sql += ` ORDER BY cc.submission_date DESC`;

    const claims = query<any>(sql, params);

    return NextResponse.json({
      success: true,
      data: claims,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch claims', message: String(error) },
      { status: 500 }
    );
  }
}
