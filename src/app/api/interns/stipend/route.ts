import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      intern_id, payment_month, payment_year, payment_date,
      basic_stipend, transport_allowance, meal_allowance, other_allowances,
      paye_deducted, uif_deducted, other_deductions,
      payment_method, payment_reference, notes,
    } = body;

    if (!intern_id || !payment_month || !payment_year || !payment_date || basic_stipend === undefined) {
      return NextResponse.json(
        { success: false, error: 'intern_id, payment_month, payment_year, payment_date, and basic_stipend are required' },
        { status: 400 }
      );
    }

    // Verify intern exists and is active
    const intern = queryOne<any>('SELECT id, intern_status FROM interns WHERE id = ?', [intern_id]);
    if (!intern) {
      return NextResponse.json(
        { success: false, error: 'Intern not found' },
        { status: 404 }
      );
    }

    // Check for duplicate payment
    const existingPayment = queryOne<any>(
      'SELECT id FROM intern_stipend_payments WHERE intern_id = ? AND payment_month = ? AND payment_year = ?',
      [intern_id, payment_month, payment_year]
    );
    if (existingPayment) {
      return NextResponse.json(
        { success: false, error: 'Stipend payment already exists for this period' },
        { status: 409 }
      );
    }

    const transportAmt = transport_allowance || 0;
    const mealAmt = meal_allowance || 0;
    const otherAmt = other_allowances || 0;
    const grossAmount = basic_stipend + transportAmt + mealAmt + otherAmt;

    const payeAmt = paye_deducted || 0;
    const uifAmt = uif_deducted || 0;
    const otherDed = other_deductions || 0;
    const totalDeductions = payeAmt + uifAmt + otherDed;

    const netAmount = grossAmount - totalDeductions;

    const result = execute(`
      INSERT INTO intern_stipend_payments (
        intern_id, payment_month, payment_year, payment_date,
        basic_stipend, transport_allowance, meal_allowance, other_allowances,
        gross_amount, paye_deducted, uif_deducted, other_deductions,
        total_deductions, net_amount, payment_method, payment_reference, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      intern_id, payment_month, payment_year, payment_date,
      basic_stipend, transportAmt, mealAmt, otherAmt,
      grossAmount, payeAmt, uifAmt, otherDed,
      totalDeductions, netAmount, payment_method || 'eft',
      payment_reference || null, notes || null,
    ]);

    return NextResponse.json(
      { success: true, data: { id: result.lastInsertRowid, net_amount: netAmount }, message: 'Stipend payment processed successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to process stipend payment', message: error.message },
      { status: 500 }
    );
  }
}
