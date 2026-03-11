import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await params;

    // Employee compliance statuses
    const complianceStatuses = query<any>(
      `SELECT
        ecs.id,
        ecs.status,
        ecs.compliance_date,
        ecs.expiry_date,
        ecs.next_review_date,
        ecs.notes,
        ecs.last_checked_at,
        cp.id as checkpoint_id,
        cp.code as checkpoint_code,
        cp.title as checkpoint_title,
        cp.check_type,
        cp.frequency,
        cc.name as category_name,
        cc.code as category_code,
        cc.risk_level as category_risk_level
      FROM employee_compliance_status ecs
      JOIN compliance_checkpoints cp ON ecs.checkpoint_id = cp.id
      JOIN compliance_categories cc ON cp.category_id = cc.id
      WHERE ecs.employee_id = ? AND cp.is_active = 1
      ORDER BY cc.risk_level DESC, cc.name, cp.title`,
      [employeeId]
    );

    // Employee score
    const scoreData = queryOne<any>(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN ecs.status = 'compliant' THEN 1 ELSE 0 END) as compliant,
        SUM(CASE WHEN ecs.status = 'non_compliant' THEN 1 ELSE 0 END) as non_compliant,
        SUM(CASE WHEN ecs.status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN ecs.status = 'not_applicable' THEN 1 ELSE 0 END) as not_applicable
      FROM employee_compliance_status ecs
      JOIN compliance_checkpoints cp ON ecs.checkpoint_id = cp.id
      WHERE ecs.employee_id = ? AND cp.is_active = 1`,
      [employeeId]
    );

    const totalApplicable = (scoreData?.total || 0) - (scoreData?.not_applicable || 0);
    const score = totalApplicable > 0
      ? Math.round(((scoreData?.compliant || 0) / totalApplicable) * 100)
      : 0;

    // Employee-specific alerts
    const alerts = query<any>(
      `SELECT id, alert_type, severity, title, description, due_date, status, created_at
       FROM compliance_alerts
       WHERE employee_id = ? AND status IN ('new', 'acknowledged', 'in_progress')
       ORDER BY severity DESC, due_date ASC`,
      [employeeId]
    );

    // Training records
    const trainingRecords = query<any>(
      `SELECT id, training_name, training_provider, training_date, completion_date,
              expiry_date, certificate_number, status
       FROM employee_training_records
       WHERE employee_id = ?
       ORDER BY training_date DESC`,
      [employeeId]
    );

    // Contract status
    const contractStatus = queryOne<any>(
      `SELECT * FROM employment_contract_status WHERE employee_id = ?`,
      [employeeId]
    );

    return NextResponse.json({
      success: true,
      data: {
        compliance_score: score,
        summary: {
          total: scoreData?.total || 0,
          compliant: scoreData?.compliant || 0,
          non_compliant: scoreData?.non_compliant || 0,
          pending: scoreData?.pending || 0,
          not_applicable: scoreData?.not_applicable || 0,
        },
        statuses: complianceStatuses,
        alerts,
        training_records: trainingRecords,
        contract_status: contractStatus,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employee compliance', message: String(error) },
      { status: 500 }
    );
  }
}
