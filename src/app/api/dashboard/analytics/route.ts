import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'employee';
    const employeeId = searchParams.get('employee_id');

    if (role === 'super_admin' || role === 'hr_manager') {
      // Department stats
      const departmentStats = query<any>(`
        SELECT d.id, d.name,
          COUNT(e.id) as employee_count,
          SUM(CASE WHEN e.employment_status = 'Active' THEN 1 ELSE 0 END) as active_count,
          SUM(CASE WHEN e.employment_status = 'On Leave' THEN 1 ELSE 0 END) as on_leave_count
        FROM departments d
        LEFT JOIN employees e ON e.department_id = d.id AND e.is_active = 1
        GROUP BY d.id, d.name
        ORDER BY employee_count DESC
      `);

      // Location stats
      const locationStats = query<any>(`
        SELECT l.id, l.name, l.province, l.city,
          COUNT(e.id) as employee_count,
          SUM(CASE WHEN e.employment_status = 'Active' THEN 1 ELSE 0 END) as active_count
        FROM locations l
        LEFT JOIN employees e ON e.location_id = l.id AND e.is_active = 1
        WHERE l.is_active = 1
        GROUP BY l.id, l.name
        ORDER BY employee_count DESC
      `);

      // Compliance overview
      const complianceOverview = query<any>(`
        SELECT check_type, status, COUNT(*) as count
        FROM compliance_checks
        GROUP BY check_type, status
        ORDER BY check_type
      `);

      // Workforce metrics
      const workforceMetrics = queryOne<any>(`
        SELECT
          COUNT(*) as total_employees,
          SUM(CASE WHEN employment_type = 'Full-Time' THEN 1 ELSE 0 END) as full_time,
          SUM(CASE WHEN employment_type = 'Part-Time' THEN 1 ELSE 0 END) as part_time,
          SUM(CASE WHEN employment_type = 'Contract' THEN 1 ELSE 0 END) as contract,
          SUM(CASE WHEN employment_type = 'Intern' THEN 1 ELSE 0 END) as intern,
          SUM(CASE WHEN gender = 'Male' THEN 1 ELSE 0 END) as male_count,
          SUM(CASE WHEN gender = 'Female' THEN 1 ELSE 0 END) as female_count,
          SUM(CASE WHEN disability_status = 1 THEN 1 ELSE 0 END) as disability_count,
          AVG(JULIANDAY('now') - JULIANDAY(hire_date)) as avg_tenure_days
        FROM employees WHERE is_active = 1
      `);

      return NextResponse.json({
        success: true,
        data: {
          department_stats: departmentStats,
          location_stats: locationStats,
          compliance_overview: complianceOverview,
          workforce_metrics: workforceMetrics,
        },
      });
    }

    if (role === 'department_manager' || role === 'location_manager') {
      // Team size
      const teamStats = queryOne<any>(`
        SELECT COUNT(*) as team_size,
          SUM(CASE WHEN employment_status = 'Active' THEN 1 ELSE 0 END) as active_count,
          SUM(CASE WHEN employment_status = 'On Leave' THEN 1 ELSE 0 END) as on_leave_count
        FROM employees
        WHERE is_active = 1 AND manager_id = ?
      `, [employeeId]);

      // Shifts this week
      const shiftStats = queryOne<any>(`
        SELECT COUNT(*) as total_shifts,
          SUM(CASE WHEN status = 'Scheduled' THEN 1 ELSE 0 END) as scheduled,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN employee_id IS NULL THEN 1 ELSE 0 END) as open_shifts
        FROM shifts
        WHERE shift_date BETWEEN DATE('now', 'weekday 0', '-6 days') AND DATE('now', 'weekday 0')
          AND department_id IN (SELECT department_id FROM employees WHERE id = ?)
      `, [employeeId]);

      // Leave requests
      const leaveStats = queryOne<any>(`
        SELECT COUNT(*) as pending_requests
        FROM leave_requests lr
        JOIN employees e ON lr.employee_id = e.id
        WHERE lr.status = 'Pending' AND e.manager_id = ?
      `, [employeeId]);

      // Attendance violations
      const attendanceStats = queryOne<any>(`
        SELECT COUNT(*) as violations_this_month
        FROM attendance_violations av
        JOIN employees e ON av.employee_id = e.id
        WHERE e.manager_id = ?
          AND av.violation_date >= DATE('now', 'start of month')
      `, [employeeId]);

      return NextResponse.json({
        success: true,
        data: {
          team: teamStats,
          shifts: shiftStats,
          leave: leaveStats,
          attendance: attendanceStats,
        },
      });
    }

    // Default: employee role
    const myShifts = query<any>(`
      SELECT s.*, l.name as location_name
      FROM shifts s
      LEFT JOIN locations l ON s.location_id = l.id
      WHERE s.employee_id = ? AND s.shift_date >= DATE('now')
      ORDER BY s.shift_date ASC
      LIMIT 10
    `, [employeeId]);

    const myLeave = queryOne<any>(`
      SELECT
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved
      FROM leave_requests
      WHERE employee_id = ? AND start_date >= DATE('now', 'start of year')
    `, [employeeId]);

    const timeToday = queryOne<any>(`
      SELECT clock_in_time, clock_out_time, total_hours
      FROM time_entries
      WHERE employee_id = ? AND DATE(clock_in_time) = DATE('now')
      ORDER BY clock_in_time DESC
      LIMIT 1
    `, [employeeId]);

    const myCompliance = query<any>(`
      SELECT es.*, s.name as skill_name, s.requires_certification
      FROM employee_skills es
      JOIN skills s ON es.skill_id = s.id
      WHERE es.employee_id = ?
        AND s.requires_certification = 1
        AND (es.certification_expiry_date IS NULL OR es.certification_expiry_date <= DATE('now', '+30 days'))
    `, [employeeId]);

    return NextResponse.json({
      success: true,
      data: {
        upcoming_shifts: myShifts,
        leave_summary: myLeave,
        time_today: timeToday,
        expiring_certifications: myCompliance,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics', message: error.message }, { status: 500 });
  }
}
