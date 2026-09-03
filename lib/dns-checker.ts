import dns from 'dns/promises';

export interface DnsCheckResult {
  mxMatched: boolean;
  spfMatched: boolean;
  dkimMatched: boolean;
  dmarcMatched: boolean;
  details: {
    mxFound: string[];
    txtFound: string[];
    dkimFound: string[];
    dmarcFound: string[];
  };
}

export async function verifyDomainDns(
  domainName: string,
  expectedMailHost: string = 'mail.yourdomain.com',
  expectedDkimSelector: string = 'mail'
): Promise<DnsCheckResult> {
  const result: DnsCheckResult = {
    mxMatched: false,
    spfMatched: false,
    dkimMatched: false,
    dmarcMatched: false,
    details: {
      mxFound: [],
      txtFound: [],
      dkimFound: [],
      dmarcFound: [],
    },
  };

  // 1. Resolve MX
  try {
    const mxRecords = await dns.resolveMx(domainName);
    result.details.mxFound = mxRecords.map((r) => `${r.priority} ${r.exchange}`);
    result.mxMatched = mxRecords.some((r) =>
      r.exchange.toLowerCase().includes(expectedMailHost.toLowerCase().replace(/\.$/, ''))
    );
  } catch (err) {
    // No MX found
  }

  // 2. Resolve TXT (SPF)
  try {
    const txtRecords = await dns.resolveTxt(domainName);
    const flattenedTxt = txtRecords.map((chunks) => chunks.join(''));
    result.details.txtFound = flattenedTxt;
    result.spfMatched = flattenedTxt.some((txt) => txt.toLowerCase().startsWith('v=spf1'));
  } catch (err) {
    // No TXT found
  }

  // 3. Resolve DKIM
  try {
    const dkimHost = `${expectedDkimSelector}._domainkey.${domainName}`;
    const dkimRecords = await dns.resolveTxt(dkimHost);
    const flattenedDkim = dkimRecords.map((chunks) => chunks.join(''));
    result.details.dkimFound = flattenedDkim;
    result.dkimMatched = flattenedDkim.some((txt) => txt.toLowerCase().includes('v=dkim1'));
  } catch (err) {
    // No DKIM found
  }

  // 4. Resolve DMARC
  try {
    const dmarcHost = `_dmarc.${domainName}`;
    const dmarcRecords = await dns.resolveTxt(dmarcHost);
    const flattenedDmarc = dmarcRecords.map((chunks) => chunks.join(''));
    result.details.dmarcFound = flattenedDmarc;
    result.dmarcMatched = flattenedDmarc.some((txt) => txt.toLowerCase().includes('v=dmarc1'));
  } catch (err) {
    // No DMARC found
  }

  return result;
}
