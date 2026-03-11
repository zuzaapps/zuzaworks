import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute, parsePagination, paginatedResponse } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, perPage, offset } = parsePagination(searchParams);

    const status = searchParams.get('status');
    const requesting_employee_id = searchParams.get('requesting_employee_id');
    const target_employee_id = searchParams.get('target_employee_id');
    const swap_type = searchParams.get('swap_type');

    let whereClause = 'WHERE 1=1';
    const params: unknown[] = [];

    if (status) {
      whereClause += ' AND ssr.status = ?';
      params.push(status);
    }
    if (requesting_employee_id) {
      whereClause += ' AND ssr.requesting_employee_id = ?';
      params.push(requesting_employee_id);
    }
    if (target_employee_id) {
      whereClause += ' AND ssr.target_employee_id = ?';
      params.push(target_employee_id);
    }
    if (swap_type) {
      whereClause += ' AND ssr.swap_type = ?';
      params.push(swap_type);
    }

    const countResult = queryOne<any>(
      `SELECT COUNT(*) as total FROM shift_swap_requests ssr ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    const swaps = query<any>(`
      SELECT ssr.*,
        re.first_name || ' ' || re.last_name as requesting_employee_name,
        te.first_name || ' ' || te.last_name as target_employee_name,
        ae.first_name || ' ' || ae.last_name as accepted_by_name,
        me.first_name || ' ' || me.last_name as approved_by_manager_name,
        s.shift_date, s.start_time, s.end_time, s.location_id,
        l.name as location_name
      FROM shift_swap_requests ssr
      LEFT JOIN employees re ON ssr.requesting_employee_id = re.id
      LEFT JOIN employees te ON ssr.target_employee_id = te.id
      LEFT JOIN employees ae ON ssr.accepted_by_employee_id = ae.id
      LEFT JOIN employees me ON ssr.approved_by_manager_id = me.id
      LEFT JOIN shifts s ON ssr.original_shift_id = s.id
      LEFT JOIN locations l ON s.location_id = l.id
      ${whereClause}
      ORDER BY ssr.requested_at DESC
      LIMIT ? OFFSET ?
    `, [...params, perPage, offset]);

    return NextResponse.json(paginatedResponse(swaps, page, perPage, total));
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch shift swaps', message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organization_id, requesting_employee_id, original_shift_id,
      target_employee_id, swap_type, reason, notes, expires_at,
    } = body;

    if (!requesting_employee_id || !original_shift_id || !swap_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: requesting_employee_id, original_shift_id, swap_type' },
        { status: 400 }
      );
    }

    // Verify the shift exists and belongs to the requesting employee
    const shift = queryOne<any>(
      'SELECT * FROM shifts WHERE id = ? AND employee_id = ?',
      [original_shift_id, requesting_employee_id]
    );

    if (!shift) {
      return NextResponse.json(
        { success: false, error: 'Shift not found or does not belong to the requesting employee' },
        { status: 404 }
      );
    }

    // Check for existing pending swap request for this shift
    const existingSwap = queryOne<any>(
      "SELECT id FROM shift_swap_requests WHERE original_shift_id = ? AND status IN ('pending', 'accepted')",
      [original_shift_id]
    );

    if (existingSwap) {
      return NextResponse.json(
        { success: false, error: 'A swap request already exists for this shift' },
        { status: 409 }
      );
    }

    const result = execute(`
      INSERT INTO shift_swap_requests (
        organization_id, requesting_employee_id, original_shift_id,
        target_employee_id, swap_type, reason, notes, status, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `, [
      organization_id || 1, requesting_employee_id, original_shift_id,
      target_employee_id || null, swap_type, reason || null,
      notes || null, expires_at || null,
    ]);

    // Update shift status
    execute(
      "UPDATE shifts SET status = 'Swap Requested', swap_requested_by = ?, swap_requested_at = CURRENT_TIMESTAMP WHERE id = ?",
      [requesting_employee_id, original_shift_id]
    );

    const swap = queryOne<any>('SELECT * FROM shift_swap_requests WHERE id = ?', [result.lastInsertRowid]);

    return NextResponse.json({ success: true, data: swap }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to create shift swap request', message: error.message }, { status: 500 });
  }
}
