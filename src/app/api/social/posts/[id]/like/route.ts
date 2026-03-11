import { NextRequest, NextResponse } from 'next/server';
import { query, execute, queryOne } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { employee_id, reaction_type } = await request.json();

    const existing = queryOne<any>(
      'SELECT * FROM social_reactions WHERE post_id = ? AND employee_id = ?',
      [id, employee_id]
    );

    if (existing) {
      execute('DELETE FROM social_reactions WHERE id = ?', [existing.id]);
      execute('UPDATE social_posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?', [id]);
      return NextResponse.json({ success: true, data: { liked: false }, message: 'Post unliked' });
    }

    execute(
      "INSERT INTO social_reactions (post_id, employee_id, reaction_type, created_at) VALUES (?, ?, ?, datetime('now'))",
      [id, employee_id, reaction_type || 'Like']
    );
    execute('UPDATE social_posts SET likes_count = likes_count + 1 WHERE id = ?', [id]);

    return NextResponse.json({ success: true, data: { liked: true, reaction_type: reaction_type || 'Like' }, message: 'Post liked' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to toggle like', message: error.message }, { status: 500 });
  }
}
