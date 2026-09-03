import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Retrieve billing summary & invoices for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }

    // 1. Fetch user & company's current plan, limits, and usage
    const [userRows]: any = await pool.query(
      `SELECT u.id, u.company_id, u.name, u.email, u.status as user_status, u.plan_id, u.pending_plan_id,
              c.name as company_name, c.month_sent_count, c.month_received_count, c.accumulated_overage_charge,
              p.name as current_plan_name, p.price_monthly as current_price, p.max_domains, p.max_mailboxes, p.storage_quota_mb,
              p.send_limit, p.receive_limit, p.extra_send_rate, p.extra_receive_rate,
              pp.name as pending_plan_name, pp.price_monthly as pending_price
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
       LEFT JOIN plans p ON (c.plan_id = p.id OR u.plan_id = p.id)
       LEFT JOIN plans pp ON (c.pending_plan_id = pp.id OR u.pending_plan_id = pp.id)
       WHERE u.id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const userData = userRows[0];
    const companyId = userData.company_id || 1;

    // 2. Fetch all company invoices with itemized overages
    const [invoices]: any = await pool.query(
      `SELECT id, company_id, user_id, invoice_number, plan_id, plan_name, 
              amount, base_amount, overage_amount, extra_sent_count, extra_received_count,
              billing_cycle, status, payment_method, transaction_id, created_at, approved_at, due_date
       FROM invoices 
       WHERE company_id = ? OR user_id = ? 
       ORDER BY created_at DESC`,
      [companyId, userId]
    );

    // Calculate current month extra overages
    const sentLimit = userData.send_limit || 500;
    const receiveLimit = userData.receive_limit || 1000;
    const sentCount = userData.month_sent_count || 0;
    const receiveCount = userData.month_received_count || 0;

    const extraSent = Math.max(0, sentCount - sentLimit);
    const extraReceived = Math.max(0, receiveCount - receiveLimit);
    const extraSendCharge = extraSent * Number(userData.extra_send_rate || 0.05);
    const extraReceiveCharge = extraReceived * Number(userData.extra_receive_rate || 0.02);
    const totalCurrentOverage = Number((extraSendCharge + extraReceiveCharge).toFixed(2));

    return NextResponse.json({
      success: true,
      billing: {
        companyName: userData.company_name,
        currentPlan: {
          id: userData.plan_id,
          name: userData.current_plan_name || 'Standard Plan',
          price: Number(userData.current_price || 0),
          maxDomains: userData.max_domains,
          maxMailboxes: userData.max_mailboxes,
          storageQuotaMb: userData.storage_quota_mb,
          sendLimit: sentLimit,
          receiveLimit: receiveLimit,
          extraSendRate: Number(userData.extra_send_rate || 0.05),
          extraReceiveRate: Number(userData.extra_receive_rate || 0.02),
        },
        usage: {
          monthSentCount: sentCount,
          monthReceivedCount: receiveCount,
          extraSent: extraSent,
          extraReceived: extraReceived,
          extraSendCharge: Number(extraSendCharge.toFixed(2)),
          extraReceiveCharge: Number(extraReceiveCharge.toFixed(2)),
          totalCurrentOverage: totalCurrentOverage,
          nextMonthEstimatedBill: Number((Number(userData.current_price || 0) + totalCurrentOverage).toFixed(2)),
        },
        pendingUpgrade: userData.pending_plan_id
          ? {
              id: userData.pending_plan_id,
              name: userData.pending_plan_name,
              price: Number(userData.pending_price || 0),
            }
          : null,
        invoices: invoices || [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Request Plan Upgrade or Submit Invoice Payment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action = 'request_upgrade', userId, newPlanId, paymentMethod = 'card', transactionId = '' } = body;

    if (!userId || !newPlanId) {
      return NextResponse.json({ success: false, message: 'userId and newPlanId are required' }, { status: 400 });
    }

    // 1. Get plan details and user's company_id
    const [planRows]: any = await pool.query('SELECT * FROM plans WHERE id = ?', [newPlanId]);
    if (planRows.length === 0) {
      return NextResponse.json({ success: false, message: 'Target plan not found' }, { status: 404 });
    }
    const targetPlan = planRows[0];

    const [uRows]: any = await pool.query('SELECT company_id FROM users WHERE id = ?', [userId]);
    const companyId = uRows[0]?.company_id || 1;

    // 2. Generate unique invoice number: INV-YEAR-COMP-RANDOM
    const invNumber = `INV-${new Date().getFullYear()}-${String(companyId).padStart(4, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Insert pending invoice
    const [invRes]: any = await pool.query(
      `INSERT INTO invoices (company_id, user_id, invoice_number, plan_id, plan_name, amount, status, payment_method, transaction_id)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        companyId,
        userId,
        invNumber,
        targetPlan.id,
        targetPlan.name,
        targetPlan.price_monthly,
        paymentMethod,
        transactionId.trim() || `TRX-${Date.now()}`,
      ]
    );

    // 4. Mark company and user with pending_plan_id (will NOT activate until super admin approves)
    await pool.query('UPDATE users SET pending_plan_id = ? WHERE id = ?', [targetPlan.id, userId]);
    await pool.query('UPDATE companies SET pending_plan_id = ? WHERE id = ?', [targetPlan.id, companyId]);

    return NextResponse.json({
      success: true,
      invoiceNumber: invNumber,
      message: `Upgrade request for "${targetPlan.name}" submitted! Invoice ${invNumber} is pending Super Admin review and will be activated once approved.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
