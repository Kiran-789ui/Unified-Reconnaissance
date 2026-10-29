import { describe, it, expect } from 'vitest';

describe('Frontend Input Validation Rules', () => {
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
  const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;

  it('validates common domain names', () => {
    expect(domainRegex.test('google.com')).toBe(true);
    expect(domainRegex.test('sub.example.co.uk')).toBe(true);
    expect(domainRegex.test('test')).toBe(false);
  });

  it('validates valid IPv4 addresses', () => {
    expect(ipv4Regex.test('8.8.8.8')).toBe(true);
    expect(ipv4Regex.test('1.1.1.1')).toBe(true);
    expect(ipv4Regex.test('999.999.999.999')).toBe(false);
  });

  it('detects and prohibits private / SSRF targets', () => {
    const isPrivateOrLoopback = (target: string) => {
      const lower = target.toLowerCase();
      return (
        lower === 'localhost' ||
        lower.endsWith('.localhost') ||
        lower.startsWith('127.') ||
        lower.startsWith('10.') ||
        lower.startsWith('192.168.') ||
        lower.startsWith('169.254.') ||
        lower === '::1'
      );
    };

    expect(isPrivateOrLoopback('127.0.0.1')).toBe(true);
    expect(isPrivateOrLoopback('192.168.0.1')).toBe(true);
    expect(isPrivateOrLoopback('localhost')).toBe(true);
    expect(isPrivateOrLoopback('169.254.169.254')).toBe(true);
    expect(isPrivateOrLoopback('cloudflare.com')).toBe(false);
    expect(isPrivateOrLoopback('8.8.8.8')).toBe(false);
  });
});
