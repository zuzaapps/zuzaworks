import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { execute, queryOne } from '@/lib/db';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { email, password, first_name, last_name, role, employee_id } = await request.json();

  if (!email || !password || !first_name || !last_name || !role) {
    return NextResponse.json({ success: false, error: 'Missing required fields: email, password, first_name, last_name, role' }, { status: 400 });
  }

  const validRoles = ['executive', 'manager', 'employee', 'officer'];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ success: false, error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, { status: 400 });
  }

  try {
    const existing = queryOne<any>('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = execute(
      'INSERT INTO users (email, password_hash, first_name, last_name, role, employee_id, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [email, passwordHash, first_name, last_name, role, employee_id || null]
    );

    const token = generateToken(Number(result.lastInsertRowid), email, role);

    return NextResponse.json({
      success: true,
      data: { userId: result.lastInsertRowid, email, first_name, last_name, role, token },
      message: 'User registered successfully'
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Registration failed', message: error.message }, { status: 500 });
  }
}
