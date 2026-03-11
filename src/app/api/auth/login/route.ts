import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, queryOne, execute } from '@/lib/db';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 });
  }

  try {
    // Try advanced auth first (with roles table)
    const userWithRole = queryOne<any>(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, u.password_hash,
             r.id as role_id, r.name as role_name, r.display_name as role_display_name, r.level as role_level
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = ? AND u.is_active = 1
      LIMIT 1
    `, [email]);

    if (!userWithRole) {
      // Try simple auth (users table with role column)
      const simpleUser = queryOne<any>(`
        SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = ?
      `, [email]);

      if (!simpleUser) {
        return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
      }

      if (!simpleUser.is_active) {
        return NextResponse.json({ success: false, error: 'Account is deactivated' }, { status: 403 });
      }

      if (simpleUser.password_hash) {
        const isValid = await bcrypt.compare(password, simpleUser.password_hash);
        if (!isValid) {
          return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
        }
      }

      try { execute('UPDATE users SET last_login = datetime("now") WHERE id = ?', [simpleUser.id]); } catch {}

      const token = generateToken(simpleUser.id, simpleUser.email, simpleUser.role || 'employee');

      return NextResponse.json({
        success: true,
        data: {
          token,
          user: {
            id: simpleUser.id,
            email: simpleUser.email,
            name: `${simpleUser.first_name} ${simpleUser.last_name}`,
            role: { name: simpleUser.role || 'employee', display_name: simpleUser.role || 'Employee' },
            permissions: []
          }
        },
        message: 'Login successful'
      });
    }

    // Advanced auth path
    if (userWithRole.password_hash) {
      const isValid = await bcrypt.compare(password, userWithRole.password_hash);
      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
      }
    }

    // Get permissions
    let permissions: string[] = [];
    try {
      const perms = query<any>(`
        SELECT DISTINCT p.name FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = ?
      `, [userWithRole.id]);
      permissions = perms.map(p => p.name);
    } catch {}

    const token = generateToken(userWithRole.id, userWithRole.email, userWithRole.role_name || 'employee');

    try { execute('UPDATE users SET last_login_at = datetime("now") WHERE id = ?', [userWithRole.id]); } catch {}

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: userWithRole.id,
          email: userWithRole.email,
          name: `${userWithRole.first_name} ${userWithRole.last_name}`,
          role: {
            id: userWithRole.role_id,
            name: userWithRole.role_name,
            display_name: userWithRole.role_display_name,
            level: userWithRole.role_level
          },
          permissions
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Login failed', message: error.message }, { status: 500 });
  }
}
