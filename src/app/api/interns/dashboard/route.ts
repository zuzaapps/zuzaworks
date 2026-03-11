import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET() {
  try {
    // Overall stats
    const stats = queryOne<any>(`
      SELECT
        COUNT(*) AS total_interns,
        SUM(CASE WHEN intern_status = 'active' THEN 1 ELSE 0 END) AS active_interns,
        SUM(CASE WHEN intern_status = 'completed' THEN 1 ELSE 0 END) AS completed_interns,
        SUM(CASE WHEN intern_status = 'applicant' THEN 1 ELSE 0 END) AS applicants,
        SUM(CASE WHEN intern_status = 'registered' THEN 1 ELSE 0 END) AS registered,
        SUM(CASE WHEN intern_status = 'terminated' THEN 1 ELSE 0 END) AS terminated,
        SUM(CASE WHEN intern_status = 'withdrawn' THEN 1 ELSE 0 END) AS withdrawn
      FROM interns
    `);

    // Program breakdown
    const programBreakdown = query<any>(`
      SELECT
        ip.id AS program_id,
        ip.program_name,
        ip.program_type,
        ip.stipend_amount,
        COUNT(i.id) AS total_interns,
        SUM(CASE WHEN i.intern_status = 'active' THEN 1 ELSE 0 END) AS active_interns,
        SUM(CASE WHEN i.intern_status = 'completed' THEN 1 ELSE 0 END) AS completed_interns
      FROM intern_programs ip
      LEFT JOIN interns i ON i.program_id = ip.id
      GROUP BY ip.id
      ORDER BY ip.program_name
    `);

    // Status breakdown by legal status
    const statusBreakdown = query<any>(`
      SELECT
        legal_status,
        intern_status,
        COUNT(*) AS count
      FROM interns
      GROUP BY legal_status, intern_status
      ORDER BY legal_status, intern_status
    `);

    // Recent interns (last 10)
    const recentInterns = query<any>(`
      SELECT i.id, i.first_name, i.last_name, i.intern_status, i.legal_status,
        i.start_date, i.created_at, ip.program_name, ip.program_type
      FROM interns i
      LEFT JOIN intern_programs ip ON i.program_id = ip.id
      ORDER BY i.created_at DESC
      LIMIT 10
    `);

    // Stipend summary for current month
    const now = new Date();
    const stipendSummary = queryOne<any>(`
      SELECT
        COUNT(*) AS payments_made,
        COALESCE(SUM(gross_amount), 0) AS total_gross,
        COALESCE(SUM(net_amount), 0) AS total_net
      FROM intern_stipend_payments
      WHERE payment_month = ? AND payment_year = ?
    `, [now.getMonth() + 1, now.getFullYear()]);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        programBreakdown,
        statusBreakdown,
        recentInterns,
        stipendSummary,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data', message: error.message },
      { status: 500 }
    );
  }
}
