import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = requireRole(request, 'executive', 'manager', 'super_admin', 'hr_manager');
  if (user instanceof NextResponse) return user;

  try {
    const users = query<any>(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.employee_id, u.is_active, u.last_login, u.created_at,
             e.employee_number, e.job_title, e.department_id
      FROM users u LEFT JOIN employees e ON u.employee_id = e.id
      ORDER BY u.created_at DESC
    `);
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch users', message: error.message }, { status: 500 });
  }
}
