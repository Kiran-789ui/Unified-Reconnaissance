import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { generateToken } from '../src/utils/token.js';
import { User } from '../src/models/User.js';
import { ReconReport } from '../src/models/ReconReport.js';

describe('Report Management, Ownership Isolation & Exports', () => {
  const userAId = '64a1b2c3d4e5f6a7b8c9d0e1';
  const userBId = '64a1b2c3d4e5f6a7b8c9d0e2';
  const reportAId = '64a1b2c3d4e5f6a7b8c9d0e9';

  const tokenUserA = generateToken({ userId: userAId, email: 'alpha@recon.test' });
  const tokenUserB = generateToken({ userId: userBId, email: 'beta@recon.test' });

  const mockReportDoc = {
    _id: reportAId,
    userId: { toString: () => userAId },
    target: 'github.com',
    targetType: 'domain',
    lookupTimestamp: new Date(),
    overallStatus: 'success',
    summaryStats: {
      dnsRecordsCount: 2,
      durationMs: 320,
    },
    dns: {
      records: [
        { type: 'A', value: '140.82.121.3', ttl: 60 },
      ],
    },
    whois: {
      data: {
        registrar: 'MarkMonitor Inc.',
      },
    },
    ipInfo: {
      data: {
        ip: '140.82.121.3',
        asn: 'AS36459',
      },
    },
    dataSources: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(User, 'findById').mockImplementation(((id: any) => {
      if (id === userAId) {
        return Promise.resolve({ _id: userAId, email: 'alpha@recon.test' });
      }
      return Promise.resolve({ _id: userBId, email: 'beta@recon.test' });
    }) as any);
  });

  it('GET /api/reports - should list reports for User A', async () => {
    vi.spyOn(ReconReport, 'countDocuments').mockResolvedValue(1 as any);
    const mockFind = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue([mockReportDoc]),
    };
    vi.spyOn(ReconReport, 'find').mockReturnValue(mockFind as any);

    const res = await request(app)
      .get('/api/reports')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reports.length).toBe(1);
    expect(res.body.reports[0].target).toBe('github.com');
  });

  it('GET /api/reports/:id - should allow User A to retrieve their own report', async () => {
    vi.spyOn(ReconReport, 'findById').mockResolvedValue(mockReportDoc as any);

    const res = await request(app)
      .get(`/api/reports/${reportAId}`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.report.target).toBe('github.com');
  });

  it('GET /api/reports/:id - should deny User B access to User A report (403 Forbidden)', async () => {
    vi.spyOn(ReconReport, 'findById').mockResolvedValue(mockReportDoc as any);

    const res = await request(app)
      .get(`/api/reports/${reportAId}`)
      .set('Authorization', `Bearer ${tokenUserB}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/access denied/i);
  });

  it('GET /api/reports/:id/export?format=json - should export report in JSON', async () => {
    vi.spyOn(ReconReport, 'findById').mockResolvedValue(mockReportDoc as any);

    const res = await request(app)
      .get(`/api/reports/${reportAId}/export?format=json`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body.target).toBe('github.com');
  });

  it('GET /api/reports/:id/export?format=csv - should export report in CSV', async () => {
    vi.spyOn(ReconReport, 'findById').mockResolvedValue(mockReportDoc as any);

    const res = await request(app)
      .get(`/api/reports/${reportAId}/export?format=csv`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('github.com');
  });

  it('GET /api/reports/:id/export?format=pdf - should export report in PDF', async () => {
    vi.spyOn(ReconReport, 'findById').mockResolvedValue(mockReportDoc as any);

    const res = await request(app)
      .get(`/api/reports/${reportAId}/export?format=pdf`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.body).toBeDefined();
  });

  it('DELETE /api/reports/:id - should delete report for User A', async () => {
    vi.spyOn(ReconReport, 'findById').mockResolvedValue(mockReportDoc as any);
    vi.spyOn(ReconReport, 'findByIdAndDelete').mockResolvedValue(mockReportDoc as any);

    const res = await request(app)
      .delete(`/api/reports/${reportAId}`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
