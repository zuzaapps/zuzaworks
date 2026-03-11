import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employee_id,
      incident_date,
      incident_time,
      incident_type,
      location_description,
      location_id,
      description,
      injury_description,
      body_part_injured,
      injury_severity,
      witness_names,
      witness_statements,
      immediate_action_taken,
      first_aid_administered,
      first_aid_by,
      medical_treatment_required,
      hospital_name,
      doctor_name,
      reported_by,
      days_absent,
    } = body;

    if (!employee_id || !incident_date || !description) {
      return NextResponse.json(
        { success: false, error: 'employee_id, incident_date, and description are required' },
        { status: 400 }
      );
    }

    // Generate W.Cl.2 reference number
    const year = new Date().getFullYear();
    const countResult = queryOne<any>(
      `SELECT COUNT(*) as count FROM coida_incidents WHERE strftime('%Y', created_at) = ?`,
      [String(year)]
    );
    const incidentNumber = `WCL2-${year}-${String((countResult?.count || 0) + 1).padStart(4, '0')}`;

    const result = execute(
      `INSERT INTO coida_incidents (
        incident_number, employee_id, incident_date, incident_time,
        incident_type, location_description, location_id, description,
        injury_description, body_part_injured, injury_severity,
        witness_names, witness_statements, immediate_action_taken,
        first_aid_administered, first_aid_by, medical_treatment_required,
        hospital_name, doctor_name, reported_by, days_absent,
        status, wcl2_submitted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'reported', 0)`,
      [
        incidentNumber,
        employee_id,
        incident_date,
        incident_time || null,
        incident_type || 'workplace_injury',
        location_description || null,
        location_id || null,
        description,
        injury_description || null,
        body_part_injured || null,
        injury_severity || 'minor',
        witness_names || null,
        witness_statements || null,
        immediate_action_taken || null,
        first_aid_administered ? 1 : 0,
        first_aid_by || null,
        medical_treatment_required ? 1 : 0,
        hospital_name || null,
        doctor_name || null,
        reported_by || null,
        days_absent || 0,
      ]
    );

    const incident = queryOne<any>(
      `SELECT ci.*, e.first_name, e.last_name, e.employee_number
       FROM coida_incidents ci
       LEFT JOIN employees e ON ci.employee_id = e.id
       WHERE ci.id = ?`,
      [result.lastInsertRowid]
    );

    return NextResponse.json({
      success: true,
      data: incident,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to report workplace incident', message: String(error) },
      { status: 500 }
    );
  }
}
