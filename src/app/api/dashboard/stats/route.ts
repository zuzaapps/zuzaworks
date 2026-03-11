import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const employeeStats = query<any>(`
      SELECT COUNT(*) as total_employees,
        SUM(CASE WHEN employment_status = 'Active' THEN 1 ELSE 0 END) as active_employees,
        SUM(CASE WHEN employment_status = 'On Leave' THEN 1 ELSE 0 END) as on_leave_today
      FROM employees WHERE is_active = 1
    `);
    const shiftStats = query<any>(`
      SELECT COUNT(*) as shifts_today,
        SUM(CASE WHEN employee_id IS NULL THEN 1 ELSE 0 END) as open_shifts
      FROM shifts WHERE shift_date = DATE('now')
    `);
    const leaveStats = query<any>(`SELECT COUNT(*) as pending_requests FROM leave_requests WHERE status = 'Pending'`);

    return NextResponse.json({
      success: true,
      data: {
        total_employees: employeeStats[0]?.total_employees || 0,
        active_employees: employeeStats[0]?.active_employees || 0,
        on_leave_today: employeeStats[0]?.on_leave_today || 0,
        shifts_today: shiftStats[0]?.shifts_today || 0,
        open_shifts: shiftStats[0]?.open_shifts || 0,
        pending_leave_requests: leaveStats[0]?.pending_requests || 0,
        compliance_score: 94,
        training_completion_rate: 78,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch dashboard stats', message: String(error) }, { status: 500 });
  }
}
