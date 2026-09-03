import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Retrieve all templates for user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }

    const [templates]: any = await pool.query(
      `SELECT id, user_id, name, subject, category, body_html, body_text, created_at, updated_at 
       FROM email_templates 
       WHERE user_id = ? 
       ORDER BY updated_at DESC`,
      [userId]
    );

    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Create, update, or delete template
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action = 'create', userId, templateId, name, subject, category = 'General', bodyHtml, bodyText } = body;

    if (action === 'create') {
      if (!userId || !name || !subject || !bodyHtml) {
        return NextResponse.json(
          { success: false, message: 'User ID, Name, Subject, and Content are required.' },
          { status: 400 }
        );
      }

      const [res]: any = await pool.query(
        `INSERT INTO email_templates (user_id, name, subject, category, body_html, body_text)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, name.trim(), subject.trim(), category.trim(), bodyHtml, bodyText || '']
      );

      return NextResponse.json({
        success: true,
        template: {
          id: res.insertId,
          name: name.trim(),
          subject: subject.trim(),
          category: category.trim(),
          body_html: bodyHtml,
          body_text: bodyText || '',
        },
        message: 'Email template saved successfully!',
      });
    }

    if (action === 'update') {
      if (!templateId || !name || !subject || !bodyHtml) {
        return NextResponse.json(
          { success: false, message: 'Template ID, Name, Subject, and Content are required.' },
          { status: 400 }
        );
      }

      await pool.query(
        `UPDATE email_templates 
         SET name = ?, subject = ?, category = ?, body_html = ?, body_text = ? 
         WHERE id = ?`,
        [name.trim(), subject.trim(), category.trim(), bodyHtml, bodyText || '', templateId]
      );

      return NextResponse.json({ success: true, message: 'Email template updated successfully!' });
    }

    if (action === 'delete') {
      if (!templateId) {
        return NextResponse.json({ success: false, message: 'templateId is required' }, { status: 400 });
      }

      await pool.query(`DELETE FROM email_templates WHERE id = ?`, [templateId]);
      return NextResponse.json({ success: true, message: 'Email template deleted' });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
