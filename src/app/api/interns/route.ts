import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const programId = searchParams.get('program_id');
  const legalStatus = searchParams.get('legal_status');

  try {
    let where = '1=1';
    const params: any[] = [];
    if (status) { where += ' AND i.intern_status = ?'; params.push(status); }
    if (programId) { where += ' AND i.program_id = ?'; params.push(programId); }
    if (legalStatus) { where += ' AND i.legal_status = ?'; params.push(legalStatus); }

    const interns = query<any>(`
      SELECT i.*, ip.program_name, ip.program_type
      FROM interns i LEFT JOIN intern_programs ip ON i.program_id = ip.id
      WHERE ${where} ORDER BY i.start_date DESC
    `, params);
    return NextResponse.json({ success: true, data: interns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch interns', message: error.message }, { status: 500 });
  }
}
