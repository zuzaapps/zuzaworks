import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET() {
  try {
    // Overall compliance score
    const scoreData = queryOne<any>(`
      SELECT
        COUNT(*) as total_checkpoints,
        SUM(CASE WHEN ocs.status = 'compliant' THEN 1 ELSE 0 END) as compliant_count,
        SUM(CASE WHEN ocs.status = 'non_compliant' THEN 1 ELSE 0 END) as non_compliant_count,
        SUM(CASE WHEN ocs.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN ocs.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN ocs.status = 'not_applicable' THEN 1 ELSE 0 END) as not_applicable_count
      FROM organization_compliance_status ocs
      JOIN compliance_checkpoints cp ON ocs.checkpoint_id = cp.id
      WHERE cp.is_active = 1
    `);

    const totalApplicable = (scoreData?.total_checkpoints || 0) - (scoreData?.not_applicable_count || 0);
    const complianceScore = totalApplicable > 0
      ? Math.round(((scoreData?.compliant_count || 0) / totalApplicable) * 100)
      : 0;

    // Category-level stats
    const categoryStats = query<any>(`
      SELECT
        cc.id,
        cc.code,
        cc.name,
        cc.risk_level,
        COUNT(cp.id) as total_checkpoints,
        SUM(CASE WHEN ocs.status = 'compliant' THEN 1 ELSE 0 END) as compliant,
        SUM(CASE WHEN ocs.status = 'non_compliant' THEN 1 ELSE 0 END) as non_compliant,
        SUM(CASE WHEN ocs.status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN ocs.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress
      FROM compliance_categories cc
      LEFT JOIN compliance_checkpoints cp ON cc.id = cp.category_id AND cp.is_active = 1
      LEFT JOIN organization_compliance_status ocs ON cp.id = ocs.checkpoint_id
      WHERE cc.is_active = 1
      GROUP BY cc.id
      ORDER BY cc.risk_level DESC, cc.name
    `);

    // Critical alerts
    const criticalAlerts = query<any>(`
      SELECT
        ca.id,
        ca.alert_type,
        ca.severity,
        ca.title,
        ca.description,
        ca.due_date,
        ca.days_until_due,
        ca.status,
        ca.created_at
      FROM compliance_alerts ca
      WHERE ca.severity = 'critical' AND ca.status IN ('new', 'acknowledged')
      ORDER BY ca.due_date ASC
      LIMIT 10
    `);

    // Expiring items
    const expiringItems = query<any>(`
      SELECT
        ocs.id,
        cp.title,
        cp.code,
        cc.name as category_name,
        ocs.expiry_date,
        CAST(julianday(ocs.expiry_date) - julianday('now') AS INTEGER) as days_until_expiry
      FROM organization_compliance_status ocs
      JOIN compliance_checkpoints cp ON ocs.checkpoint_id = cp.id
      JOIN compliance_categories cc ON cp.category_id = cc.id
      WHERE ocs.expiry_date IS NOT NULL
        AND ocs.expiry_date <= DATE('now', '+30 days')
        AND ocs.status = 'compliant'
      ORDER BY ocs.expiry_date ASC
      LIMIT 10
    `);

    return NextResponse.json({
      success: true,
      data: {
        compliance_score: complianceScore,
        summary: {
          total_checkpoints: scoreData?.total_checkpoints || 0,
          compliant: scoreData?.compliant_count || 0,
          non_compliant: scoreData?.non_compliant_count || 0,
          pending: scoreData?.pending_count || 0,
          in_progress: scoreData?.in_progress_count || 0,
          not_applicable: scoreData?.not_applicable_count || 0,
        },
        category_stats: categoryStats,
        critical_alerts: criticalAlerts,
        expiring_items: expiringItems,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch compliance overview', message: String(error) },
      { status: 500 }
    );
  }
}
