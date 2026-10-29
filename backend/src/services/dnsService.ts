import dns from 'dns/promises';
import { IDnsRecord } from '../models/ReconReport.js';

const TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '6000', 10);

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]);
}

export interface DnsServiceResult {
  status: 'success' | 'partial' | 'failed' | 'skipped';
  records: IDnsRecord[];
  error?: string;
  source: string;
}

export async function lookupDns(target: string): Promise<DnsServiceResult> {
  const records: IDnsRecord[] = [];
  const errors: string[] = [];

  // Parallel lookup of DNS record types with individual safe timeout
  const lookupA = async () => {
    try {
      const ips = await withTimeout(dns.resolve4(target, { ttl: true }), TIMEOUT_MS, []);
      for (const item of ips) {
        records.push({
          type: 'A',
          value: item.address,
          ttl: item.ttl,
        });
      }
    } catch (err: any) {
      if (err.code !== 'ENODATA' && err.code !== 'ENOTFOUND') {
        errors.push(`A: ${err.message}`);
      }
    }
  };

  const lookupAAAA = async () => {
    try {
      const ips = await withTimeout(dns.resolve6(target, { ttl: true }), TIMEOUT_MS, []);
      for (const item of ips) {
        records.push({
          type: 'AAAA',
          value: item.address,
          ttl: item.ttl,
        });
      }
    } catch (err: any) {
      if (err.code !== 'ENODATA' && err.code !== 'ENOTFOUND') {
        errors.push(`AAAA: ${err.message}`);
      }
    }
  };

  const lookupMX = async () => {
    try {
      const mxRecords = await withTimeout(dns.resolveMx(target), TIMEOUT_MS, []);
      for (const item of mxRecords) {
        records.push({
          type: 'MX',
          value: `${item.exchange} (priority: ${item.priority})`,
          priority: item.priority,
        });
      }
    } catch (err: any) {
      if (err.code !== 'ENODATA' && err.code !== 'ENOTFOUND') {
        errors.push(`MX: ${err.message}`);
      }
    }
  };

  const lookupNS = async () => {
    try {
      const nsRecords = await withTimeout(dns.resolveNs(target), TIMEOUT_MS, []);
      for (const ns of nsRecords) {
        records.push({
          type: 'NS',
          value: ns,
        });
      }
    } catch (err: any) {
      if (err.code !== 'ENODATA' && err.code !== 'ENOTFOUND') {
        errors.push(`NS: ${err.message}`);
      }
    }
  };

  const lookupTXT = async () => {
    try {
      const txtRecords = await withTimeout(dns.resolveTxt(target), TIMEOUT_MS, []);
      for (const chunks of txtRecords) {
        records.push({
          type: 'TXT',
          value: chunks.join(''),
        });
      }
    } catch (err: any) {
      if (err.code !== 'ENODATA' && err.code !== 'ENOTFOUND') {
        errors.push(`TXT: ${err.message}`);
      }
    }
  };

  const lookupCNAME = async () => {
    try {
      const cnames = await withTimeout(dns.resolveCname(target), TIMEOUT_MS, []);
      for (const cname of cnames) {
        records.push({
          type: 'CNAME',
          value: cname,
        });
      }
    } catch (err: any) {
      if (err.code !== 'ENODATA' && err.code !== 'ENOTFOUND') {
        errors.push(`CNAME: ${err.message}`);
      }
    }
  };

  const lookupSOA = async () => {
    try {
      const soa = await withTimeout(dns.resolveSoa(target), TIMEOUT_MS, null);
      if (soa) {
        records.push({
          type: 'SOA',
          value: `nsname: ${soa.nsname}, hostmaster: ${soa.hostmaster}, serial: ${soa.serial}, refresh: ${soa.refresh}, retry: ${soa.retry}, expire: ${soa.expire}, minttl: ${soa.minttl}`,
          raw: soa,
        });
      }
    } catch (err: any) {
      if (err.code !== 'ENODATA' && err.code !== 'ENOTFOUND') {
        errors.push(`SOA: ${err.message}`);
      }
    }
  };

  await Promise.allSettled([
    lookupA(),
    lookupAAAA(),
    lookupMX(),
    lookupNS(),
    lookupTXT(),
    lookupCNAME(),
    lookupSOA(),
  ]);

  let status: 'success' | 'partial' | 'failed' = 'success';
  if (records.length === 0 && errors.length > 0) {
    status = 'failed';
  } else if (records.length > 0 && errors.length > 0) {
    status = 'partial';
  }

  return {
    status,
    records,
    error: errors.length > 0 ? errors.join('; ') : undefined,
    source: 'Passive System DNS & Resolver',
  };
}
