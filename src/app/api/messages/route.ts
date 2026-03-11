import { NextRequest, NextResponse } from 'next/server';
import { query, execute, queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get('channel_id');
  const employeeId = searchParams.get('employee_id');
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = Math.min(50, parseInt(searchParams.get('per_page') || '30'));
  const offset = (page - 1) * perPage;

  try {
    let messages;

    if (channelId) {
      messages = query<any>(`
        SELECT m.*, e.first_name || ' ' || e.last_name as sender_name, e.profile_photo_url as sender_photo
        FROM team_messages m JOIN employees e ON m.sender_id = e.id
        WHERE m.channel_id = ? AND m.is_deleted = 0
        ORDER BY m.created_at DESC LIMIT ? OFFSET ?
      `, [channelId, perPage, offset]);
    } else if (employeeId) {
      messages = query<any>(`
        SELECT m.*, e.first_name || ' ' || e.last_name as sender_name, e.profile_photo_url as sender_photo
        FROM team_messages m JOIN employees e ON m.sender_id = e.id
        WHERE (m.sender_id = ? OR m.recipient_id = ?) AND m.is_deleted = 0
        ORDER BY m.created_at DESC LIMIT ? OFFSET ?
      `, [employeeId, employeeId, perPage, offset]);
    } else {
      messages = query<any>(`
        SELECT m.*, e.first_name || ' ' || e.last_name as sender_name, e.profile_photo_url as sender_photo
        FROM team_messages m JOIN employees e ON m.sender_id = e.id
        WHERE m.is_deleted = 0
        ORDER BY m.created_at DESC LIMIT ? OFFSET ?
      `, [perPage, offset]);
    }

    return NextResponse.json({ success: true, data: messages });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch messages', message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sender_id, recipient_id, channel_id, message_type, content } = await request.json();

    const result = execute(`
      INSERT INTO team_messages (organization_id, sender_id, recipient_id, channel_id, message_type, content, created_at, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [sender_id, recipient_id || null, channel_id || null, message_type || 'Text', content]);

    const newMessage = queryOne<any>(`
      SELECT m.*, e.first_name || ' ' || e.last_name as sender_name, e.profile_photo_url as sender_photo
      FROM team_messages m JOIN employees e ON m.sender_id = e.id WHERE m.id = ?
    `, [result.lastInsertRowid]);

    return NextResponse.json({ success: true, data: newMessage, message: 'Message sent' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to send message', message: error.message }, { status: 500 });
  }
}
