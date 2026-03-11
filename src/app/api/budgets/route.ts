import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get('department_id');
  const year = searchParams.get('year');
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = Math.min(50, parseInt(searchParams.get('per_page') || '20'));
  const offset = (page - 1) * perPage;

  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (departmentId) {
      conditions.push('bp.department_id = ?');
      params.push(departmentId);
    }
    if (year) {
      conditions.push('bp.fiscal_year = ?');
      params.push(year);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(perPage, offset);

    const budgets = query<any>(`
      SELECT bp.*, d.name as department_name,
        (SELECT COALESCE(SUM(bli.amount), 0) FROM budget_line_items bli WHERE bli.budget_period_id = bp.id) as total_allocated,
        (SELECT COALESCE(SUM(bli.actual_amount), 0) FROM budget_line_items bli WHERE bli.budget_period_id = bp.id) as total_spent
      FROM budget_periods bp
      LEFT JOIN departments d ON bp.department_id = d.id
      ${whereClause}
      ORDER BY bp.fiscal_year DESC, bp.period_start DESC LIMIT ? OFFSET ?
    `, params);

    return NextResponse.json({ success: true, data: budgets });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch budgets', message: error.message }, { status: 500 });
  }
}
