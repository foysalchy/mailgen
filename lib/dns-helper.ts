import crypto from 'crypto';

/**
 * Generate 2048-bit RSA keypair for DKIM
 */
export function generateDkimKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  // Extract clean base64 string for DNS TXT record
  const cleanPublicKey = publicKey
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\r?\n|\r/g, '')
    .trim();

  return {
    publicKeyPem: publicKey,
    privateKeyPem: privateKey,
    dnsRecordValue: `v=DKIM1; k=rsa; p=${cleanPublicKey}`,
  };
}

/**
 * Helper to generate required DNS records for any domain
 */
export function getRecommendedDnsRecords(domainName: string, dkimPublicKeyClean: string) {
  const mailHost = process.env.MAIL_SERVER_HOST || 'mail.yourdomain.com';

  return [
    {
      type: 'MX',
      host: '@',
      value: `${mailHost}.`,
      priority: 10,
      description: 'Routes incoming email traffic to your mail server',
      status: 'pending',
    },
    {
      type: 'TXT',
      host: '@',
      value: `v=spf1 mx a:${mailHost} ~all`,
      priority: null,
      description: 'SPF (Sender Policy Framework) authorizes your mail server to send emails',
      status: 'pending',
    },
    {
      type: 'TXT',
      host: 'mail._domainkey',
      value: `v=DKIM1; k=rsa; p=${dkimPublicKeyClean}`,
      priority: null,
      description: 'DKIM cryptographic signature to guarantee email authenticity and prevent spoofing',
      status: 'pending',
    },
    {
      type: 'TXT',
      host: '_dmarc',
      value: 'v=DMARC1; p=quarantine; pct=100; rua=mailto:postmaster@' + domainName,
      priority: null,
      description: 'DMARC policy instructs receiving mail servers on handling unauthenticated mail',
      status: 'pending',
    },
  ];
}
