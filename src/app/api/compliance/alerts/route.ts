import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get('assigned_to');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const alertType = searchParams.get('alert_type');

    let sql = `
      SELECT
        ca.id,
        ca.alert_type,
        ca.severity,
        ca.title,
        ca.description,
        ca.due_date,
        ca.days_until_due,
        ca.responsible_role,
        ca.assigned_to,
        ca.status,
        ca.acknowledged_at,
        ca.resolved_at,
        ca.resolution_notes,
        ca.created_at,
        cc.name as category_name,
        cp.title as checkpoint_title,
        cp.code as checkpoint_code
      FROM compliance_alerts ca
      LEFT JOIN compliance_categories cc ON ca.category_id = cc.id
      LEFT JOIN compliance_checkpoints cp ON ca.checkpoint_id = cp.id
      WHERE 1=1
    `;

    const params: unknown[] = [];

    if (assignedTo) {
      sql += ` AND ca.assigned_to = ?`;
      params.push(assignedTo);
    }
    if (severity) {
      sql += ` AND ca.severity = ?`;
      params.push(severity);
    }
    if (status) {
      sql += ` AND ca.status = ?`;
      params.push(status);
    }
    if (alertType) {
      sql += ` AND ca.alert_type = ?`;
      params.push(alertType);
    }

    sql += ` ORDER BY
      CASE ca.severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
      ca.due_date ASC`;

    const alerts = query<any>(sql, params);

    return NextResponse.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch compliance alerts', message: String(error) },
      { status: 500 }
    );
  }
}
