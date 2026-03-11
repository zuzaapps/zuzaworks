import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import type { JWTPayload } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'zuzaworks-jwt-secret-change-in-production-2025';

export function generateToken(userId: number, email: string, role: string): string {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return verifyToken(token);
}

export function requireAuth(request: NextRequest): JWTPayload | NextResponse {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - No valid token provided' },
      { status: 401 }
    );
  }
  return user;
}

export function requireRole(request: NextRequest, ...allowedRoles: string[]): JWTPayload | NextResponse {
  const result = requireAuth(request);
  if (result instanceof NextResponse) return result;
  if (!allowedRoles.includes(result.role)) {
    return NextResponse.json(
      { success: false, error: `Forbidden - Requires role: ${allowedRoles.join(' or ')}` },
      { status: 403 }
    );
  }
  return result;
}
