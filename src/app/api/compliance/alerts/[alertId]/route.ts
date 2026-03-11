import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const { alertId } = await params;
    const body = await request.json();
    const { action, resolved_by, acknowledged_by, resolution_notes } = body;

    const existing = queryOne<any>(
      `SELECT * FROM compliance_alerts WHERE id = ?`,
      [alertId]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Alert not found' },
        { status: 404 }
      );
    }

    if (action === 'acknowledge') {
      execute(
        `UPDATE compliance_alerts
         SET status = 'acknowledged',
             acknowledged_at = CURRENT_TIMESTAMP,
             acknowledged_by = ?
         WHERE id = ?`,
        [acknowledged_by || null, alertId]
      );
    } else if (action === 'resolve') {
      execute(
        `UPDATE compliance_alerts
         SET status = 'resolved',
             resolved_at = CURRENT_TIMESTAMP,
             resolved_by = ?,
             resolution_notes = ?
         WHERE id = ?`,
        [resolved_by || null, resolution_notes || null, alertId]
      );
    } else if (action === 'dismiss') {
      execute(
        `UPDATE compliance_alerts
         SET status = 'dismissed'
         WHERE id = ?`,
        [alertId]
      );
    } else if (action === 'in_progress') {
      execute(
        `UPDATE compliance_alerts
         SET status = 'in_progress'
         WHERE id = ?`,
        [alertId]
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be acknowledge, resolve, dismiss, or in_progress' },
        { status: 400 }
      );
    }

    const updated = queryOne<any>(
      `SELECT * FROM compliance_alerts WHERE id = ?`,
      [alertId]
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update alert', message: String(error) },
      { status: 500 }
    );
  }
}
