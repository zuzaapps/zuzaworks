import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('report_type');
    const status = searchParams.get('status');
    const year = searchParams.get('year');

    let sql = `
      SELECT
        id,
        report_type,
        reporting_period_start,
        reporting_period_end,
        submission_deadline,
        submission_date,
        submission_reference,
        status,
        submitted_by,
        report_document_path,
        notes,
        created_at,
        updated_at
      FROM statutory_reports
      WHERE 1=1
    `;

    const params: unknown[] = [];

    if (reportType) {
      sql += ` AND report_type = ?`;
      params.push(reportType);
    }
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (year) {
      sql += ` AND strftime('%Y', submission_deadline) = ?`;
      params.push(year);
    }

    sql += ` ORDER BY submission_deadline DESC`;

    const reports = query<any>(sql, params);

    return NextResponse.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statutory reports', message: String(error) },
      { status: 500 }
    );
  }
}
