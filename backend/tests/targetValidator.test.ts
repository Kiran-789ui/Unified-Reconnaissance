import { describe, it, expect } from 'vitest';
import {
  validateTarget,
  isPrivateIPv4,
  isPrivateIPv6,
} from '../src/validators/targetValidator.js';

describe('Target Validator & SSRF Protection', () => {
  it('should accept valid public domain names', () => {
    const res1 = validateTarget('example.com');
    expect(res1.isValid).toBe(true);
    expect(res1.type).toBe('domain');
    expect(res1.target).toBe('example.com');

    const res2 = validateTarget('cloudflare.com');
    expect(res2.isValid).toBe(true);
    expect(res2.type).toBe('domain');

    const res3 = validateTarget('sub.domain.co.uk');
    expect(res3.isValid).toBe(true);
    expect(res3.type).toBe('domain');
  });

  it('should accept valid public IPv4 addresses', () => {
    const res = validateTarget('8.8.8.8');
    expect(res.isValid).toBe(true);
    expect(res.type).toBe('ipv4');
    expect(res.isPrivate).toBe(false);
  });

  it('should reject private and loopback IPv4 addresses (SSRF defense)', () => {
    // 127.0.0.1
    const resLoop = validateTarget('127.0.0.1');
    expect(resLoop.isValid).toBe(false);
    expect(resLoop.isPrivate).toBe(true);
    expect(resLoop.error).toMatch(/private, loopback, or reserved/i);

    // 192.168.1.1
    const res192 = validateTarget('192.168.1.1');
    expect(res192.isValid).toBe(false);
    expect(res192.isPrivate).toBe(true);

    // 10.0.0.1
    const res10 = validateTarget('10.0.0.1');
    expect(res10.isValid).toBe(false);
    expect(res10.isPrivate).toBe(true);

    // 169.254.169.254 (Cloud metadata)
    const resMeta = validateTarget('169.254.169.254');
    expect(resMeta.isValid).toBe(false);
    expect(resMeta.isPrivate).toBe(true);
  });

  it('should reject private and loopback IPv6 addresses', () => {
    const resV6Loop = validateTarget('::1');
    expect(resV6Loop.isValid).toBe(false);
    expect(resV6Loop.isPrivate).toBe(true);

    expect(isPrivateIPv6('::1')).toBe(true);
    expect(isPrivateIPv6('fe80::1')).toBe(true);
  });

  it('should reject command injection and shell meta-characters', () => {
    expect(validateTarget('example.com; rm -rf /').isValid).toBe(false);
    expect(validateTarget('example.com | whoami').isValid).toBe(false);
    expect(validateTarget('`ping 127.0.0.1`').isValid).toBe(false);
    expect(validateTarget('example.com$(cat /etc/passwd)').isValid).toBe(false);
  });

  it('should reject URLs with schemes or query parameters', () => {
    const resHttp = validateTarget('https://example.com');
    expect(resHttp.isValid).toBe(false);
    expect(resHttp.error).toMatch(/without URL schemes/i);

    const resPath = validateTarget('example.com/admin');
    expect(resPath.isValid).toBe(false);
  });

  it('should reject reserved and internal domain names', () => {
    expect(validateTarget('localhost').isValid).toBe(false);
    expect(validateTarget('server.internal').isValid).toBe(false);
    expect(validateTarget('service.local').isValid).toBe(false);
  });
});
