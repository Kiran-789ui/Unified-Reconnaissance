import net from 'net';
import dns from 'dns/promises';
import { IIpMetadata } from '../models/ReconReport.js';
import { isPrivateIPv4, isPrivateIPv6 } from '../validators/targetValidator.js';

const TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '6000', 10);

export interface IpServiceResult {
  status: 'success' | 'partial' | 'failed' | 'skipped';
  data?: IIpMetadata;
  error?: string;
  source: string;
}

export async function lookupIp(ipInput: string): Promise<IpServiceResult> {
  const version = net.isIP(ipInput);
  if (!version) {
    return {
      status: 'failed',
      error: 'Invalid IP address provided',
      source: 'System IP Validator',
    };
  }

  const isPrivate = version === 4 ? isPrivateIPv4(ipInput) : isPrivateIPv6(ipInput);

  const metadata: IIpMetadata = {
    ip: ipInput,
    ipVersion: version as 4 | 6,
    isPrivate,
    reverseDns: [],
  };

  // 1. Perform Reverse DNS (PTR) lookup
  try {
    const ptrPromise = dns.reverse(ipInput);
    let timer: any;
    const timeoutPromise = new Promise<string[]>((resolve) => {
      timer = setTimeout(() => resolve([]), 3500);
    });
    const hostnames = await Promise.race([
      ptrPromise.then((res) => {
        clearTimeout(timer);
        return res;
      }),
      timeoutPromise,
    ]);
    metadata.reverseDns = hostnames;
  } catch {
    // Reverse DNS may not exist for all IPs
    metadata.reverseDns = [];
  }

  // If private, skip external geo/ASN queries to prevent SSRF and useless queries
  if (isPrivate) {
    metadata.organization = 'Private / Reserved Network Address';
    metadata.asn = 'N/A (RFC 1918 / Loopback)';
    return {
      status: 'success',
      data: metadata,
      source: 'Internal Network Classifier',
    };
  }

  // 2. Fetch public ASN and geographic metadata (Country/Region/ISP)
  const token = process.env.IPINFO_TOKEN;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    if (token) {
      // Use configured token with ipinfo.io
      const res = await fetch(`https://ipinfo.io/${encodeURIComponent(ipInput)}/json?token=${encodeURIComponent(token)}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(id);
      if (res.ok) {
        const json = (await res.json()) as any;
        metadata.city = json.city;
        metadata.region = json.region;
        metadata.country = json.country;
        metadata.countryCode = json.country;
        metadata.timezone = json.timezone;
        metadata.organization = json.org;
        metadata.isp = json.org;
        if (json.org && json.org.startsWith('AS')) {
          const parts = json.org.split(' ');
          metadata.asn = parts[0];
          metadata.asName = parts.slice(1).join(' ');
        }
        return {
          status: 'success',
          data: metadata,
          source: 'IPInfo.io API',
        };
      }
    } else {
      // Free public fallback: ip-api.com (passive JSON, no token required)
      const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ipInput)}?fields=status,message,country,countryCode,regionName,city,timezone,isp,org,as`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(id);
      if (res.ok) {
        const json = (await res.json()) as any;
        if (json.status === 'success') {
          metadata.city = json.city;
          metadata.region = json.regionName;
          metadata.country = json.country;
          metadata.countryCode = json.countryCode;
          metadata.timezone = json.timezone;
          metadata.isp = json.isp;
          metadata.organization = json.org || json.isp;
          if (json.as) {
            const parts = json.as.split(' ');
            metadata.asn = parts[0];
            metadata.asName = parts.slice(1).join(' ');
          }
          return {
            status: 'success',
            data: metadata,
            source: 'Public IP Metadata Provider (ip-api.com)',
          };
        }
      }
    }
  } catch (err: any) {
    clearTimeout(id);
    return {
      status: metadata.reverseDns?.length ? 'partial' : 'failed',
      data: metadata,
      error: `External IP metadata provider unavailable: ${err.message}`,
      source: 'Reverse DNS Resolver',
    };
  }

  return {
    status: 'partial',
    data: metadata,
    source: 'Reverse DNS Resolver',
  };
}
