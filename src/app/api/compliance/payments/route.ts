import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentType = searchParams.get('payment_type');
    const status = searchParams.get('status');
    const year = searchParams.get('year');

    let sql = `
      SELECT
        id,
        payment_type,
        period_start,
        period_end,
        due_date,
        amount_due,
        amount_paid,
        payment_date,
        payment_reference,
        status,
        late_penalty,
        notes,
        created_at,
        updated_at
      FROM statutory_payments
      WHERE 1=1
    `;

    const params: unknown[] = [];

    if (paymentType) {
      sql += ` AND payment_type = ?`;
      params.push(paymentType);
    }
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (year) {
      sql += ` AND strftime('%Y', due_date) = ?`;
      params.push(year);
    }

    sql += ` ORDER BY due_date DESC`;

    const payments = query<any>(sql, params);

    return NextResponse.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statutory payments', message: String(error) },
      { status: 500 }
    );
  }
}
