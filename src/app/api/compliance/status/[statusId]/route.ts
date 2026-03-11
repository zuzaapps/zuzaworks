import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ statusId: string }> }
) {
  try {
    const { statusId } = await params;
    const body = await request.json();
    const {
      status,
      compliance_date,
      expiry_date,
      next_review_date,
      evidence_document_path,
      notes,
      last_checked_by,
    } = body;

    const existing = queryOne<any>(
      `SELECT * FROM organization_compliance_status WHERE id = ?`,
      [statusId]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Compliance status record not found' },
        { status: 404 }
      );
    }

    execute(
      `UPDATE organization_compliance_status
       SET status = COALESCE(?, status),
           compliance_date = COALESCE(?, compliance_date),
           expiry_date = COALESCE(?, expiry_date),
           next_review_date = COALESCE(?, next_review_date),
           evidence_document_path = COALESCE(?, evidence_document_path),
           notes = COALESCE(?, notes),
           last_checked_at = CURRENT_TIMESTAMP,
           last_checked_by = COALESCE(?, last_checked_by),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        status || null,
        compliance_date || null,
        expiry_date || null,
        next_review_date || null,
        evidence_document_path || null,
        notes || null,
        last_checked_by || null,
        statusId,
      ]
    );

    // Log audit trail
    execute(
      `INSERT INTO compliance_audit_log (action_type, checkpoint_id, old_status, new_status, performed_by, description)
       VALUES ('status_changed', ?, ?, ?, ?, ?)`,
      [
        existing.checkpoint_id,
        existing.status,
        status || existing.status,
        last_checked_by || null,
        `Status updated from ${existing.status} to ${status || existing.status}`,
      ]
    );

    const updated = queryOne<any>(
      `SELECT ocs.*, cp.title as checkpoint_title, cp.code as checkpoint_code, cc.name as category_name
       FROM organization_compliance_status ocs
       JOIN compliance_checkpoints cp ON ocs.checkpoint_id = cp.id
       JOIN compliance_categories cc ON cp.category_id = cc.id
       WHERE ocs.id = ?`,
      [statusId]
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update compliance status', message: String(error) },
      { status: 500 }
    );
  }
}
