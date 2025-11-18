// Database utility functions for ZuZaWorksOS
import type { D1Database } from '@cloudflare/workers-types';
import type { ApiResponse } from './types';

/**
 * Execute a query and return results with proper error handling
 */
export async function query<T>(
  db: D1Database,
  sql: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const result = await db.prepare(sql).bind(...params).all();
    return result.results as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error(`Database query failed: ${error}`);
  }
}

/**
 * Execute a query and return a single result
 */
export async function queryOne<T>(
  db: D1Database,
  sql: string,
  params: any[] = []
): Promise<T | null> {
  try {
    const result = await db.prepare(sql).bind(...params).first();
    return result as T | null;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error(`Database query failed: ${error}`);
  }
}

/**
 * Execute an insert/update/delete query
 */
export async function execute(
  db: D1Database,
  sql: string,
  params: any[] = []
): Promise<D1Result> {
  try {
    const result = await db.prepare(sql).bind(...params).run();
    return result;
  } catch (error) {
    console.error('Database execution error:', error);
    throw new Error(`Database execution failed: ${error}`);
  }
}

/**
 * Create a success API response
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Create an error API response
 */
export function errorResponse(error: string, message?: string): ApiResponse<never> {
  return {
    success: false,
    error,
    message,
  };
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  per_page: number,
  total: number
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    meta: {
      page,
      per_page,
      total,
      total_pages: Math.ceil(total / per_page),
    },
  };
}

/**
 * Parse pagination parameters from URL
 */
export function parsePaginationParams(url: URL): { page: number; per_page: number; offset: number } {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const per_page = Math.min(100, Math.max(1, parseInt(url.searchParams.get('per_page') || '20')));
  const offset = (page - 1) * per_page;
  
  return { page, per_page, offset };
}

/**
 * Generate a unique employee number
 */
export function generateEmployeeNumber(organizationId: number): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `EMP${organizationId}-${timestamp}-${random}`;
}

/**
 * Generate a unique incident number
 */
export function generateIncidentNumber(organizationId: number): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `INC${organizationId}-${timestamp}-${random}`;
}

/**
 * Calculate work hours between two timestamps
 */
export function calculateWorkHours(startTime: string, endTime: string, breakMinutes: number = 0): number {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const diffMs = end - start;
  const diffHours = diffMs / (1000 * 60 * 60);
  const breakHours = breakMinutes / 60;
  return Math.max(0, diffHours - breakHours);
}

/**
 * Check if work hours violate BCEA (Basic Conditions of Employment Act)
 * South African law: Max 45 hours per week for normal work
 */
export function checkBCEACompliance(
  weeklyHours: number,
  overtimeHours: number = 0
): { compliant: boolean; violation?: string } {
  const MAX_NORMAL_HOURS = 45;
  const MAX_OVERTIME_HOURS = 10; // Per week
  const MAX_TOTAL_HOURS = 55; // Including overtime
  
  if (weeklyHours > MAX_NORMAL_HOURS && overtimeHours === 0) {
    return {
      compliant: false,
      violation: `Exceeds maximum normal working hours (${MAX_NORMAL_HOURS} hours/week)`,
    };
  }
  
  if (overtimeHours > MAX_OVERTIME_HOURS) {
    return {
      compliant: false,
      violation: `Exceeds maximum overtime hours (${MAX_OVERTIME_HOURS} hours/week)`,
    };
  }
  
  if (weeklyHours + overtimeHours > MAX_TOTAL_HOURS) {
    return {
      compliant: false,
      violation: `Exceeds maximum total working hours (${MAX_TOTAL_HOURS} hours/week)`,
    };
  }
  
  return { compliant: true };
}

/**
 * Calculate leave days between two dates (excluding weekends)
 */
export function calculateLeaveDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let days = 0;
  
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    // Exclude Saturdays (6) and Sundays (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
}

/**
 * Format date for SQL queries (YYYY-MM-DD)
 */
export function formatDateForSQL(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Format datetime for SQL queries (YYYY-MM-DD HH:MM:SS)
 */
export function formatDateTimeForSQL(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().replace('T', ' ').split('.')[0];
}

/**
 * Sanitize input to prevent SQL injection (basic protection)
 * Note: Always use parameterized queries as primary protection
 */
export function sanitizeInput(input: string): string {
  return input.replace(/[^\w\s@.-]/gi, '');
}

/**
 * Validate South African ID number (basic check)
 */
export function validateSAIDNumber(idNumber: string): boolean {
  // Basic format check: YYMMDDGSSSCAZ
  if (!/^\d{13}$/.test(idNumber)) {
    return false;
  }
  
  // Luhn algorithm check
  const digits = idNumber.split('').map(Number);
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    if (i % 2 === 0) {
      sum += digits[i];
    } else {
      const doubled = digits[i] * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    }
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[12];
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (South African format)
 */
export function validatePhoneNumber(phone: string): boolean {
  // Accept formats: 0821234567, +27821234567, 082 123 4567
  const phoneRegex = /^(\+27|0)[6-8][0-9]{8}$/;
  const cleaned = phone.replace(/\s/g, '');
  return phoneRegex.test(cleaned);
}

/**
 * Calculate B-BBEE scorecard contribution (placeholder)
 */
export function calculateBBEEContribution(employee: any): number {
  let score = 0;
  
  // Race contribution (for EE Act compliance)
  if (['African', 'Coloured', 'Indian'].includes(employee.race)) {
    score += 1;
  }
  
  // Disability contribution
  if (employee.disability_status) {
    score += 0.5;
  }
  
  // Skills development
  if (employee.training_hours_ytd > 20) {
    score += 0.5;
  }
  
  return score;
}
