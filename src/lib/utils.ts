/** Generate a unique employee number */
export function generateEmployeeNumber(organizationId: number): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `EMP${organizationId}-${timestamp}-${random}`;
}

/** Generate a unique incident number */
export function generateIncidentNumber(organizationId: number): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `INC${organizationId}-${timestamp}-${random}`;
}

/** Calculate work hours between two timestamps */
export function calculateWorkHours(startTime: string, endTime: string, breakMinutes: number = 0): number {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const diffHours = (end - start) / (1000 * 60 * 60);
  const breakHours = breakMinutes / 60;
  return Math.max(0, diffHours - breakHours);
}

/** Check BCEA compliance for work hours */
export function checkBCEACompliance(weeklyHours: number, overtimeHours: number = 0) {
  const MAX_NORMAL_HOURS = 45;
  const MAX_OVERTIME_HOURS = 10;
  const MAX_TOTAL_HOURS = 55;

  if (weeklyHours > MAX_NORMAL_HOURS && overtimeHours === 0) {
    return { compliant: false, violation: `Exceeds maximum normal working hours (${MAX_NORMAL_HOURS} hours/week)` };
  }
  if (overtimeHours > MAX_OVERTIME_HOURS) {
    return { compliant: false, violation: `Exceeds maximum overtime hours (${MAX_OVERTIME_HOURS} hours/week)` };
  }
  if (weeklyHours + overtimeHours > MAX_TOTAL_HOURS) {
    return { compliant: false, violation: `Exceeds maximum total working hours (${MAX_TOTAL_HOURS} hours/week)` };
  }
  return { compliant: true };
}

/** Calculate leave days between two dates (excluding weekends) */
export function calculateLeaveDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let days = 0;
  const current = new Date(start);
  while (current <= end) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) days++;
    current.setDate(current.getDate() + 1);
  }
  return days;
}

/** Validate South African ID number */
export function validateSAIDNumber(idNumber: string): boolean {
  if (!/^\d{13}$/.test(idNumber)) return false;
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

/** Validate email format */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Validate SA phone number */
export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  return /^(\+27|0)[6-8][0-9]{8}$/.test(cleaned);
}
