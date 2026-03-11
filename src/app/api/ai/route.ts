import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { employee_id, message, context_type } = await request.json();

    const employee = queryOne<any>('SELECT * FROM employees WHERE id = ?', [employee_id]);

    let twin = queryOne<any>('SELECT * FROM digital_twins WHERE employee_id = ?', [employee_id]);
    if (!twin) {
      const result = execute(
        "INSERT INTO digital_twins (employee_id, twin_name, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))",
        [employee_id, `${employee?.first_name || 'Your'}'s Assistant`]
      );
      twin = queryOne<any>('SELECT * FROM digital_twins WHERE id = ?', [result.lastInsertRowid]);
    }

    execute(
      "INSERT INTO ai_chat_messages (employee_id, digital_twin_id, role, content, context_type, created_at) VALUES (?, ?, 'user', ?, ?, datetime('now'))",
      [employee_id, twin?.id, message, context_type || 'General']
    );

    const assistantMessage = `Hey ${employee?.first_name || 'there'}! I'm here to help! As your digital workplace assistant, I can help with scheduling, performance tracking, skills development, and compliance questions. What would you like to know?`;

    execute(
      "INSERT INTO ai_chat_messages (employee_id, digital_twin_id, role, content, context_type, created_at) VALUES (?, ?, 'assistant', ?, ?, datetime('now'))",
      [employee_id, twin?.id, assistantMessage, context_type || 'General']
    );

    if (twin?.id) {
      execute('UPDATE digital_twins SET interactions_count = interactions_count + 1 WHERE id = ?', [twin.id]);
    }

    return NextResponse.json({ success: true, data: { message: assistantMessage, twin_name: twin?.twin_name } });
  } catch (error) {
    return NextResponse.json({
      success: true,
      data: { message: "I'm here to help! As your digital workplace assistant, I can help with scheduling, performance tracking, skills development, and compliance questions." }
    });
  }
}
