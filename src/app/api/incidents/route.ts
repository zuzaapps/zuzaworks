import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute, parsePagination, paginatedResponse } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, perPage, offset } = parsePagination(searchParams);

    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const incident_type = searchParams.get('incident_type');
    const location_id = searchParams.get('location_id');
    const department_id = searchParams.get('department_id');

    let whereClause = 'WHERE 1=1';
    const params: unknown[] = [];

    if (status) {
      whereClause += ' AND i.status = ?';
      params.push(status);
    }
    if (severity) {
      whereClause += ' AND i.severity = ?';
      params.push(severity);
    }
    if (incident_type) {
      whereClause += ' AND i.incident_type = ?';
      params.push(incident_type);
    }
    if (location_id) {
      whereClause += ' AND i.location_id = ?';
      params.push(location_id);
    }
    if (department_id) {
      whereClause += ' AND i.department_id = ?';
      params.push(department_id);
    }

    const countResult = queryOne<any>(
      `SELECT COUNT(*) as total FROM incidents i ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    const incidents = query<any>(`
      SELECT i.*,
        e.first_name || ' ' || e.last_name as reported_by_name,
        l.name as location_name,
        d.name as department_name
      FROM incidents i
      LEFT JOIN employees e ON i.reported_by = e.id
      LEFT JOIN locations l ON i.location_id = l.id
      LEFT JOIN departments d ON i.department_id = d.id
      ${whereClause}
      ORDER BY i.incident_date DESC
      LIMIT ? OFFSET ?
    `, [...params, perPage, offset]);

    return NextResponse.json(paginatedResponse(incidents, page, perPage, total));
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch incidents', message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organization_id, incident_number, incident_type, severity, incident_date,
      location_id, department_id, title, description, immediate_action_taken,
      reported_by, employees_involved, witnesses, investigation_required,
      corrective_actions, preventive_actions, action_owner, action_due_date,
      requires_external_reporting, estimated_cost,
    } = body;

    if (!incident_type || !incident_date || !title || !description || !reported_by) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: incident_type, incident_date, title, description, reported_by' },
        { status: 400 }
      );
    }

    const incidentNum = incident_number || `INC-${Date.now()}`;

    const result = execute(`
      INSERT INTO incidents (
        organization_id, incident_number, incident_type, severity, incident_date,
        location_id, department_id, title, description, immediate_action_taken,
        reported_by, employees_involved, witnesses, investigation_required,
        corrective_actions, preventive_actions, action_owner, action_due_date,
        requires_external_reporting, estimated_cost, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Reported')
    `, [
      organization_id || 1, incidentNum, incident_type, severity || 'Medium',
      incident_date, location_id || null, department_id || null, title, description,
      immediate_action_taken || null, reported_by,
      employees_involved ? JSON.stringify(employees_involved) : null,
      witnesses ? JSON.stringify(witnesses) : null,
      investigation_required ? 1 : 0,
      corrective_actions || null, preventive_actions || null,
      action_owner || null, action_due_date || null,
      requires_external_reporting ? 1 : 0, estimated_cost || null,
    ]);

    const incident = queryOne<any>('SELECT * FROM incidents WHERE id = ?', [result.lastInsertRowid]);

    return NextResponse.json({ success: true, data: incident }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to create incident', message: error.message }, { status: 500 });
  }
}
