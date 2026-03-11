import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

export async function GET() {
  try {
    const programs = query<any>(`
      SELECT ip.*,
        (SELECT COUNT(*) FROM interns i WHERE i.program_id = ip.id) AS total_interns,
        (SELECT COUNT(*) FROM interns i WHERE i.program_id = ip.id AND i.intern_status = 'active') AS active_interns
      FROM intern_programs ip
      ORDER BY ip.created_at DESC
    `);

    return NextResponse.json({ success: true, data: programs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch programs', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      program_name, program_type, description, duration_months, intake_capacity,
      current_intake_year, seta_name, qualification_title, qualification_nqf_level,
      qualification_id, funding_source, stipend_amount, start_date, end_date,
      program_manager, training_coordinator, notes,
    } = body;

    if (!program_name || !program_type) {
      return NextResponse.json(
        { success: false, error: 'program_name and program_type are required' },
        { status: 400 }
      );
    }

    const result = execute(`
      INSERT INTO intern_programs (
        program_name, program_type, description, duration_months, intake_capacity,
        current_intake_year, seta_name, qualification_title, qualification_nqf_level,
        qualification_id, funding_source, stipend_amount, start_date, end_date,
        program_manager, training_coordinator, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      program_name, program_type, description || null, duration_months || null,
      intake_capacity || null, current_intake_year || null, seta_name || null,
      qualification_title || null, qualification_nqf_level || null,
      qualification_id || null, funding_source || null, stipend_amount || null,
      start_date || null, end_date || null, program_manager || null,
      training_coordinator || null, notes || null,
    ]);

    return NextResponse.json(
      { success: true, data: { id: result.lastInsertRowid }, message: 'Program created successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to create program', message: error.message },
      { status: 500 }
    );
  }
}
