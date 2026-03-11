import { NextRequest, NextResponse } from 'next/server';
import { query, execute, queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const employeeId = searchParams.get('employee_id');
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = Math.min(50, parseInt(searchParams.get('per_page') || '20'));
  const offset = (page - 1) * perPage;

  try {
    const conditions: string[] = ['d.is_active = 1'];
    const params: any[] = [];

    if (category) {
      conditions.push('d.category = ?');
      params.push(category);
    }
    if (employeeId) {
      conditions.push('d.uploaded_by = ?');
      params.push(employeeId);
    }

    params.push(perPage, offset);

    const documents = query<any>(`
      SELECT d.*, e.first_name || ' ' || e.last_name as uploader_name
      FROM documents d LEFT JOIN employees e ON d.uploaded_by = e.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY d.created_at DESC LIMIT ? OFFSET ?
    `, params);

    return NextResponse.json({ success: true, data: documents });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch documents', message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organization_id, uploaded_by, title, category, file_name, file_type, file_size, file_url, description } = await request.json();

    const result = execute(`
      INSERT INTO documents (organization_id, uploaded_by, title, category, file_name, file_type, file_size, file_url, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [organization_id || 1, uploaded_by, title, category || 'General', file_name, file_type, file_size || 0, file_url, description || null]);

    const newDoc = queryOne<any>('SELECT * FROM documents WHERE id = ?', [result.lastInsertRowid]);

    return NextResponse.json({ success: true, data: newDoc, message: 'Document uploaded successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to upload document', message: error.message }, { status: 500 });
  }
}
