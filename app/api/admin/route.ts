import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET: Fetch Companies, Users, Plans, Invoices, and System-Wide Analytics for Super Admin
export async function GET() {
  try {
    // 1. Fetch all Companies (Tenants) with plan and statistics
    const [companies]: any = await pool.query(
      `SELECT c.id, c.name, c.business_email, c.phone, c.address, c.status, c.plan_id, c.created_at,
              c.month_sent_count, c.month_received_count, c.accumulated_overage_charge,
              p.name as plan_name, p.price_monthly, p.max_domains, p.max_mailboxes, p.storage_quota_mb,
              p.send_limit, p.receive_limit, p.extra_send_rate, p.extra_receive_rate,
              (SELECT u.name FROM users u WHERE u.company_id = c.id AND u.role = 'company_admin' LIMIT 1) as admin_name,
              (SELECT u.email FROM users u WHERE u.company_id = c.id AND u.role = 'company_admin' LIMIT 1) as admin_email,
              (SELECT COUNT(*) FROM virtual_domains vd WHERE vd.company_id = c.id) as domain_count,
              (SELECT COUNT(*) FROM virtual_users vu WHERE vu.company_id = c.id) as mailbox_count,
              (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id) as total_users
       FROM companies c
       LEFT JOIN plans p ON c.plan_id = p.id
       ORDER BY c.created_at DESC`
    );

    // 2. Fetch Users
    const [users]: any = await pool.query(
      `SELECT u.id, u.company_id, u.name, u.email, u.role, u.status, u.created_at,
              c.name as company_name, p.name as plan_name
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
       LEFT JOIN plans p ON u.plan_id = p.id
       ORDER BY u.created_at DESC`
    );

    // 3. Fetch Plans
    const [plans]: any = await pool.query('SELECT * FROM plans ORDER BY price_monthly ASC');

    // 4. Fetch Invoices with company details
    const [invoices]: any = await pool.query(
      `SELECT i.*, c.name as company_name, u.name as user_name, u.email as user_email
       FROM invoices i
       LEFT JOIN companies c ON i.company_id = c.id
       LEFT JOIN users u ON i.user_id = u.id
       ORDER BY i.created_at DESC`
    );

    // 5. System Stats
    const [stats]: any = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM companies) AS total_companies,
        (SELECT COUNT(*) FROM companies WHERE status = 'pending') AS pending_companies,
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM invoices WHERE status = 'pending') AS pending_invoices,
        (SELECT COUNT(*) FROM virtual_domains) AS total_domains,
        (SELECT COUNT(*) FROM virtual_users) AS total_mailboxes,
        (SELECT COUNT(*) FROM webmail_messages) AS total_messages`
    );

    return NextResponse.json({
      success: true,
      companies,
      users,
      plans,
      invoices,
      stats: stats[0],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Manage Super Admin Actions (Company Approval, Direct Upgrade, Invoices, User Status)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Action 1: Approve Company (Activates company, company admin user, and initial invoice)
    if (action === 'approve_company') {
      const { companyId } = body;
      if (!companyId) return NextResponse.json({ success: false, message: 'companyId is required' }, { status: 400 });

      // Update Company to active
      await pool.query('UPDATE companies SET status = "active" WHERE id = ?', [companyId]);

      // Update company users to active
      await pool.query('UPDATE users SET status = "active" WHERE company_id = ? AND status = "pending"', [companyId]);

      // Approve pending invoices for this company
      await pool.query(
        'UPDATE invoices SET status = "approved", approved_at = CURRENT_TIMESTAMP WHERE company_id = ? AND status = "pending"',
        [companyId]
      );

      return NextResponse.json({
        success: true,
        message: 'Company approved and activated successfully! The customer can now log in.',
      });
    }

    // Action 2: Suspend / Activate Company
    if (action === 'update_company_status') {
      const { companyId, status } = body;
      await pool.query('UPDATE companies SET status = ? WHERE id = ?', [status, companyId]);
      await pool.query('UPDATE users SET status = ? WHERE company_id = ?', [status, companyId]);
      return NextResponse.json({ success: true, message: `Company status changed to ${status}` });
    }

    // Action 3: Directly Change / Upgrade Company Package from Super Admin Panel
    if (action === 'admin_change_company_plan') {
      const { companyId, planId } = body;
      if (!companyId || !planId) {
        return NextResponse.json({ success: false, message: 'companyId and planId are required' }, { status: 400 });
      }

      const [planRows]: any = await pool.query('SELECT * FROM plans WHERE id = ?', [planId]);
      if (planRows.length === 0) {
        return NextResponse.json({ success: false, message: 'Selected plan not found' }, { status: 404 });
      }
      const targetPlan = planRows[0];

      // Fetch company admin user to associate invoice with user_id
      const [userRows]: any = await pool.query(
        'SELECT id FROM users WHERE company_id = ? AND role = "company_admin" LIMIT 1',
        [companyId]
      );
      const companyAdminId = userRows.length > 0 ? userRows[0].id : null;

      // Update company plan and clear pending_plan_id
      await pool.query('UPDATE companies SET plan_id = ?, pending_plan_id = NULL WHERE id = ?', [planId, companyId]);
      await pool.query('UPDATE users SET plan_id = ?, pending_plan_id = NULL WHERE company_id = ?', [planId, companyId]);

      // Generate invoice against this package change
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(companyId).padStart(4, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      await pool.query(
        `INSERT INTO invoices 
         (company_id, user_id, invoice_number, plan_id, plan_name, amount, base_amount, overage_amount, status, payment_method, transaction_id, approved_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0.00, 'approved', 'Super Admin Plan Change', 'ADMIN-UPGRADE', CURRENT_TIMESTAMP)`,
        [
          companyId,
          companyAdminId,
          invoiceNumber,
          targetPlan.id,
          targetPlan.name,
          targetPlan.price_monthly,
          targetPlan.price_monthly,
        ]
      );

      return NextResponse.json({
        success: true,
        message: `Company package upgraded to "${targetPlan.name}"! Limits updated and Invoice ${invoiceNumber} created.`,
      });
    }

    // Action 4: Approve Invoice
    if (action === 'approve_invoice') {
      const { invoiceId } = body;
      const [invRows]: any = await pool.query('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
      if (invRows.length === 0) {
        return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 });
      }
      const inv = invRows[0];

      await pool.query('UPDATE invoices SET status = "approved", approved_at = CURRENT_TIMESTAMP WHERE id = ?', [invoiceId]);

      // Apply upgraded plan to company & company users
      if (inv.company_id) {
        await pool.query('UPDATE companies SET plan_id = ?, pending_plan_id = NULL, status = "active" WHERE id = ?', [
          inv.plan_id,
          inv.company_id,
        ]);
        await pool.query('UPDATE users SET plan_id = ?, pending_plan_id = NULL, status = "active" WHERE company_id = ?', [
          inv.plan_id,
          inv.company_id,
        ]);
      }

      return NextResponse.json({
        success: true,
        message: `Invoice ${inv.invoice_number} approved! Company package updated to "${inv.plan_name}".`,
      });
    }

    // Action 5: Reject Invoice
    if (action === 'reject_invoice') {
      const { invoiceId } = body;
      const [invRows]: any = await pool.query('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
      if (invRows.length === 0) {
        return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 });
      }
      const inv = invRows[0];

      await pool.query('UPDATE invoices SET status = "rejected" WHERE id = ?', [invoiceId]);
      if (inv.company_id) {
        await pool.query('UPDATE companies SET pending_plan_id = NULL WHERE id = ?', [inv.company_id]);
      }

      return NextResponse.json({ success: true, message: `Invoice ${inv.invoice_number} rejected.` });
    }

    // Action 6: Save Plan (including send/receive limits & extra overage rates)
    if (action === 'save_plan') {
      const {
        id,
        name,
        slug,
        price_monthly,
        max_domains,
        max_mailboxes,
        storage_quota_mb,
        bulk_mail_daily_limit,
        send_limit = 500,
        receive_limit = 1000,
        extra_send_rate = 0.05,
        extra_receive_rate = 0.02,
      } = body;

      if (id) {
        await pool.query(
          `UPDATE plans 
           SET name = ?, price_monthly = ?, max_domains = ?, max_mailboxes = ?, storage_quota_mb = ?, bulk_mail_daily_limit = ?,
               send_limit = ?, receive_limit = ?, extra_send_rate = ?, extra_receive_rate = ?
           WHERE id = ?`,
          [
            name,
            price_monthly,
            max_domains,
            max_mailboxes,
            storage_quota_mb,
            bulk_mail_daily_limit,
            send_limit,
            receive_limit,
            extra_send_rate,
            extra_receive_rate,
            id,
          ]
        );
        return NextResponse.json({ success: true, message: 'Plan updated successfully' });
      } else {
        const cleanSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]/g, '-');
        await pool.query(
          `INSERT INTO plans (name, slug, price_monthly, max_domains, max_mailboxes, storage_quota_mb, bulk_mail_daily_limit, send_limit, receive_limit, extra_send_rate, extra_receive_rate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            name,
            cleanSlug,
            price_monthly,
            max_domains,
            max_mailboxes,
            storage_quota_mb,
            bulk_mail_daily_limit,
            send_limit,
            receive_limit,
            extra_send_rate,
            extra_receive_rate,
          ]
        );
        return NextResponse.json({ success: true, message: 'New plan created successfully' });
      }
    }

    // Action 7: Super Admin Creates a New Company Directly
    if (action === 'admin_create_company') {
      const {
        companyName,
        businessEmail,
        phone,
        address,
        adminName,
        adminEmail,
        adminPassword,
        planId,
      } = body;

      if (!companyName || !adminName || !adminEmail || !adminPassword || !planId) {
        return NextResponse.json(
          { success: false, message: 'Company Name, Admin Name, Admin Email, Password, and Plan are required' },
          { status: 400 }
        );
      }

      const cleanAdminEmail = adminEmail.toLowerCase().trim();
      const cleanBusinessEmail = (businessEmail || adminEmail).toLowerCase().trim();

      // Check if admin user email already exists
      const [existingUser]: any = await pool.query('SELECT id FROM users WHERE email = ?', [cleanAdminEmail]);
      if (existingUser.length > 0) {
        return NextResponse.json(
          { success: false, message: 'An account with this admin email already exists' },
          { status: 409 }
        );
      }

      // Fetch target plan
      const [planRows]: any = await pool.query('SELECT * FROM plans WHERE id = ?', [planId]);
      if (planRows.length === 0) {
        return NextResponse.json({ success: false, message: 'Selected plan not found' }, { status: 404 });
      }
      const plan = planRows[0];

      // 1. Create company in active status
      const [compRes]: any = await pool.query(
        `INSERT INTO companies (name, business_email, phone, address, plan_id, status)
         VALUES (?, ?, ?, ?, ?, 'active')`,
        [companyName.trim(), cleanBusinessEmail, (phone || '').trim(), (address || '').trim(), plan.id]
      );
      const companyId = compRes.insertId;

      // 2. Hash password & create owner admin user in active status
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);

      const [userRes]: any = await pool.query(
        `INSERT INTO users (company_id, name, email, password_hash, plan_id, role, status)
         VALUES (?, ?, ?, ?, ?, 'company_admin', 'active')`,
        [companyId, adminName.trim(), cleanAdminEmail, passwordHash, plan.id]
      );
      const userId = userRes.insertId;

      // 3. Generate initial approved invoice
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(companyId).padStart(4, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      await pool.query(
        `INSERT INTO invoices 
         (company_id, user_id, invoice_number, plan_id, plan_name, amount, base_amount, overage_amount, status, payment_method, transaction_id, approved_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0.00, 'approved', 'Super Admin Direct Provision', 'ADMIN-CREATE', CURRENT_TIMESTAMP)`,
        [
          companyId,
          userId,
          invoiceNumber,
          plan.id,
          plan.name,
          plan.price_monthly,
          plan.price_monthly,
        ]
      );

      return NextResponse.json({
        success: true,
        message: `Company "${companyName}" created and activated with ${plan.name}! Admin user: ${cleanAdminEmail}`,
        companyId,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
