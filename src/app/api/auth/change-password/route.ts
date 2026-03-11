import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne, execute } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  const { current_password, new_password } = await request.json();

  if (!current_password || !new_password) {
    return NextResponse.json({ success: false, error: 'Current password and new password required' }, { status: 400 });
  }

  if (new_password.length < 6) {
    return NextResponse.json({ success: false, error: 'New password must be at least 6 characters' }, { status: 400 });
  }

  try {
    const userRecord = queryOne<any>('SELECT password_hash FROM users WHERE id = ?', [user.userId]);
    if (!userRecord) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const isValid = await bcrypt.compare(current_password, userRecord.password_hash);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 401 });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.userId]);

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to change password', message: error.message }, { status: 500 });
  }
}
