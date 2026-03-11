import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, employee_id, reason } = body;

    const swap = queryOne<any>('SELECT * FROM shift_swap_requests WHERE id = ?', [id]);

    if (!swap) {
      return NextResponse.json({ success: false, error: 'Shift swap request not found' }, { status: 404 });
    }

    if (action === 'accept') {
      // Another employee accepts the swap
      if (!employee_id) {
        return NextResponse.json(
          { success: false, error: 'employee_id is required to accept a swap' },
          { status: 400 }
        );
      }

      if (swap.status !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'Swap request is no longer pending' },
          { status: 400 }
        );
      }

      execute(`
        UPDATE shift_swap_requests SET
          status = 'accepted',
          accepted_by_employee_id = ?,
          responded_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [employee_id, id]);
    } else if (action === 'approve') {
      // Manager approves the swap
      if (!employee_id) {
        return NextResponse.json(
          { success: false, error: 'employee_id (manager) is required to approve a swap' },
          { status: 400 }
        );
      }

      if (swap.status !== 'accepted') {
        return NextResponse.json(
          { success: false, error: 'Swap request must be accepted before it can be approved' },
          { status: 400 }
        );
      }

      // Update the swap request
      execute(`
        UPDATE shift_swap_requests SET
          status = 'approved_by_manager',
          approved_by_manager_id = ?,
          approved_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [employee_id, id]);

      // Reassign the shift to the accepting employee
      execute(`
        UPDATE shifts SET
          employee_id = ?,
          status = 'Scheduled',
          swap_approved_by = ?,
          swap_approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [swap.accepted_by_employee_id, employee_id, swap.original_shift_id]);

      // Mark as completed
      execute(`
        UPDATE shift_swap_requests SET
          status = 'completed',
          completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [id]);
    } else if (action === 'decline') {
      if (swap.status !== 'pending' && swap.status !== 'accepted') {
        return NextResponse.json(
          { success: false, error: 'Swap request cannot be declined in its current state' },
          { status: 400 }
        );
      }

      execute(`
        UPDATE shift_swap_requests SET
          status = 'declined',
          declined_reason = ?,
          responded_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [reason || null, id]);

      // Restore shift status
      execute(`
        UPDATE shifts SET
          status = 'Scheduled',
          swap_requested_by = NULL,
          swap_requested_at = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [swap.original_shift_id]);
    } else if (action === 'cancel') {
      if (swap.status !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'Only pending swap requests can be cancelled' },
          { status: 400 }
        );
      }

      execute(`
        UPDATE shift_swap_requests SET
          status = 'cancelled',
          responded_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [id]);

      // Restore shift status
      execute(`
        UPDATE shifts SET
          status = 'Scheduled',
          swap_requested_by = NULL,
          swap_requested_at = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [swap.original_shift_id]);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "accept", "approve", "decline", or "cancel".' },
        { status: 400 }
      );
    }

    const updated = queryOne<any>('SELECT * FROM shift_swap_requests WHERE id = ?', [id]);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to update shift swap request', message: error.message }, { status: 500 });
  }
}
