import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const setaId = searchParams.get('seta_id');
    const status = searchParams.get('status');
    const grantType = searchParams.get('grant_type');

    // SETA grant tracking
    let grantSql = `
      SELECT
        sg.id,
        sg.seta_name,
        sg.seta_id,
        sg.grant_type,
        sg.grant_reference,
        sg.application_date,
        sg.approval_date,
        sg.grant_amount,
        sg.amount_received,
        sg.amount_pending,
        sg.financial_year,
        sg.status,
        sg.conditions,
        sg.reporting_deadline,
        sg.notes,
        sg.created_at,
        (SELECT COUNT(*) FROM interns i
         JOIN intern_programs ip ON i.program_id = ip.id
         WHERE ip.seta_id = sg.seta_id AND i.status = 'active') as linked_active_interns,
        (SELECT COUNT(*) FROM interns i
         JOIN intern_programs ip ON i.program_id = ip.id
         WHERE ip.seta_id = sg.seta_id AND i.status = 'completed') as linked_completed_interns
      FROM seta_grants sg
      WHERE 1=1
    `;

    const params: unknown[] = [];

    if (setaId) {
      grantSql += ` AND sg.seta_id = ?`;
      params.push(setaId);
    }
    if (status) {
      grantSql += ` AND sg.status = ?`;
      params.push(status);
    }
    if (grantType) {
      grantSql += ` AND sg.grant_type = ?`;
      params.push(grantType);
    }

    grantSql += ` ORDER BY sg.application_date DESC`;

    const grants = query<any>(grantSql, params);

    // Summary
    const summary = queryOne<any>(`
      SELECT
        COUNT(*) as total_grants,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_grants,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_grants,
        COALESCE(SUM(grant_amount), 0) as total_grant_amount,
        COALESCE(SUM(amount_received), 0) as total_received,
        COALESCE(SUM(amount_pending), 0) as total_pending
      FROM seta_grants
    `);

    // WSP/ATR status
    const wspStatus = query<any>(`
      SELECT
        id,
        financial_year,
        submission_type,
        submission_date,
        submission_deadline,
        status,
        seta_name,
        reference_number
      FROM seta_wsp_submissions
      ORDER BY financial_year DESC
      LIMIT 5
    `);

    return NextResponse.json({
      success: true,
      data: {
        grants,
        summary,
        wsp_submissions: wspStatus,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SETA grant tracking data', message: String(error) },
      { status: 500 }
    );
  }
}
