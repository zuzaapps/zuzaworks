import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const programId = searchParams.get('program_id');
    const mentorId = searchParams.get('mentor_id');
    const departmentId = searchParams.get('department_id');
    const search = searchParams.get('search');

    let sql = `
      SELECT
        i.id,
        i.intern_number,
        i.program_id,
        i.first_name,
        i.last_name,
        i.id_number,
        i.date_of_birth,
        i.gender,
        i.race,
        i.disability_status,
        i.email,
        i.phone,
        i.city,
        i.province,
        i.qualification,
        i.institution,
        i.mentor_id,
        i.department_id,
        i.location_id,
        i.start_date,
        i.end_date,
        i.stipend_amount,
        i.status,
        i.completion_date,
        i.created_at,
        ip.program_name,
        ip.program_type,
        ip.nqf_level,
        d.name as department_name,
        m.first_name as mentor_first_name,
        m.last_name as mentor_last_name
      FROM interns i
      LEFT JOIN intern_programs ip ON i.program_id = ip.id
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN employees m ON i.mentor_id = m.id
      WHERE 1=1
    `;

    const params: unknown[] = [];

    if (status) {
      sql += ` AND i.status = ?`;
      params.push(status);
    }
    if (programId) {
      sql += ` AND i.program_id = ?`;
      params.push(programId);
    }
    if (mentorId) {
      sql += ` AND i.mentor_id = ?`;
      params.push(mentorId);
    }
    if (departmentId) {
      sql += ` AND i.department_id = ?`;
      params.push(departmentId);
    }
    if (search) {
      sql += ` AND (i.first_name LIKE ? OR i.last_name LIKE ? OR i.intern_number LIKE ? OR i.email LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sql += ` ORDER BY i.created_at DESC`;

    const interns = query<any>(sql, params);

    return NextResponse.json({
      success: true,
      data: interns,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch interns', message: String(error) },
      { status: 500 }
    );
  }
}
