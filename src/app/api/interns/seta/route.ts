import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const setaName = searchParams.get('seta_name');
  const status = searchParams.get('status');

  try {
    let where = '1=1';
    const params: any[] = [];
    if (setaName) { where += ' AND sr.seta_name = ?'; params.push(setaName); }
    if (status) { where += ' AND sr.registration_status = ?'; params.push(status); }

    // Get all SETA registrations with intern and program details
    const registrations = query<any>(`
      SELECT sr.*,
        i.first_name, i.last_name, i.id_number, i.intern_status,
        ip.program_name, ip.program_type, ip.qualification_title, ip.qualification_nqf_level
      FROM seta_registrations sr
      JOIN interns i ON sr.intern_id = i.id
      LEFT JOIN intern_programs ip ON sr.program_id = ip.id
      WHERE ${where}
      ORDER BY sr.registration_date DESC
    `, params);

    // Grant summary
    const grantSummary = queryOne<any>(`
      SELECT
        COUNT(*) AS total_registrations,
        SUM(CASE WHEN registration_status = 'registered' THEN 1 ELSE 0 END) AS active_registrations,
        SUM(CASE WHEN commencement_grant_claimed = 1 THEN 1 ELSE 0 END) AS commencement_grants_claimed,
        SUM(CASE WHEN progress_grant_claimed = 1 THEN 1 ELSE 0 END) AS progress_grants_claimed,
        SUM(CASE WHEN completion_grant_claimed = 1 THEN 1 ELSE 0 END) AS completion_grants_claimed,
        COALESCE(SUM(commencement_grant_amount), 0) AS total_commencement_amount,
        COALESCE(SUM(progress_grant_amount), 0) AS total_progress_amount,
        COALESCE(SUM(completion_grant_amount), 0) AS total_completion_amount,
        COALESCE(SUM(total_grant_received), 0) AS grand_total_grants
      FROM seta_registrations
    `);

    // Overdue quarterly reports
    const overdueReports = query<any>(`
      SELECT sr.id, sr.intern_id, sr.seta_name, sr.next_quarterly_report_due,
        i.first_name, i.last_name, ip.program_name
      FROM seta_registrations sr
      JOIN interns i ON sr.intern_id = i.id
      LEFT JOIN intern_programs ip ON sr.program_id = ip.id
      WHERE sr.registration_status = 'registered'
        AND sr.next_quarterly_report_due IS NOT NULL
        AND sr.next_quarterly_report_due < date('now')
      ORDER BY sr.next_quarterly_report_due ASC
    `);

    return NextResponse.json({
      success: true,
      data: {
        registrations,
        grantSummary,
        overdueReports
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SETA tracking data', message: error.message },
      { status: 500 }
    );
  }
}
