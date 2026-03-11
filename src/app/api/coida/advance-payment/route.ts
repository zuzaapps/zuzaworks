import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      payment_year,
      amount_due,
      amount_paid,
      payment_date,
      payment_method,
      payment_reference,
      notes,
    } = body;

    if (!payment_year || !amount_paid) {
      return NextResponse.json(
        { success: false, error: 'payment_year and amount_paid are required' },
        { status: 400 }
      );
    }

    const status = amount_paid >= (amount_due || 0) ? 'paid' : 'partial';

    const result = execute(
      `INSERT INTO coida_advance_payments (
        payment_year, amount_due, amount_paid, payment_date,
        payment_method, payment_reference, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payment_year,
        amount_due || null,
        amount_paid,
        payment_date || new Date().toISOString().split('T')[0],
        payment_method || null,
        payment_reference || null,
        status,
        notes || null,
      ]
    );

    const payment = queryOne<any>(
      `SELECT * FROM coida_advance_payments WHERE id = ?`,
      [result.lastInsertRowid]
    );

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to record advance payment', message: String(error) },
      { status: 500 }
    );
  }
}
