import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      return_year,
      total_employees,
      total_annual_earnings,
      assessment_rate,
      assessment_amount,
      industry_code,
      submitted_by,
      notes,
    } = body;

    if (!return_year) {
      return NextResponse.json(
        { success: false, error: 'return_year is required' },
        { status: 400 }
      );
    }

    // Check for existing return for this year
    const existing = queryOne<any>(
      `SELECT id FROM coida_annual_returns WHERE return_year = ?`,
      [return_year]
    );

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Annual return for year ${return_year} already exists` },
        { status: 409 }
      );
    }

    const calculatedAssessment = assessment_amount || ((total_annual_earnings || 0) * (assessment_rate || 0) / 100);

    const result = execute(
      `INSERT INTO coida_annual_returns (
        return_year, total_employees, total_annual_earnings,
        assessment_rate, assessment_amount, industry_code,
        submission_date, submitted_by, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, DATE('now'), ?, 'submitted', ?)`,
      [
        return_year,
        total_employees || null,
        total_annual_earnings || null,
        assessment_rate || null,
        calculatedAssessment,
        industry_code || null,
        submitted_by || null,
        notes || null,
      ]
    );

    const newReturn = queryOne<any>(
      `SELECT * FROM coida_annual_returns WHERE id = ?`,
      [result.lastInsertRowid]
    );

    return NextResponse.json({
      success: true,
      data: newReturn,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to submit annual return', message: String(error) },
      { status: 500 }
    );
  }
}
