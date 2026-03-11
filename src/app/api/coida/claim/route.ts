import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      incident_id,
      employee_id,
      claim_type,
      claim_description,
      medical_costs,
      temporary_disability_days,
      permanent_disability_percentage,
      fatal,
      dependants_details,
      submitted_by,
      notes,
    } = body;

    if (!incident_id || !employee_id) {
      return NextResponse.json(
        { success: false, error: 'incident_id and employee_id are required' },
        { status: 400 }
      );
    }

    // Verify incident exists
    const incident = queryOne<any>(
      `SELECT id, incident_number FROM coida_incidents WHERE id = ?`,
      [incident_id]
    );

    if (!incident) {
      return NextResponse.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      );
    }

    // Generate claim reference
    const year = new Date().getFullYear();
    const countResult = queryOne<any>(
      `SELECT COUNT(*) as count FROM coida_claims WHERE strftime('%Y', created_at) = ?`,
      [String(year)]
    );
    const claimReference = `CLM-${year}-${String((countResult?.count || 0) + 1).padStart(4, '0')}`;

    const result = execute(
      `INSERT INTO coida_claims (
        claim_reference, incident_id, employee_id, claim_type,
        claim_description, medical_costs, temporary_disability_days,
        permanent_disability_percentage, fatal, dependants_details,
        submission_date, submitted_by, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE('now'), ?, 'submitted', ?)`,
      [
        claimReference,
        incident_id,
        employee_id,
        claim_type || 'medical',
        claim_description || null,
        medical_costs || 0,
        temporary_disability_days || 0,
        permanent_disability_percentage || 0,
        fatal ? 1 : 0,
        dependants_details || null,
        submitted_by || null,
        notes || null,
      ]
    );

    // Update incident status to claim_submitted
    execute(
      `UPDATE coida_incidents SET status = 'claim_submitted' WHERE id = ?`,
      [incident_id]
    );

    const claim = queryOne<any>(
      `SELECT cc.*, ci.incident_number, e.first_name, e.last_name, e.employee_number
       FROM coida_claims cc
       LEFT JOIN coida_incidents ci ON cc.incident_id = ci.id
       LEFT JOIN employees e ON cc.employee_id = e.id
       WHERE cc.id = ?`,
      [result.lastInsertRowid]
    );

    return NextResponse.json({
      success: true,
      data: claim,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to submit claim', message: String(error) },
      { status: 500 }
    );
  }
}
