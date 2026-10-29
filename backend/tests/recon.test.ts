import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { generateToken } from '../src/utils/token.js';
import { User } from '../src/models/User.js';
import { ReconReport } from '../src/models/ReconReport.js';
import * as dnsService from '../src/services/dnsService.js';
import * as whoisService from '../src/services/whoisService.js';
import * as ipService from '../src/services/ipService.js';

describe('Reconnaissance Services & Endpoints', () => {
  const mockUserId = '64a1b2c3d4e5f6a7b8c9d0e1';
  const authToken = generateToken({
    userId: mockUserId,
    email: 'tester@recon.test',
  });

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.spyOn(User, 'findById').mockResolvedValue({
      _id: mockUserId,
      name: 'Tester',
      email: 'tester@recon.test',
    } as any);
  });

  it('POST /api/recon/full - should reject SSRF private targets with 400', async () => {
    const res = await request(app)
      .post('/api/recon/full')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ target: '127.0.0.1' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/private, loopback/i);
  });

  it('POST /api/recon/full - should reject targets with URL schemes with 400', async () => {
    const res = await request(app)
      .post('/api/recon/full')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ target: 'http://example.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/without URL schemes/i);
  });

  it('POST /api/recon/full - should reject targets outside the configured public demo allowlist', async () => {
    vi.stubEnv('RECON_TARGET_ALLOWLIST', 'example.com');

    const res = await request(app)
      .post('/api/recon/full')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ target: 'github.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/only permits these targets: example\.com/i);
  });

  it('POST /api/recon/full - should execute passive recon with mocked services', async () => {
    vi.spyOn(dnsService, 'lookupDns').mockResolvedValue({
      status: 'success',
      records: [
        { type: 'A', value: '93.184.216.34', ttl: 300 },
        { type: 'NS', value: 'a.iana-servers.net' },
      ],
      source: 'Mocked DNS',
    });

    vi.spyOn(whoisService, 'lookupWhois').mockResolvedValue({
      status: 'success',
      data: {
        registrar: 'RESERVED-Internet Assigned Numbers Authority',
        creationDate: '1995-08-14',
        expirationDate: '2027-08-13',
        nameServers: ['a.iana-servers.net', 'b.iana-servers.net'],
        isPrivacyProtected: true,
      },
      source: 'Mocked RDAP',
    });

    vi.spyOn(ipService, 'lookupIp').mockResolvedValue({
      status: 'success',
      data: {
        ip: '93.184.216.34',
        ipVersion: 4,
        isPrivate: false,
        asn: 'AS15133',
        asName: 'EDGECAST',
        country: 'United States',
        city: 'Los Angeles',
      },
      source: 'Mocked IP Service',
    });

    vi.spyOn(ReconReport, 'create').mockImplementation((data: any) => {
      return Promise.resolve({
        ...data,
        _id: '64a1b2c3d4e5f6a7b8c9d0e9',
      }) as any;
    });

    const res = await request(app)
      .post('/api/recon/full')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ target: 'example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.report).toBeDefined();
    expect(res.body.report.target).toBe('example.com');
    expect(res.body.report.dns.records.length).toBe(2);
    expect(res.body.report.whois.data.registrar).toBe('RESERVED-Internet Assigned Numbers Authority');
    expect(res.body.report.ipInfo.data.ip).toBe('93.184.216.34');
  });
});
