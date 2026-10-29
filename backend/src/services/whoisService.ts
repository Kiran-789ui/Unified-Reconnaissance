import net from 'net';
import { IWhoisData } from '../models/ReconReport.js';

const TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '6000', 10);

export interface WhoisServiceResult {
  status: 'success' | 'partial' | 'failed' | 'unavailable' | 'skipped';
  data?: IWhoisData;
  error?: string;
  source: string;
}

// RDAP Bootstrap endpoints by TLD
async function queryRdap(domain: string): Promise<IWhoisData | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Official ICANN / IANA RDAP bootstrap base
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/rdap+json, application/json' },
    });

    clearTimeout(id);

    if (!res.ok) {
      return null;
    }

    const json = (await res.json()) as any;
    const whoisData: IWhoisData = {};

    // Name servers
    if (Array.isArray(json.nameservers)) {
      whoisData.nameServers = json.nameservers.map((ns: any) =>
        typeof ns === 'string' ? ns.toLowerCase() : ns.ldhName?.toLowerCase()
      ).filter(Boolean);
    }

    // Status
    if (Array.isArray(json.status)) {
      whoisData.status = json.status;
    }

    // Events (dates)
    if (Array.isArray(json.events)) {
      for (const ev of json.events) {
        if (ev.eventAction === 'registration') whoisData.creationDate = ev.eventDate;
        if (ev.eventAction === 'expiration') whoisData.expirationDate = ev.eventDate;
        if (ev.eventAction === 'last changed' || ev.eventAction === 'last update') {
          whoisData.updatedDate = ev.eventDate;
        }
      }
    }

    // Entities (Registrar, Registrant)
    if (Array.isArray(json.entities)) {
      for (const ent of json.entities) {
        const roles = ent.roles || [];
        if (roles.includes('registrar')) {
          const vcard = ent.vcardArray;
          if (Array.isArray(vcard) && Array.isArray(vcard[1])) {
            const fnItem = vcard[1].find((prop: any) => prop[0] === 'fn');
            if (fnItem && fnItem[3]) whoisData.registrar = fnItem[3];
          }
          if (!whoisData.registrar && ent.handle) {
            whoisData.registrar = ent.handle;
          }
        }

        if (roles.includes('registrant')) {
          const vcard = ent.vcardArray;
          if (Array.isArray(vcard) && Array.isArray(vcard[1])) {
            const fnItem = vcard[1].find((prop: any) => prop[0] === 'fn');
            const orgItem = vcard[1].find((prop: any) => prop[0] === 'org');
            const countryItem = vcard[1].find((prop: any) => prop[0] === 'adr');

            if (orgItem && orgItem[3]) whoisData.registrantOrganization = orgItem[3];
            else if (fnItem && fnItem[3]) whoisData.registrantOrganization = fnItem[3];

            if (countryItem && countryItem[3] && countryItem[3][6]) {
              whoisData.registrantCountry = countryItem[3][6];
            }
          }
        }
      }
    }

    // Check privacy protection
    const rawCheck = JSON.stringify(json).toLowerCase();
    whoisData.isPrivacyProtected =
      rawCheck.includes('privacy') ||
      rawCheck.includes('redacted') ||
      rawCheck.includes('proxy') ||
      rawCheck.includes('whoisguard') ||
      rawCheck.includes('withheld for privacy') ||
      rawCheck.includes('data protected');

    return whoisData;
  } catch {
    clearTimeout(id);
    return null;
  }
}

// Fallback to TCP WHOIS (port 43)
function querySocketWhois(domain: string, host = 'whois.iana.org'): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = '';
    const socket = new net.Socket();
    let isFinished = false;

    socket.setTimeout(TIMEOUT_MS);

    socket.connect(43, host, () => {
      socket.write(`${domain}\r\n`);
    });

    socket.on('data', (data) => {
      raw += data.toString('utf8');
      if (raw.length > 500000) {
        socket.destroy();
      }
    });

    socket.on('timeout', () => {
      if (!isFinished) {
        isFinished = true;
        socket.destroy();
        reject(new Error('WHOIS query connection timed out'));
      }
    });

    socket.on('error', (err) => {
      if (!isFinished) {
        isFinished = true;
        socket.destroy();
        reject(err);
      }
    });

    socket.on('close', () => {
      if (!isFinished) {
        isFinished = true;
        resolve(raw);
      }
    });
  });
}

