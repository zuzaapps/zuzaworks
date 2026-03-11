import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const year = searchParams.get('year');

    let sql = `
      SELECT
        id,
        return_year,
        total_employees,
        total_annual_earnings,
        assessment_rate,
        assessment_amount,
        industry_code,
        submission_date,
        submitted_by,
        acceptance_date,
        status,
        reference_number,
        notes,
        created_at
      FROM coida_annual_returns
      WHERE 1=1
    `;

    const params: unknown[] = [];

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (year) {
      sql += ` AND return_year = ?`;
      params.push(year);
    }

    sql += ` ORDER BY return_year DESC`;

    const returns = query<any>(sql, params);

    return NextResponse.json({
      success: true,
      data: returns,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch annual returns', message: String(error) },
      { status: 500 }
    );
  }
}
