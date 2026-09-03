import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const companyId = searchParams.get('companyId');

    // Get campaigns with status and stats (matching user_id OR company_id)
    let campaignsQuery = `
      SELECT c.*, l.name as list_name, u.email as sender_email
      FROM bulk_campaigns c
      LEFT JOIN contact_lists l ON c.list_id = l.id
      LEFT JOIN virtual_users u ON c.mailbox_id = u.id
      WHERE 1=1
    `;
    const campParams: any[] = [];
    if (companyId) {
      campaignsQuery += ` AND (c.user_id = ? OR c.user_id IN (SELECT id FROM users WHERE company_id = ?))`;
      campParams.push(userId || '0', companyId);
    } else if (userId) {
      campaignsQuery += ` AND c.user_id = ?`;
      campParams.push(userId);
    }
    campaignsQuery += ` ORDER BY c.created_at DESC`;
    const [campaigns]: any = await pool.query(campaignsQuery, campParams);

    // Get contact lists (groups) with contact count and sample contacts
    let listsQuery = `
      SELECT l.*, 
        (SELECT COUNT(*) FROM contacts WHERE list_id = l.id) as contact_count
      FROM contact_lists l
      WHERE 1=1
    `;
    const listParams: any[] = [];
    if (companyId) {
      listsQuery += ` AND (l.user_id = ? OR l.user_id IN (SELECT id FROM users WHERE company_id = ?))`;
      listParams.push(userId || '0', companyId);
    } else if (userId) {
      listsQuery += ` AND l.user_id = ?`;
      listParams.push(userId);
    }
    listsQuery += ` ORDER BY l.created_at DESC`;
    const [lists]: any = await pool.query(listsQuery, listParams);

    // Fetch contacts for each list
    for (const list of lists) {
      const [contacts]: any = await pool.query(
        'SELECT id, email, name, company FROM contacts WHERE list_id = ? ORDER BY id ASC LIMIT 50',
        [list.id]
      );
      list.contacts = contacts;
    }

    return NextResponse.json({ success: true, campaigns, lists });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userId = 1, companyId } = body;

    // Action 1: Create Contact Group / List with contacts
    if (action === 'create_list') {
      const { name, contacts = [] } = body;
      if (!name || !name.trim()) return NextResponse.json({ success: false, message: 'Group name is required' }, { status: 400 });

      const [resList]: any = await pool.query('INSERT INTO contact_lists (user_id, name) VALUES (?, ?)', [userId, name.trim()]);
      const listId = resList.insertId;

      if (contacts.length > 0) {
        for (const c of contacts) {
          if (c.email && c.email.trim()) {
            await pool.query(
              'INSERT INTO contacts (list_id, email, name, company) VALUES (?, ?, ?, ?)',
              [listId, c.email.trim(), c.name || '', c.company || '']
            );
          }
        }
      }

      return NextResponse.json({ success: true, listId, message: `Group "${name}" created successfully with ${contacts.length} contacts!` });
    }

    // Action 1b: Delete Group
    if (action === 'delete_list') {
      const { listId } = body;
      if (!listId) return NextResponse.json({ success: false, message: 'listId is required' }, { status: 400 });
      await pool.query('DELETE FROM contacts WHERE list_id = ?', [listId]);
      await pool.query('DELETE FROM contact_lists WHERE id = ?', [listId]);
      return NextResponse.json({ success: true, message: 'Contact group and its members deleted successfully' });
    }

    // Action 2: Add Contacts to existing group
    if (action === 'add_contacts_to_group') {
      const { listId, contacts = [] } = body;
      if (!listId) return NextResponse.json({ success: false, message: 'listId is required' }, { status: 400 });

      for (const c of contacts) {
        if (c.email && c.email.trim()) {
          await pool.query(
            'INSERT INTO contacts (list_id, email, name, company) VALUES (?, ?, ?, ?)',
            [listId, c.email.trim(), c.name || '', c.company || '']
          );
        }
      }
      return NextResponse.json({ success: true, message: `Added ${contacts.length} contacts to group` });
    }

    // Action 3: Create & Queue-Dispatch Bulk Campaign with Tag Replacement
    if (action === 'create_campaign') {
      const { mailboxId, listId, title, subject, bodyHtml } = body;
      if (!mailboxId || !listId || !subject || !bodyHtml) {
        return NextResponse.json({ success: false, message: 'All campaign fields are required' }, { status: 400 });
      }

      // Fetch sender mailbox
      const [senders]: any = await pool.query('SELECT * FROM virtual_users WHERE id = ?', [mailboxId]);
      if (senders.length === 0) {
        return NextResponse.json({ success: false, message: 'Sender mailbox not found' }, { status: 404 });
      }
      const senderBox = senders[0];

      // Fetch contacts in selected group
      const [contacts]: any = await pool.query('SELECT * FROM contacts WHERE list_id = ? AND is_unsubscribed = 0', [listId]);

      if (contacts.length === 0) {
        return NextResponse.json({ success: false, message: 'Selected group has no active contacts to send.' }, { status: 400 });
      }

      const [resCamp]: any = await pool.query(
        `INSERT INTO bulk_campaigns (user_id, mailbox_id, list_id, title, subject, body_html, status, total_recipients, sent_count)
         VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?)`,
        [userId, mailboxId, listId, title || subject, subject, bodyHtml, contacts.length, contacts.length]
      );

      // Queue-like dispatch: personalize tags for each contact one by one
      for (const recipient of contacts) {
        const unsubscribeUrl = `http://localhost:3000/unsubscribe?email=${encodeURIComponent(recipient.email)}`;
        
        let personalizedHtml = bodyHtml
          .replace(/\{\{\s*name\s*\}\}/gi, recipient.name || 'Valued Customer')
          .replace(/\{\{\s*email\s*\}\}/gi, recipient.email)
          .replace(/\{\{\s*company\s*\}\}/gi, recipient.company || 'Your Organization')
          .replace(/\{\{\s*unsubscribeUrl\s*\}\}/gi, unsubscribeUrl);

        let personalizedSubject = subject
          .replace(/\{\{\s*name\s*\}\}/gi, recipient.name || 'Valued Customer')
          .replace(/\{\{\s*company\s*\}\}/gi, recipient.company || 'Your Organization');

        await pool.query(
          `INSERT INTO webmail_messages (mailbox_id, folder, sender, sender_name, recipients, subject, body_html, size_kb, is_read)
           VALUES (?, 'sent', ?, ?, ?, ?, ?, 15, 1)`,
          [
            mailboxId,
            senderBox.email,
            senderBox.full_name || senderBox.email,
            recipient.email,
            personalizedSubject,
            personalizedHtml,
          ]
        );
      }

      return NextResponse.json({
        success: true,
        campaignId: resCamp.insertId,
        sentCount: contacts.length,
        message: `Queue processed! Delivered to ${contacts.length} recipients with customized tags!`,
      });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
