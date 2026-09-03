import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import nodemailer from 'nodemailer';

// GET messages for a specific folder/custom folder/mailbox
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mailboxId = searchParams.get('mailboxId');
    const folder = searchParams.get('folder') || 'inbox';
    const customFolderId = searchParams.get('customFolderId');
    const labelId = searchParams.get('labelId');
    const search = searchParams.get('q') || '';

    if (!mailboxId) {
      return NextResponse.json({ success: false, message: 'mailboxId is required' }, { status: 400 });
    }

    let query = `
      SELECT m.id, m.mailbox_id, m.folder, m.sender, m.sender_name, m.recipients, m.subject, 
             m.body_html, m.body_text, m.headers_raw, SUBSTRING(m.body_text, 1, 150) as snippet, 
             m.has_attachments, m.is_read, m.is_starred, m.scheduled_at, m.is_scheduled, m.size_kb, m.created_at,
             (SELECT GROUP_CONCAT(cl.name, ':', cl.color) FROM message_labels ml JOIN custom_labels cl ON ml.label_id = cl.id WHERE ml.message_id = m.id) as labels
      FROM webmail_messages m
      WHERE m.mailbox_id = ?
    `;
    const params: any[] = [mailboxId];

    if (customFolderId) {
      query += ' AND m.custom_folder_id = ?';
      params.push(customFolderId);
    } else if (labelId) {
      query += ' AND m.id IN (SELECT message_id FROM message_labels WHERE label_id = ?)';
      params.push(labelId);
    } else if (folder === 'starred') {
      query += ' AND m.is_starred = 1 AND m.folder != "trash"';
    } else {
      query += ' AND m.folder = ?';
      params.push(folder);
    }

    if (search.trim()) {
      query += ` AND (m.subject LIKE ? OR m.sender LIKE ? OR m.body_text LIKE ?)`;
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY m.created_at DESC LIMIT 100';

    const [messages]: any = await pool.query(query, params);

    // Counts per standard folder
    const [counts]: any = await pool.query(
      `SELECT folder, COUNT(*) as total, SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread
       FROM webmail_messages
       WHERE mailbox_id = ?
       GROUP BY folder`,
      [mailboxId]
    );

    const [starredCount]: any = await pool.query(
      `SELECT COUNT(*) as total FROM webmail_messages WHERE mailbox_id = ? AND is_starred = 1 AND folder != 'trash'`,
      [mailboxId]
    );

    // Get current mailbox storage usage
    const [usage]: any = await pool.query(
      `SELECT COALESCE(SUM(size_kb), 0) as used_kb, COUNT(*) as total_msgs
       FROM webmail_messages WHERE mailbox_id = ?`,
      [mailboxId]
    );

    return NextResponse.json({
      success: true,
      messages,
      folderStats: counts,
      starredTotal: starredCount[0]?.total || 0,
      storageUsage: usage[0] || { used_kb: 0, total_msgs: 0 },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Send, Schedule, Move, Star, or Delete (Trash/Permanent) emails
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action = 'send' } = body;

    // Action: Toggle Starred
    if (action === 'toggle_star') {
      const { messageId, isStarred } = body;
      await pool.query('UPDATE webmail_messages SET is_starred = ? WHERE id = ?', [isStarred ? 1 : 0, messageId]);
      return NextResponse.json({ success: true, message: isStarred ? 'Starred' : 'Unstarred' });
    }

    // Action: Bulk Move (Trash, Archive, Spam, Inbox)
    if (action === 'bulk_move') {
      const { messageIds, folder } = body;
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return NextResponse.json({ success: false, message: 'No messages selected' }, { status: 400 });
      }
      await pool.query(
        `UPDATE webmail_messages SET folder = ? WHERE id IN (${messageIds.map(() => '?').join(',')})`,
        [folder, ...messageIds]
      );
      return NextResponse.json({ success: true, message: `${messageIds.length} message(s) moved to ${folder}` });
    }

    // Action: Bulk Permanent Delete
    if (action === 'bulk_delete') {
      const { messageIds } = body;
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return NextResponse.json({ success: false, message: 'No messages selected' }, { status: 400 });
      }
      await pool.query(
        `DELETE FROM webmail_messages WHERE id IN (${messageIds.map(() => '?').join(',')})`,
        [...messageIds]
      );
      return NextResponse.json({ success: true, message: `${messageIds.length} message(s) permanently deleted` });
    }

    // Action 1: Move to Trash, Spam, Archive or Custom Folder
    if (action === 'move') {
      const { messageId, folder, customFolderId } = body;
      await pool.query(
        'UPDATE webmail_messages SET folder = ?, custom_folder_id = ? WHERE id = ?',
        [folder, customFolderId || null, messageId]
      );
      return NextResponse.json({ success: true, message: 'Message moved successfully' });
    }

    // Action 2: Permanent Delete
    if (action === 'delete') {
      const { messageId } = body;
      await pool.query('DELETE FROM webmail_messages WHERE id = ?', [messageId]);
      return NextResponse.json({ success: true, message: 'Message permanently deleted' });
    }

    // Action 3: Assign Label to message
    if (action === 'assign_label') {
      const { messageId, labelId } = body;
      await pool.query('INSERT IGNORE INTO message_labels (message_id, label_id) VALUES (?, ?)', [messageId, labelId]);
      return NextResponse.json({ success: true, message: 'Label assigned' });
    }

    // Action 4: Send or Schedule email
    if (action === 'send' || action === 'schedule') {
      const { mailboxId, to, cc, bcc, subject, bodyHtml, bodyText, scheduledAt } = body;

      if (!mailboxId || !to || !subject) {
        return NextResponse.json({ success: false, message: 'Missing required mail fields' }, { status: 400 });
      }

      // Check sender mailbox
      const [rows]: any = await pool.query(
        `SELECT u.*, d.name as domain_name FROM virtual_users u
         JOIN virtual_domains d ON u.domain_id = d.id
         WHERE u.id = ?`,
        [mailboxId]
      );

      if (rows.length === 0) {
        return NextResponse.json({ success: false, message: 'Sender mailbox not found' }, { status: 404 });
      }

      const senderMailbox = rows[0];
      const isScheduled = action === 'schedule' && scheduledAt ? true : false;
      const targetFolder = isScheduled ? 'drafts' : 'sent';
      const sizeKb = Math.ceil((Buffer.byteLength(bodyHtml || bodyText || '', 'utf8') + 2048) / 1024);

      // Store in Sent or Drafts (Scheduled)
      const [inserted]: any = await pool.query(
        `INSERT INTO webmail_messages 
         (mailbox_id, folder, sender, sender_name, recipients, subject, body_html, body_text, is_read, is_scheduled, scheduled_at, size_kb)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [
          mailboxId,
          targetFolder,
          senderMailbox.email,
          senderMailbox.full_name || senderMailbox.email,
          to,
          subject,
          bodyHtml || `<p>${bodyText}</p>`,
          bodyText || '',
          isScheduled ? 1 : 0,
          isScheduled ? scheduledAt : null,
          sizeKb,
        ]
      );

      // If not scheduled, deliver immediately via local Postfix SMTP and local inbox routing
      if (!isScheduled) {
        // Increment company sent count
        if (senderMailbox.company_id) {
          await pool.query('UPDATE companies SET month_sent_count = month_sent_count + 1 WHERE id = ?', [senderMailbox.company_id]);
        }

        // 1. Dispatch real email to external world (Gmail, Yahoo, Outlook, etc.) via local Postfix
        try {
          const transporter = nodemailer.createTransport({
            host: '127.0.0.1',
            port: 25,
            secure: false,
            tls: {
              rejectUnauthorized: false,
            },
          });

          await transporter.sendMail({
            from: `"${senderMailbox.full_name || senderMailbox.email}" <${senderMailbox.email}>`,
            to,
            cc: cc || undefined,
            bcc: bcc || undefined,
            subject,
            text: bodyText || '',
            html: bodyHtml || `<p>${bodyText}</p>`,
          });
        } catch (smtpErr: any) {
          console.error('Local Postfix SMTP relay notice:', smtpErr.message);
        }

        // 2. Deliver copy to internal inbox if recipient belongs to MailBox Pro
        const recipientEmails = to.split(',').map((e: string) => e.trim().toLowerCase());
        for (const recEmail of recipientEmails) {
          const [localRec]: any = await pool.query('SELECT id, company_id FROM virtual_users WHERE email = ?', [recEmail]);
          if (localRec.length > 0) {
            await pool.query(
              `INSERT INTO webmail_messages 
               (mailbox_id, folder, sender, sender_name, recipients, subject, body_html, body_text, is_read, size_kb)
               VALUES (?, 'inbox', ?, ?, ?, ?, ?, ?, 0, ?)`,
              [
                localRec[0].id,
                senderMailbox.email,
                senderMailbox.full_name || senderMailbox.email,
                to,
                subject,
                bodyHtml || `<p>${bodyText}</p>`,
                bodyText || '',
                sizeKb,
              ]
            );

            // Increment recipient company received count
            if (localRec[0].company_id) {
              await pool.query('UPDATE companies SET month_received_count = month_received_count + 1 WHERE id = ?', [localRec[0].company_id]);
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        messageId: inserted.insertId,
        message: isScheduled ? `Email scheduled for ${scheduledAt}` : 'Email sent successfully',
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
