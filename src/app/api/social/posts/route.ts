import { NextRequest, NextResponse } from 'next/server';
import { query, execute, queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = Math.min(50, parseInt(searchParams.get('per_page') || '20'));
  const offset = (page - 1) * perPage;

  try {
    const posts = query<any>(`
      SELECT p.*, e.first_name || ' ' || e.last_name as author_name, e.profile_photo_url as author_photo, e.job_title as author_title
      FROM social_posts p JOIN employees e ON p.author_id = e.id
      WHERE p.is_active = 1 AND p.is_approved = 1
      ORDER BY p.created_at DESC LIMIT ? OFFSET ?
    `, [perPage, offset]);
    return NextResponse.json({ success: true, data: posts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch posts', message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const result = execute(`
      INSERT INTO social_posts (organization_id, author_id, post_type, content, visibility, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [data.organization_id || 1, data.author_id, data.post_type || 'Status', data.content, data.visibility || 'Public']);

    const newPost = queryOne<any>(`
      SELECT p.*, e.first_name || ' ' || e.last_name as author_name, e.profile_photo_url as author_photo
      FROM social_posts p JOIN employees e ON p.author_id = e.id WHERE p.id = ?
    `, [result.lastInsertRowid]);

    return NextResponse.json({ success: true, data: newPost, message: 'Post created successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to create post', message: error.message }, { status: 500 });
  }
}
