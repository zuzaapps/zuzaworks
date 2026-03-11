import { NextRequest, NextResponse } from 'next/server';
import { query, execute, queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const comments = query<any>(`
      SELECT c.*, e.first_name || ' ' || e.last_name as author_name, e.profile_photo_url as author_photo
      FROM social_comments c JOIN employees e ON c.author_id = e.id
      WHERE c.post_id = ? AND c.is_active = 1
      ORDER BY c.created_at ASC
    `, [id]);

    return NextResponse.json({ success: true, data: comments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch comments', message: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { author_id, content } = await request.json();

    const result = execute(
      "INSERT INTO social_comments (post_id, author_id, content, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
      [id, author_id, content]
    );

    execute('UPDATE social_posts SET comments_count = comments_count + 1 WHERE id = ?', [id]);

    const newComment = queryOne<any>(`
      SELECT c.*, e.first_name || ' ' || e.last_name as author_name, e.profile_photo_url as author_photo
      FROM social_comments c JOIN employees e ON c.author_id = e.id WHERE c.id = ?
    `, [result.lastInsertRowid]);

    return NextResponse.json({ success: true, data: newComment, message: 'Comment added' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to add comment', message: error.message }, { status: 500 });
  }
}
