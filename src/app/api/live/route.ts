import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));

  try {
    const recentPosts = query<any>(`
      SELECT 'post' as activity_type, p.id, p.content as summary, p.created_at,
        e.first_name || ' ' || e.last_name as actor_name, e.profile_photo_url as actor_photo
      FROM social_posts p JOIN employees e ON p.author_id = e.id
      WHERE p.is_active = 1
      ORDER BY p.created_at DESC LIMIT 10
    `, []);

    const recentMessages = query<any>(`
      SELECT 'message' as activity_type, m.id, m.content as summary, m.created_at,
        e.first_name || ' ' || e.last_name as actor_name, e.profile_photo_url as actor_photo
      FROM team_messages m JOIN employees e ON m.sender_id = e.id
      WHERE m.is_deleted = 0
      ORDER BY m.created_at DESC LIMIT 10
    `, []);

    const recentDocs = query<any>(`
      SELECT 'document' as activity_type, d.id, d.title as summary, d.created_at,
        e.first_name || ' ' || e.last_name as actor_name, e.profile_photo_url as actor_photo
      FROM documents d JOIN employees e ON d.uploaded_by = e.id
      WHERE d.is_active = 1
      ORDER BY d.created_at DESC LIMIT 10
    `, []);

    const allActivity = [...recentPosts, ...recentMessages, ...recentDocs]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    return NextResponse.json({ success: true, data: allActivity });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch live activity', message: error.message }, { status: 500 });
  }
}
