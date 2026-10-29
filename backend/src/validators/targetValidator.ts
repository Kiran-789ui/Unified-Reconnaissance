import net from 'net';

export type TargetType = 'domain' | 'ipv4' | 'ipv6';

export interface ValidationResult {
  isValid: boolean;
  target: string;
  type?: TargetType;
  error?: string;
  isPrivate?: boolean;
}

// Private & reserved IPv4 blocks
const IPV4_RESERVED_RANGES = [
  { start: '0.0.0.0', end: '0.255.255.255', desc: 'Current network' },
  { start: '10.0.0.0', end: '10.255.255.255', desc: 'Private-Use (RFC 1918)' },
  { start: '100.64.0.0', end: '100.127.255.255', desc: 'Carrier-grade NAT' },
  { start: '127.0.0.0', end: '127.255.255.255', desc: 'Loopback' },
  { start: '169.254.0.0', end: '169.254.255.255', desc: 'Link-Local' },
  { start: '172.16.0.0', end: '172.31.255.255', desc: 'Private-Use (RFC 1918)' },
  { start: '192.0.0.0', end: '192.0.0.255', desc: 'IETF Protocol Assignments' },
  { start: '192.0.2.0', end: '192.0.2.255', desc: 'TEST-NET-1' },
  { start: '192.168.0.0', end: '192.168.255.255', desc: 'Private-Use (RFC 1918)' },
  { start: '198.18.0.0', end: '198.19.255.255', desc: 'Benchmarking' },
  { start: '198.51.100.0', end: '198.51.100.255', desc: 'TEST-NET-2' },
  { start: '203.0.113.0', end: '203.0.113.255', desc: 'TEST-NET-3' },
  { start: '224.0.0.0', end: '239.255.255.255', desc: 'Multicast' },
  { start: '240.0.0.0', end: '255.255.255.255', desc: 'Reserved' },
];

function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export function isPrivateIPv4(ip: string): boolean {
  try {
    const ipNum = ipToLong(ip);
    for (const range of IPV4_RESERVED_RANGES) {
      const startNum = ipToLong(range.start);
      const endNum = ipToLong(range.end);
      if (ipNum >= startNum && ipNum <= endNum) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

export function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  // Loopback
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
  // Unspecified
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;
  // Unique local addresses (fc00::/7)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  // Link-local addresses (fe80::/10)
  if (normalized.startsWith('fe80') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true;
  // IPv4-mapped loopback or private
  if (normalized.startsWith('::ffff:')) {
    const mappedIpv4 = normalized.replace('::ffff:', '');
    if (net.isIPv4(mappedIpv4)) {
      return isPrivateIPv4(mappedIpv4);
    }
  }
  return false;
}

const FORBIDDEN_CHARS_REGEX = /[;&|`$><!\\"'\s]/;
const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
const BLOCKED_DOMAINS = ['localhost', 'local', 'internal', 'lan', 'home', 'corp', 'test', 'invalid', 'example'];

export function validateTarget(input: string): ValidationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: false, target: '', error: 'Target input is required.' };
  }

  const raw = input.trim();

  // Reject command injection characters or whitespace
  if (FORBIDDEN_CHARS_REGEX.test(raw)) {
    return {
      isValid: false,
      target: raw,
      error: 'Target contains invalid or prohibited characters.',
    };
  }

  // Reject full URLs or schemes
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(raw)) {
    return {
      isValid: false,
      target: raw,
      error: 'Please enter only a domain name or IP address, without URL schemes (e.g. http://).',
    };
  }

  // Reject path, ports, or query parameters
  if (raw.includes('/') || raw.includes(':') && !raw.includes('::') && net.isIP(raw) !== 6) {
    // If it has a colon and isn't IPv6, it might be a port
    if (raw.includes('/') || raw.includes('?') || raw.includes('#')) {
      return {
        isValid: false,
        target: raw,
        error: 'Please enter a clean target without path, query parameters, or ports.',
      };
    }
  }

  const target = raw.toLowerCase();

  // Check IPv4
  if (net.isIPv4(target)) {
    if (isPrivateIPv4(target)) {
      return {
        isValid: false,
        target,
        type: 'ipv4',
        isPrivate: true,
        error: 'Target is a private, loopback, or reserved IP address. Only public targets are permitted.',
      };
    }
    return { isValid: true, target, type: 'ipv4', isPrivate: false };
  }

  // Check IPv6
  if (net.isIPv6(target)) {
    if (isPrivateIPv6(target)) {
      return {
        isValid: false,
        target,
        type: 'ipv6',
        isPrivate: true,
        error: 'Target is a private, loopback, or reserved IPv6 address. Only public targets are permitted.',
      };
    }
    return { isValid: true, target, type: 'ipv6', isPrivate: false };
  }

  // Check Domain
  if (target.length > 253) {
    return { isValid: false, target, error: 'Domain name exceeds maximum allowed length of 253 characters.' };
  }

  if (BLOCKED_DOMAINS.includes(target) || BLOCKED_DOMAINS.some(b => target.endsWith('.' + b))) {
    return {
      isValid: false,
      target,
      error: 'Internal, local, and reserved domain names are not supported for public reconnaissance.',
    };
  }

  if (!DOMAIN_REGEX.test(target)) {
    return {
      isValid: false,
      target,
      error: 'Invalid target format. Enter a valid fully qualified domain name (e.g. example.com) or public IP address.',
    };
  }

  return { isValid: true, target, type: 'domain', isPrivate: false };
}
