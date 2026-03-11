import { NextRequest, NextResponse } from 'next/server';
import { query, execute, queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = Math.min(50, parseInt(searchParams.get('per_page') || '20'));
  const offset = (page - 1) * perPage;

  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      conditions.push('pb.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(perPage, offset);

    const batches = query<any>(`
      SELECT pb.*,
        (SELECT COUNT(*) FROM payroll_records pr WHERE pr.batch_id = pb.id) as record_count,
        (SELECT SUM(pr.net_pay) FROM payroll_records pr WHERE pr.batch_id = pb.id) as total_net_pay
      FROM payroll_batches pb
      ${whereClause}
      ORDER BY pb.pay_period_end DESC LIMIT ? OFFSET ?
    `, params);

    return NextResponse.json({ success: true, data: batches });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch payroll batches', message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organization_id, pay_period_start, pay_period_end, pay_date, batch_name } = await request.json();

    const result = execute(`
      INSERT INTO payroll_batches (organization_id, pay_period_start, pay_period_end, pay_date, batch_name, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'Draft', datetime('now'), datetime('now'))
    `, [organization_id || 1, pay_period_start, pay_period_end, pay_date, batch_name || `Payroll ${pay_period_end}`]);

    const newBatch = queryOne<any>('SELECT * FROM payroll_batches WHERE id = ?', [result.lastInsertRowid]);

    return NextResponse.json({ success: true, data: newBatch, message: 'Payroll batch created' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to create payroll batch', message: error.message }, { status: 500 });
  }
}
