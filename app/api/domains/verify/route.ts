import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyDomainDns } from '@/lib/dns-checker';

export async function POST(request: Request) {
  try {
    const { domainId } = await request.json();

    const [rows]: any = await pool.query('SELECT * FROM virtual_domains WHERE id = ?', [domainId]);
    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Domain not found' }, { status: 404 });
    }

    const domain = rows[0];
    const mailHost = process.env.MAIL_SERVER_HOST || 'mail.yourdomain.com';

    // Verify DNS
    const checkResult = await verifyDomainDns(domain.name, mailHost, domain.dkim_selector || 'mail');

    // If MX and SPF are valid, we can mark as verified
    const isVerified = checkResult.mxMatched || checkResult.spfMatched;

    if (isVerified && !domain.is_verified) {
      await pool.query('UPDATE virtual_domains SET is_verified = 1 WHERE id = ?', [domainId]);
    }

    return NextResponse.json({
      success: true,
      isVerified,
      checkResult,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
