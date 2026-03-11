import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employee_id');

  const stats = {
    total_points: Math.floor(Math.random() * 5000) + 1000,
    level: Math.floor(Math.random() * 20) + 1,
    rank: Math.floor(Math.random() * 100) + 1,
    streak_days: Math.floor(Math.random() * 30) + 1,
    badges_earned: Math.floor(Math.random() * 15) + 3,
    shifts_completed: Math.floor(Math.random() * 50) + 10,
    training_hours: Math.floor(Math.random() * 100) + 20,
    social_engagement: Math.floor(Math.random() * 200) + 50,
    zuza_coins: Math.floor(Math.random() * 1000) + 100,
  };
  return NextResponse.json({ success: true, data: stats });
}

export async function POST(request: NextRequest) {
  try {
    const { employee_id, action, points } = await request.json();
    const result = {
      success: true,
      points_awarded: points,
      new_total: Math.floor(Math.random() * 5000) + points,
      level_up: Math.random() > 0.8,
      badge_unlocked: Math.random() > 0.7 ? 'Consistent Performer' : null,
    };
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to award points' }, { status: 500 });
  }
}
