import { NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';

export async function GET() {
  try {
    // Get current Letter of Good Standing
    const currentLogs = queryOne<any>(`
      SELECT
        id,
        registration_number,
        issue_date,
        expiry_date,
        status,
        certificate_number,
        document_path,
        CAST(julianday(expiry_date) - julianday('now') AS INTEGER) as days_until_expiry,
        created_at
      FROM coida_letter_of_good_standing
      WHERE status = 'valid'
      ORDER BY expiry_date DESC
      LIMIT 1
    `);

    // Get LOGS history
    const history = query<any>(`
      SELECT
        id,
        registration_number,
        issue_date,
        expiry_date,
        status,
        certificate_number,
        created_at
      FROM coida_letter_of_good_standing
      ORDER BY issue_date DESC
      LIMIT 10
    `);

    // Check requirements for LOGS
    const registration = queryOne<any>(`
      SELECT status FROM coida_registration WHERE id = 1
    `);

    const latestReturn = queryOne<any>(`
      SELECT status, return_year FROM coida_annual_returns
      ORDER BY return_year DESC LIMIT 1
    `);

    const outstandingPayments = queryOne<any>(`
      SELECT COUNT(*) as count FROM coida_advance_payments
      WHERE status = 'overdue'
    `);

    const requirements = {
      registered: registration?.status === 'active',
      annual_return_submitted: latestReturn?.status === 'accepted',
      no_outstanding_payments: (outstandingPayments?.count || 0) === 0,
      eligible_for_logs: false,
    };
    requirements.eligible_for_logs = requirements.registered && requirements.annual_return_submitted && requirements.no_outstanding_payments;

    return NextResponse.json({
      success: true,
      data: {
        current: currentLogs || null,
        history,
        requirements,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Letter of Good Standing status', message: String(error) },
      { status: 500 }
    );
  }
}
