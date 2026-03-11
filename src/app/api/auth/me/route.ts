import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const userInfo = queryOne<any>(
      'SELECT id, email, first_name, last_name, role, employee_id, is_active, last_login, created_at FROM users WHERE id = ?',
      [user.userId]
    );

    if (!userInfo) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Try to get permissions
    let permissions: string[] = [];
    try {
      const perms = query<any>(`
        SELECT DISTINCT p.name FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = ?
      `, [user.userId]);
      permissions = perms.map(p => p.name);
    } catch {}

    return NextResponse.json({
      success: true,
      data: {
        ...userInfo,
        name: `${userInfo.first_name} ${userInfo.last_name}`,
        permissions
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch user info', message: error.message }, { status: 500 });
  }
}
