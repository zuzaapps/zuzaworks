import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      first_name, last_name, id_number, date_of_birth, gender, race,
      disability_status, email, phone, physical_address, postal_address,
      emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
      program_id, intake_cohort, legal_status, start_date, expected_end_date,
      highest_qualification, qualification_institution, qualification_year,
      bank_name, account_number, account_type, branch_code, tax_number,
      data_consent, notes,
    } = body;

    if (!first_name || !last_name || !id_number || !program_id || !legal_status) {
      return NextResponse.json(
        { success: false, error: 'first_name, last_name, id_number, program_id, and legal_status are required' },
        { status: 400 }
      );
    }

    // Check for duplicate ID number
    const existing = queryOne<any>('SELECT id FROM interns WHERE id_number = ?', [id_number]);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An intern with this ID number already exists' },
        { status: 409 }
      );
    }

    // Verify program exists
    const program = queryOne<any>('SELECT id, program_type FROM intern_programs WHERE id = ?', [program_id]);
    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    const result = execute(`
      INSERT INTO interns (
        first_name, last_name, id_number, date_of_birth, gender, race,
        disability_status, email, phone, physical_address, postal_address,
        emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
        program_id, intake_cohort, intern_status, legal_status,
        application_date, registration_date, start_date, expected_end_date,
        highest_qualification, qualification_institution, qualification_year,
        bank_name, account_number, account_type, branch_code, tax_number,
        data_consent, data_consent_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'registered', ?, CURRENT_DATE, CURRENT_DATE, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      first_name, last_name, id_number, date_of_birth || null, gender || null,
      race || null, disability_status || null, email || null, phone || null,
      physical_address || null, postal_address || null,
      emergency_contact_name || null, emergency_contact_relationship || null,
      emergency_contact_phone || null, program_id, intake_cohort || null,
      legal_status, start_date || null, expected_end_date || null,
      highest_qualification || null, qualification_institution || null,
      qualification_year || null, bank_name || null, account_number || null,
      account_type || null, branch_code || null, tax_number || null,
      data_consent ? 1 : 0, data_consent ? new Date().toISOString().split('T')[0] : null,
      notes || null,
    ]);

    return NextResponse.json(
      { success: true, data: { id: result.lastInsertRowid }, message: 'Intern registered successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to register intern', message: error.message },
      { status: 500 }
    );
  }
}
