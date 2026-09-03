import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mailboxId = searchParams.get('mailboxId');
    const userId = searchParams.get('userId');

    let folders: any[] = [];
    let labels: any[] = [];

    if (mailboxId) {
      const [f]: any = await pool.query('SELECT * FROM custom_folders WHERE mailbox_id = ? ORDER BY name ASC', [mailboxId]);
      folders = f;
    }

    if (userId) {
      const [l]: any = await pool.query('SELECT * FROM custom_labels WHERE user_id = ? ORDER BY name ASC', [userId]);
      labels = l;
    }

    return NextResponse.json({ success: true, folders, labels });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, name, color } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    if (type === 'folder') {
      const { mailboxId } = body;
      const [res]: any = await pool.query(
        'INSERT INTO custom_folders (mailbox_id, name, color) VALUES (?, ?, ?)',
        [mailboxId, name, color || '#3b82f6']
      );
      return NextResponse.json({ success: true, id: res.insertId, message: 'Folder created successfully' });
    }

    if (type === 'label') {
      const { userId } = body;
      const [res]: any = await pool.query(
        'INSERT INTO custom_labels (user_id, name, color) VALUES (?, ?, ?)',
        [userId, name, color || '#10b981']
      );
      return NextResponse.json({ success: true, id: res.insertId, message: 'Label created successfully' });
    }

    return NextResponse.json({ success: false, message: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE: Delete a custom folder or custom tag/label
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id || !type) {
      return NextResponse.json({ success: false, message: 'Type and ID are required' }, { status: 400 });
    }

    if (type === 'folder') {
      await pool.query('DELETE FROM custom_folders WHERE id = ?', [id]);
      return NextResponse.json({ success: true, message: 'Custom folder deleted successfully' });
    }

    if (type === 'label' || type === 'tag') {
      await pool.query('DELETE FROM custom_labels WHERE id = ?', [id]);
      return NextResponse.json({ success: true, message: 'Tag / Label deleted successfully' });
    }

    return NextResponse.json({ success: false, message: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
