import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import nodemailer from 'nodemailer';

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    },
  });
}

// POST: Public REST endpoint for external websites to send emails without SMTP
export async function POST(request: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  };

  try {
    // 1. Authenticate API Key from headers or body
    const authHeader = request.headers.get('authorization') || '';
    const customHeader = request.headers.get('x-api-key') || '';
    let apiKey = customHeader;

    if (!apiKey && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7).trim();
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Missing API Key. Pass "Authorization: Bearer <key>" or "x-api-key: <key>" header.' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 2. Validate API Key from database
    const [keyRows]: any = await pool.query(
      `SELECT k.id, k.user_id, k.sender_email, k.status, u.status as user_status, u.plan_id
       FROM api_keys k
       JOIN users u ON k.user_id = u.id
       WHERE k.api_key = ?`,
      [apiKey]
    );

    if (keyRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or unknown API Key' },
        { status: 401, headers: corsHeaders }
      );
    }

    const keyRecord = keyRows[0];
    if (keyRecord.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: This API Key has been revoked' },
        { status: 403, headers: corsHeaders }
      );
    }

    if (keyRecord.user_status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Account is inactive or pending payment approval' },
        { status: 403, headers: corsHeaders }
      );
    }

    // 3. Parse incoming email payload
    const body = await request.json().catch(() => ({}));
    const {
      from,
      to,
      subject,
      html,
      text,
      cc,
      bcc,
      replyTo,
    } = body;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error: "to", "subject", and either "html" or "text" body are required.',
          example: {
            from: "support@yourdomain.com (optional if bound to key)",
            to: "customer@example.com",
            subject: "Welcome to our website!",
            html: "<h1>Welcome!</h1><p>Your order has been confirmed.</p>",
          }
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // 4. Resolve sender mailbox
    let senderEmail = keyRecord.sender_email;
    if (!senderEmail && from) {
      senderEmail = from.includes('<') ? from.match(/<([^>]+)>/)?.[1] : from;
    }

    // Lookup user's company_id
    const [uRows]: any = await pool.query('SELECT id, company_id FROM users WHERE id = ?', [keyRecord.user_id]);
    const companyId = uRows[0]?.company_id || null;

    if (!senderEmail) {
      // Find the first available mailbox for this user or their company
      const [userBoxes]: any = await pool.query(
        `SELECT u.email, u.id FROM virtual_users u 
         WHERE u.user_id = ? OR (u.company_id = ? AND u.company_id IS NOT NULL) 
         LIMIT 1`,
        [keyRecord.user_id, companyId]
      );
      if (userBoxes.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No verified sender mailbox found in your MailBox Pro account. Please create a mailbox first.' },
          { status: 400, headers: corsHeaders }
        );
      }
      senderEmail = userBoxes[0].email;
    }

    // 5. Verify sender email belongs to user or company
    const [senderBox]: any = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.company_id, d.name as domain_name
       FROM virtual_users u
       JOIN virtual_domains d ON u.domain_id = d.id
       WHERE u.email = ? AND (u.user_id = ? OR (u.company_id = ? AND u.company_id IS NOT NULL))`,
      [senderEmail, keyRecord.user_id, companyId]
    );

    if (senderBox.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Sender "${senderEmail}" is not configured or verified under your account. Please create this mailbox in your dashboard first.`
        },
        { status: 403, headers: corsHeaders }
      );
    }

    const mailbox = senderBox[0];
    const sizeKb = Math.ceil((Buffer.byteLength(html || text || '', 'utf8') + 2048) / 1024);

    // 6. Record message in webmail_messages table (Sent folder)
    const [insertResult]: any = await pool.query(
      `INSERT INTO webmail_messages
       (mailbox_id, folder, sender, sender_name, recipients, subject, body_html, body_text, is_read, size_kb)
       VALUES (?, 'sent', ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        mailbox.id,
        mailbox.email,
        from && from.includes('<') ? from.split('<')[0].trim() : mailbox.full_name || mailbox.email,
        Array.isArray(to) ? to.join(', ') : to,
        subject,
        html || `<p>${text}</p>`,
        text || '',
        sizeKb,
      ]
    );

    // 7. Increment sender's company month_sent_count
    if (mailbox.company_id) {
      await pool.query('UPDATE companies SET month_sent_count = month_sent_count + 1 WHERE id = ?', [mailbox.company_id]);
    }

    // 8. Deliver via local Postfix SMTP to external destinations (Gmail, Yahoo, Outlook, etc.)
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
        from: `"${from && from.includes('<') ? from.split('<')[0].trim() : mailbox.full_name || mailbox.email}" <${mailbox.email}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        cc: cc || undefined,
        bcc: bcc || undefined,
        replyTo: replyTo || mailbox.email,
        subject,
        text: text || '',
        html: html || `<p>${text}</p>`,
      });
    } catch (smtpErr: any) {
      console.error('REST API Postfix SMTP relay log:', smtpErr.message);
    }

    // 9. Deliver locally if recipient exists in virtual_users
    const recipientList = (Array.isArray(to) ? to : to.split(',')).map((e: string) => e.trim().toLowerCase());
    for (const rec of recipientList) {
      const cleanRec = rec.includes('<') ? rec.match(/<([^>]+)>/)?.[1] || rec : rec;
      const [localRec]: any = await pool.query('SELECT id, company_id FROM virtual_users WHERE email = ?', [cleanRec]);
      if (localRec.length > 0) {
        await pool.query(
          `INSERT INTO webmail_messages 
           (mailbox_id, folder, sender, sender_name, recipients, subject, body_html, body_text, is_read, size_kb)
           VALUES (?, 'inbox', ?, ?, ?, ?, ?, ?, 0, ?)`,
          [
            localRec[0].id,
            mailbox.email,
            mailbox.full_name || mailbox.email,
            cleanRec,
            subject,
            html || `<p>${text}</p>`,
            text || '',
            sizeKb,
          ]
        );

        if (localRec[0].company_id) {
          await pool.query('UPDATE companies SET month_received_count = month_received_count + 1 WHERE id = ?', [localRec[0].company_id]);
        }
      }
    }

    // 10. Update API key usage statistics
    await pool.query(
      `UPDATE api_keys 
       SET total_requests = total_requests + 1, last_used_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [keyRecord.id]
    );

    return NextResponse.json(
      {
        success: true,
        messageId: `msg_${insertResult.insertId}`,
        from: mailbox.email,
        to,
        subject,
        status: 'delivered',
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
