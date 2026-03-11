import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ internId: string }> }
) {
  const { internId } = await params;

  try {
    // Verify intern exists
    const intern = queryOne<any>('SELECT id, first_name, last_name FROM interns WHERE id = ?', [internId]);
    if (!intern) {
      return NextResponse.json({ success: false, error: 'Intern not found' }, { status: 404 });
    }

    const stipends = query<any>(`
      SELECT * FROM intern_stipend_payments
      WHERE intern_id = ?
      ORDER BY payment_year DESC, payment_month DESC
    `, [internId]);

    // Calculate totals
    const totals = queryOne<any>(`
      SELECT
        COUNT(*) AS total_payments,
        COALESCE(SUM(gross_amount), 0) AS total_gross,
        COALESCE(SUM(net_amount), 0) AS total_net,
        COALESCE(SUM(total_deductions), 0) AS total_deductions
      FROM intern_stipend_payments
      WHERE intern_id = ?
    `, [internId]);

    return NextResponse.json({
      success: true,
      data: {
        intern: { id: intern.id, first_name: intern.first_name, last_name: intern.last_name },
        stipends,
        totals
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stipend history', message: error.message },
      { status: 500 }
    );
  }
}
