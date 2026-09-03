import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Retrieve all templates for user or company
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const companyId = searchParams.get('companyId');

    if (!userId && !companyId) {
      return NextResponse.json({ success: false, message: 'userId or companyId is required' }, { status: 400 });
    }

    let query = 'SELECT * FROM email_templates WHERE ';
    const params: any[] = [];

    if (companyId) {
      query += '(company_id = ? OR user_id = ?)';
      params.push(companyId, userId || 0);
    } else {
      query += 'user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY id DESC';

    const [templates]: any = await pool.query(query, params);

    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Create, update, or delete template
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action = 'create', userId, companyId, templateId, name, subject, category = 'General', bodyHtml, bodyText } = body;

    if (action === 'create') {
      if (!name || !subject || !bodyHtml) {
        return NextResponse.json(
          { success: false, message: 'Template Name, Subject, and Content are required.' },
          { status: 400 }
        );
      }

      const [res]: any = await pool.query(
        `INSERT INTO email_templates (company_id, user_id, name, subject, category, body_html, body_text)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [companyId || 1, userId || 1, name.trim(), subject.trim(), category.trim(), bodyHtml, bodyText || '']
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
