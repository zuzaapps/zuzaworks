import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get('department_id');
  const forecastType = searchParams.get('forecast_type');
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = Math.min(50, parseInt(searchParams.get('per_page') || '20'));
  const offset = (page - 1) * perPage;

  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (departmentId) {
      conditions.push('lf.department_id = ?');
      params.push(departmentId);
    }
    if (forecastType) {
      conditions.push('lf.forecast_type = ?');
      params.push(forecastType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(perPage, offset);

    const forecasts = query<any>(`
      SELECT lf.*, d.name as department_name
      FROM labor_forecasts lf
      LEFT JOIN departments d ON lf.department_id = d.id
      ${whereClause}
      ORDER BY lf.forecast_date DESC LIMIT ? OFFSET ?
    `, params);

    return NextResponse.json({ success: true, data: forecasts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch forecasts', message: error.message }, { status: 500 });
  }
}