function parseWhoisText(text: string): IWhoisData {
  const result: IWhoisData = {
    nameServers: [],
    status: [],
    rawText: text.slice(0, 5000), // bounded summary
  };

  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%') || trimmed.startsWith('#')) continue;

    const lower = trimmed.toLowerCase();

    // Registrar
    if (!result.registrar && (lower.startsWith('registrar:') || lower.startsWith('sponsoring registrar:'))) {
      result.registrar = trimmed.split(':')[1]?.trim();
    }
    // Creation Date
    if (!result.creationDate && (lower.startsWith('creation date:') || lower.startsWith('created:') || lower.startsWith('registered:'))) {
      result.creationDate = trimmed.split(':').slice(1).join(':').trim();
    }
    // Expiration Date
    if (!result.expirationDate && (lower.startsWith('registry expiry date:') || lower.startsWith('expiration date:') || lower.startsWith('expires:'))) {
      result.expirationDate = trimmed.split(':').slice(1).join(':').trim();
    }
    // Updated Date
    if (!result.updatedDate && (lower.startsWith('updated date:') || lower.startsWith('last updated:'))) {
      result.updatedDate = trimmed.split(':').slice(1).join(':').trim();
    }
    // Name Server
    if (lower.startsWith('name server:') || lower.startsWith('nserver:')) {
      const ns = trimmed.split(':')[1]?.trim().toLowerCase();
      if (ns && !result.nameServers!.includes(ns)) {
        result.nameServers!.push(ns);
      }
    }
    // Status
    if (lower.startsWith('domain status:') || lower.startsWith('status:')) {
      const st = trimmed.split(':')[1]?.trim();
      if (st && !result.status!.includes(st)) {
        result.status!.push(st);
      }
    }
    // Registrant Org
    if (!result.registrantOrganization && (lower.startsWith('registrant organization:') || lower.startsWith('registrant:'))) {
      result.registrantOrganization = trimmed.split(':')[1]?.trim();
    }
  }

  const rawLower = text.toLowerCase();
  result.isPrivacyProtected =
    rawLower.includes('privacy') ||
    rawLower.includes('redacted') ||
    rawLower.includes('proxy') ||
    rawLower.includes('whoisguard') ||
    rawLower.includes('withheld for privacy') ||
    rawLower.includes('data protected');

  return result;
}

export async function lookupWhois(target: string): Promise<WhoisServiceResult> {
  // 1. Try modern official RDAP (fast, reliable, JSON-structured, no blocked port 43)
  try {
    const rdapData = await queryRdap(target);
    if (rdapData && (rdapData.registrar || rdapData.creationDate || rdapData.nameServers?.length)) {
      return {
        status: 'success',
        data: rdapData,
        source: 'ICANN RDAP (Registration Data Access Protocol)',
      };
    }
  } catch {
    // Continue to socket fallback
  }

  // 2. Fallback to Port 43 Socket WHOIS
  try {
    const rawWhois = await querySocketWhois(target);
    if (rawWhois && rawWhois.length > 50) {
      const parsed = parseWhoisText(rawWhois);
      return {
        status: parsed.registrar || parsed.creationDate ? 'success' : 'partial',
        data: parsed,
        source: 'WHOIS Protocol (Port 43 TCP)',
      };
    }
  } catch (err: any) {
    // If port 43 failed or timed out
    return {
      status: 'unavailable',
      data: {
        rawText: 'WHOIS/RDAP query timed out or lookup was restricted by registry privacy controls.',
      },
      error: `WHOIS lookup unavailable for target: ${err.message}`,
      source: 'WHOIS Gateway',
    };
  }

  return {
    status: 'unavailable',
    data: {
      rawText: 'No WHOIS/RDAP record publicly returned for this target or domain suffix.',
    },
    source: 'WHOIS Gateway',
  };
}
