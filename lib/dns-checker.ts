import { Resolver } from 'dns/promises';

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
  expectedMailHost: string = 'mail.kidukart.com',
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

  const resolver = new Resolver();
  // Query Cloudflare and Google directly to avoid stale local OS resolver cache
  resolver.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);

  // 1. Resolve MX
  try {
    const mxRecords = await resolver.resolveMx(domainName);
    result.details.mxFound = mxRecords.map((r) => `${r.priority} ${r.exchange}`);
    result.mxMatched = mxRecords.some((r) => {
      const exchange = r.exchange.toLowerCase();
      return (
        exchange.includes('mail.kidukart.com') ||
        exchange.includes('kidukart.com') ||
        exchange.includes(expectedMailHost.toLowerCase().replace(/\.$/, '')) ||
        exchange.includes(domainName.toLowerCase())
      );
    });
  } catch (err) {
    // No MX found
  }

  // 2. Resolve TXT (SPF)
  try {
    const txtRecords = await resolver.resolveTxt(domainName);
    const flattenedTxt = txtRecords.map((chunks) => chunks.join(''));
    result.details.txtFound = flattenedTxt;
    result.spfMatched = flattenedTxt.some((txt) => {
      const lower = txt.toLowerCase();
      return lower.startsWith('v=spf1') || lower.includes('ip4:62.72.12.195') || lower.includes('kidukart.com');
    });
  } catch (err) {
    // No TXT found
  }

  // 3. Resolve DKIM
  try {
    const dkimHost = `${expectedDkimSelector}._domainkey.${domainName}`;
    const dkimRecords = await resolver.resolveTxt(dkimHost);
    const flattenedDkim = dkimRecords.map((chunks) => chunks.join(''));
    result.details.dkimFound = flattenedDkim;
    result.dkimMatched = flattenedDkim.some((txt) => txt.toLowerCase().includes('v=dkim1'));
  } catch (err) {
    // No DKIM found
  }

  // 4. Resolve DMARC
  try {
    const dmarcHost = `_dmarc.${domainName}`;
    const dmarcRecords = await resolver.resolveTxt(dmarcHost);
    const flattenedDmarc = dmarcRecords.map((chunks) => chunks.join(''));
    result.details.dmarcFound = flattenedDmarc;
    result.dmarcMatched = flattenedDmarc.some((txt) => txt.toLowerCase().includes('v=dmarc1'));
  } catch (err) {
    // No DMARC found
  }

  return result;
}
