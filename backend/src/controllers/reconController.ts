import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { validateTarget } from '../validators/targetValidator.js';
import { lookupDns } from '../services/dnsService.js';
import { lookupWhois } from '../services/whoisService.js';
import { lookupIp } from '../services/ipService.js';
import { ReconReport, IReconReport } from '../models/ReconReport.js';

export const executeFullRecon = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  const targetInput = req.body?.target;

  const validation = validateTarget(targetInput);
  if (!validation.isValid) {
    res.status(400).json({
      success: false,
      message: validation.error || 'Invalid reconnaissance target provided.',
    });
    return;
  }

  const { target, type } = validation;
  const dataSources: any[] = [];
  const notes: string[] = [];

  let dnsResult: any = { status: 'skipped', records: [] };
  let whoisResult: any = { status: 'skipped' };
  let ipResult: any = { status: 'skipped' };

  try {
    if (type === 'domain') {
      // 1. Parallel execution of DNS and WHOIS lookups
      const [dnsRes, whoisRes] = await Promise.allSettled([
        lookupDns(target),
        lookupWhois(target),
      ]);

      if (dnsRes.status === 'fulfilled') {
        dnsResult = dnsRes.value;
        dataSources.push({
          name: 'System DNS Resolver',
          description: 'Queried authoritative and recursive name servers for DNS zone records',
          status: dnsResult.status,
          queriedAt: new Date(),
        });
      } else {
        dnsResult = { status: 'failed', records: [], error: dnsRes.reason?.message };
      }

      if (whoisRes.status === 'fulfilled') {
        whoisResult = whoisRes.value;
        dataSources.push({
          name: whoisResult.source || 'ICANN RDAP / WHOIS',
          description: 'Queried domain registry database for registration records',
          status: whoisResult.status,
          queriedAt: new Date(),
        });
      } else {
        whoisResult = { status: 'failed', error: whoisRes.reason?.message };
      }

      // 2. If domain has resolved A record, gather IP metadata on primary host
      const primaryARecord = dnsResult.records?.find((r: any) => r.type === 'A');
      if (primaryARecord && primaryARecord.value) {
        try {
          const ipData = await lookupIp(primaryARecord.value);
          ipResult = ipData;
          dataSources.push({
            name: ipResult.source || 'IP Metadata Provider',
            description: `Network and ASN routing details for resolved A record (${primaryARecord.value})`,
            status: ipResult.status,
            queriedAt: new Date(),
          });
        } catch (err: any) {
          ipResult = { status: 'failed', error: err.message };
        }
      } else {
        notes.push('No IPv4 A-record resolved for domain; direct host IP metadata was skipped.');
      }
    } else {
      // Target is an IP address
      const [ipRes, whoisRes] = await Promise.allSettled([
        lookupIp(target),
        lookupWhois(target),
      ]);

      if (ipRes.status === 'fulfilled') {
        ipResult = ipRes.value;
        dataSources.push({
          name: ipResult.source || 'IP Metadata / Reverse DNS',
          description: 'Queried PTR reverse lookup and autonomous system routing information',
          status: ipResult.status,
          queriedAt: new Date(),
        });
      } else {
        ipResult = { status: 'failed', error: ipRes.reason?.message };
      }

      if (whoisRes.status === 'fulfilled') {
        whoisResult = whoisRes.value;
        dataSources.push({
          name: whoisResult.source || 'IP WHOIS / RDAP',
          description: 'Queried regional internet registry (RIR) for IP allocation block',
          status: whoisResult.status,
          queriedAt: new Date(),
        });
      }

      // Reverse DNS records can be represented as DNS PTR
      if (ipResult.data?.reverseDns && ipResult.data.reverseDns.length > 0) {
        dnsResult = {
          status: 'success',
          records: ipResult.data.reverseDns.map((ptr: string) => ({
            type: 'PTR',
            value: ptr,
          })),
          source: 'Reverse DNS PTR',
        };
      }
    }

    const durationMs = Date.now() - startTime;

    // Calculate overall status
    let overallStatus: 'success' | 'partial' | 'failed' = 'success';
    const hasDns = dnsResult.records && dnsResult.records.length > 0;
    const hasWhois = whoisResult.status === 'success' || whoisResult.status === 'partial';
    const hasIp = ipResult.status === 'success' || ipResult.status === 'partial';

    if (!hasDns && !hasWhois && !hasIp) {
      overallStatus = 'failed';
    } else if (!hasDns || !hasWhois || !hasIp) {
      overallStatus = 'partial';
    }

    // Save report to MongoDB for authenticated user
    let savedReport: IReconReport | null = null;
    if (req.userId) {
      savedReport = await ReconReport.create({
        userId: req.userId,
        target,
        targetType: type,
        lookupTimestamp: new Date(),
        overallStatus,
        summaryStats: {
          dnsRecordsCount: dnsResult.records?.length || 0,
          whoisAvailable: hasWhois,
          ipInfoAvailable: hasIp,
          durationMs,
        },
        dns: dnsResult,
        whois: whoisResult,
        ipInfo: ipResult,
        dataSources,
        notes,
      });
    }

    res.status(200).json({
      success: true,
      report: savedReport || {
        target,
        targetType: type,
        lookupTimestamp: new Date(),
        overallStatus,
        summaryStats: {
          dnsRecordsCount: dnsResult.records?.length || 0,
          whoisAvailable: hasWhois,
          ipInfoAvailable: hasIp,
          durationMs,
        },
        dns: dnsResult,
        whois: whoisResult,
        ipInfo: ipResult,
        dataSources,
        notes,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to complete reconnaissance scan: ' + err.message,
    });
  }
};

export const lookupDomainInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const targetInput = req.body?.target;
  const validation = validateTarget(targetInput);
  if (!validation.isValid) {
    res.status(400).json({ success: false, message: validation.error });
    return;
  }

  try {
    const whois = await lookupWhois(validation.target);
    res.status(200).json({
      success: true,
      target: validation.target,
      whois,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const lookupDnsEndpoint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const targetInput = req.body?.target;
  const validation = validateTarget(targetInput);
  if (!validation.isValid) {
    res.status(400).json({ success: false, message: validation.error });
    return;
  }

  try {
    const dns = await lookupDns(validation.target);
    res.status(200).json({
      success: true,
      target: validation.target,
      dns,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const lookupWhoisEndpoint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const targetInput = req.body?.target;
  const validation = validateTarget(targetInput);
  if (!validation.isValid) {
    res.status(400).json({ success: false, message: validation.error });
    return;
  }

  try {
    const whois = await lookupWhois(validation.target);
    res.status(200).json({
      success: true,
      target: validation.target,
      whois,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const lookupIpEndpoint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const targetInput = req.body?.target;
  const validation = validateTarget(targetInput);
  if (!validation.isValid) {
    res.status(400).json({ success: false, message: validation.error });
    return;
  }

  try {
    const ip = await lookupIp(validation.target);
    res.status(200).json({
      success: true,
      target: validation.target,
      ip,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
