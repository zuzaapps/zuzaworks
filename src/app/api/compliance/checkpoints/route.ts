import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const checkType = searchParams.get('check_type');
    const frequency = searchParams.get('frequency');

    let sql = `
      SELECT
        cp.id,
        cp.code,
        cp.title,
        cp.description,
        cp.check_type,
        cp.frequency,
        cp.responsible_role,
        cp.days_before_alert,
        cp.is_automated,
        cp.penalty_amount_min,
        cp.penalty_amount_max,
        cp.legislation_reference,
        cc.id as category_id,
        cc.code as category_code,
        cc.name as category_name,
        cc.risk_level as category_risk_level,
        ocs.status as compliance_status,
        ocs.compliance_date,
        ocs.expiry_date,
        ocs.next_review_date,
        ocs.notes as status_notes,
        ocs.last_checked_at
      FROM compliance_checkpoints cp
      JOIN compliance_categories cc ON cp.category_id = cc.id
      LEFT JOIN organization_compliance_status ocs ON cp.id = ocs.checkpoint_id
      WHERE cp.is_active = 1
    `;

    const params: unknown[] = [];

    if (category) {
      sql += ` AND cc.code = ?`;
      params.push(category);
    }
    if (status) {
      sql += ` AND ocs.status = ?`;
      params.push(status);
    }
    if (checkType) {
      sql += ` AND cp.check_type = ?`;
      params.push(checkType);
    }
    if (frequency) {
      sql += ` AND cp.frequency = ?`;
      params.push(frequency);
    }

    sql += ` ORDER BY cc.risk_level DESC, cc.name, cp.title`;

    const checkpoints = query<any>(sql, params);

    return NextResponse.json({
      success: true,
      data: checkpoints,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch compliance checkpoints', message: String(error) },
      { status: 500 }
    );
  }
}
