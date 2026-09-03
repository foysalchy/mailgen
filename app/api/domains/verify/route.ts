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

    // Verify DNS with real-time lookup
    const checkResult = await verifyDomainDns(domain.name, mailHost, domain.dkim_selector || 'mail');

    // Both MX and SPF must actually exist on Cloudflare to be verified
    const isVerified = Boolean(checkResult.mxMatched && checkResult.spfMatched);

    // Sync database with current real-world DNS status
    await pool.query('UPDATE virtual_domains SET is_verified = ? WHERE id = ?', [isVerified ? 1 : 0, domainId]);

    return NextResponse.json({
      success: true,
      isVerified,
      checkResult,
      message: isVerified ? 'Domain verified successfully!' : 'DNS records not detected yet on Cloudflare or missing.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
