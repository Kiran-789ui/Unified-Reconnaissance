import PDFDocument from 'pdfkit';
import { IReconReport } from '../models/ReconReport.js';

export function exportReportAsJson(report: IReconReport): string {
  const cleanReport = {
    reportId: report._id,
    target: report.target,
    targetType: report.targetType,
    lookupTimestamp: report.lookupTimestamp,
    overallStatus: report.overallStatus,
    summaryStats: report.summaryStats,
    dns: report.dns,
    whois: report.whois,
    ipInfo: report.ipInfo,
    dataSources: report.dataSources,
    notes: report.notes,
    generatedAt: new Date().toISOString(),
  };

  return JSON.stringify(cleanReport, null, 2);
}

// Escape formula injection in CSV cells
function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) return '""';
  let str = String(value).trim();
  // CSV Injection prevention (starts with =, +, -, @, \t, \r)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Escape quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

export function exportReportAsCsv(report: IReconReport): string {
  const rows: string[][] = [
    ['Unified Reconnaissance Platform - Recon Report'],
    ['Target', report.target],
    ['Target Type', report.targetType],
    ['Lookup Timestamp', new Date(report.lookupTimestamp).toISOString()],
    ['Overall Status', report.overallStatus],
    ['DNS Records Found', String(report.summaryStats?.dnsRecordsCount || 0)],
    ['Lookup Duration (ms)', String(report.summaryStats?.durationMs || 0)],
    [],
    ['=== DNS RECORDS ==='],
    ['Type', 'Value', 'TTL', 'Priority'],
  ];

  if (report.dns?.records && report.dns.records.length > 0) {
    for (const r of report.dns.records) {
      rows.push([
        r.type,
        r.value,
        r.ttl !== undefined ? String(r.ttl) : 'N/A',
        r.priority !== undefined ? String(r.priority) : 'N/A',
      ]);
    }
  } else {
    rows.push(['No DNS records or lookups returned.']);
  }

  rows.push([]);
  rows.push(['=== WHOIS REGISTRATION DATA ===']);
  rows.push(['Registrar', report.whois?.data?.registrar || 'N/A']);
  rows.push(['Creation Date', report.whois?.data?.creationDate || 'N/A']);
  rows.push(['Expiration Date', report.whois?.data?.expirationDate || 'N/A']);
  rows.push(['Last Updated', report.whois?.data?.updatedDate || 'N/A']);
  rows.push(['Registrant Org', report.whois?.data?.registrantOrganization || 'N/A']);
  rows.push(['Registrant Country', report.whois?.data?.registrantCountry || 'N/A']);
  rows.push(['Privacy Protected', report.whois?.data?.isPrivacyProtected ? 'Yes' : 'No']);
  rows.push(['Name Servers', (report.whois?.data?.nameServers || []).join('; ')]);

  rows.push([]);
  rows.push(['=== IP METADATA & NETWORK INFO ===']);
  rows.push(['IP Address', report.ipInfo?.data?.ip || 'N/A']);
  rows.push(['IP Version', report.ipInfo?.data?.ipVersion ? `IPv${report.ipInfo.data.ipVersion}` : 'N/A']);
  rows.push(['Address Scope', report.ipInfo?.data?.isPrivate ? 'Private / Reserved' : 'Public']);
  rows.push(['ASN / Organization', report.ipInfo?.data?.asn ? `${report.ipInfo.data.asn} (${report.ipInfo.data.organization || ''})` : (report.ipInfo?.data?.organization || 'N/A')]);
  rows.push(['Country / Region', [report.ipInfo?.data?.country, report.ipInfo?.data?.region, report.ipInfo?.data?.city].filter(Boolean).join(', ') || 'N/A']);
  rows.push(['Reverse DNS (PTR)', (report.ipInfo?.data?.reverseDns || []).join('; ') || 'None']);

  return rows.map((row) => row.map(sanitizeCsvCell).join(',')).join('\r\n');
}

export function generateReportPdf(report: IReconReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 45, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header Banner
      doc
        .rect(0, 0, doc.page.width, 70)
        .fill('#0b1329');

      doc
        .fillColor('#00e5ff')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('UNIFIED RECONNAISSANCE PLATFORM', 45, 20);

      doc
        .fillColor('#94a3b8')
        .fontSize(10)
        .font('Helvetica')
        .text('Passive Cybersecurity Intelligence & OSINT Recon Report', 45, 45);

      doc.moveDown(3);

      // Metadata Overview Box
      doc
        .fillColor('#0f172a')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('TARGET IDENTIFICATION & OVERVIEW', 45, 85);

      doc.moveTo(45, 102).lineTo(550, 102).strokeColor('#0284c7').lineWidth(1.5).stroke();

      doc.fontSize(10).font('Helvetica');
      doc.fillColor('#1e293b');
      doc.text(`Target: ${report.target}`, 45, 115);
      doc.text(`Target Type: ${report.targetType.toUpperCase()}`, 300, 115);
      doc.text(`Scan Date: ${new Date(report.lookupTimestamp).toUTCString()}`, 45, 132);
      doc.text(`Overall Status: ${report.overallStatus.toUpperCase()}`, 300, 132);
      doc.text(`Lookup Duration: ${report.summaryStats?.durationMs || 0} ms`, 45, 149);
      doc.text(`Total DNS Records: ${report.summaryStats?.dnsRecordsCount || 0}`, 300, 149);

      // Section 1: DNS Records
      let yPos = 180;
      doc
        .fillColor('#0f172a')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('1. DNS RESOLUTION RECORDS', 45, yPos);

      yPos += 18;
      doc.moveTo(45, yPos).lineTo(550, yPos).strokeColor('#cbd5e1').lineWidth(1).stroke();
      yPos += 10;

      if (report.dns?.records && report.dns.records.length > 0) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#334155');
        doc.text('TYPE', 45, yPos);
        doc.text('RECORD VALUE / TARGET', 120, yPos);
        doc.text('TTL', 500, yPos);
        yPos += 14;

        doc.font('Helvetica').fontSize(8.5).fillColor('#0f172a');
        for (const record of report.dns.records.slice(0, 20)) {
          if (yPos > 720) {
            doc.addPage();
            yPos = 50;
          }
          doc.text(record.type, 45, yPos);
          doc.text(record.value.slice(0, 75), 120, yPos);
          doc.text(record.ttl ? String(record.ttl) : '-', 500, yPos);
          yPos += 14;
        }
      } else {
        doc.font('Helvetica').fontSize(9).fillColor('#64748b').text('No DNS records returned or lookup was skipped.', 45, yPos);
        yPos += 16;
      }

      // Section 2: WHOIS Registration
      yPos += 15;
      if (yPos > 680) {
        doc.addPage();
        yPos = 50;
      }

      doc
        .fillColor('#0f172a')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('2. WHOIS REGISTRATION INTELLIGENCE', 45, yPos);

      yPos += 18;
      doc.moveTo(45, yPos).lineTo(550, yPos).strokeColor('#cbd5e1').lineWidth(1).stroke();
      yPos += 10;

      doc.font('Helvetica').fontSize(9).fillColor('#1e293b');
      doc.text(`Registrar: ${report.whois?.data?.registrar || 'Unavailable / Not Disclosed'}`, 45, yPos);
      doc.text(`Creation Date: ${report.whois?.data?.creationDate || 'N/A'}`, 300, yPos);
      yPos += 14;
      doc.text(`Expiration Date: ${report.whois?.data?.expirationDate || 'N/A'}`, 45, yPos);
      doc.text(`Updated Date: ${report.whois?.data?.updatedDate || 'N/A'}`, 300, yPos);
      yPos += 14;
      doc.text(`Registrant Org: ${report.whois?.data?.registrantOrganization || 'Private / Redacted'}`, 45, yPos);
      doc.text(`Privacy Protected: ${report.whois?.data?.isPrivacyProtected ? 'YES' : 'NO'}`, 300, yPos);
      yPos += 14;

      if (report.whois?.data?.nameServers && report.whois.data.nameServers.length > 0) {
        doc.text(`Name Servers: ${report.whois.data.nameServers.join(', ')}`, 45, yPos, { width: 500 });
        yPos += 20;
      }

      // Section 3: IP & Network Information
      yPos += 15;
      if (yPos > 680) {
        doc.addPage();
        yPos = 50;
      }

      doc
        .fillColor('#0f172a')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('3. IP ADDRESS & NETWORK METADATA', 45, yPos);

      yPos += 18;
      doc.moveTo(45, yPos).lineTo(550, yPos).strokeColor('#cbd5e1').lineWidth(1).stroke();
      yPos += 10;

      const ipInfo = report.ipInfo?.data;
      doc.font('Helvetica').fontSize(9).fillColor('#1e293b');
      doc.text(`Resolved IP: ${ipInfo?.ip || 'N/A'}`, 45, yPos);
      doc.text(`Classification: ${ipInfo?.isPrivate ? 'Private / Internal (RFC 1918)' : 'Public Internet Address'}`, 300, yPos);
      yPos += 14;
      doc.text(`ISP / ASN: ${ipInfo?.asn ? `${ipInfo.asn} - ${ipInfo.asName || ipInfo.isp || ''}` : (ipInfo?.isp || 'N/A')}`, 45, yPos, { width: 500 });
      yPos += 14;
      doc.text(`Location: ${[ipInfo?.city, ipInfo?.region, ipInfo?.country].filter(Boolean).join(', ') || 'N/A'}`, 45, yPos);
      doc.text(`Timezone: ${ipInfo?.timezone || 'N/A'}`, 300, yPos);
      yPos += 14;

      if (ipInfo?.reverseDns && ipInfo.reverseDns.length > 0) {
        doc.text(`Reverse DNS (PTR): ${ipInfo.reverseDns.join(', ')}`, 45, yPos, { width: 500 });
        yPos += 18;
      }

      // Ethical & Legal Disclaimer Box
      if (yPos > 670) {
        doc.addPage();
        yPos = 50;
      } else {
        yPos += 20;
      }

      doc
        .rect(45, yPos, 505, 50)
        .fill('#f1f5f9');

      doc
        .fillColor('#334155')
        .fontSize(7.5)
        .font('Helvetica-Oblique')
        .text(
          'LEGAL DISCLAIMER: This reconnaissance report was produced exclusively through safe, passive, and publicly queryable OSINT/DNS/RDAP sources without port scanning, credential attacks, or website exploitation. Intended strictly for authorized educational research, risk assessment, and technical verification.',
          55,
          yPos + 10,
          { width: 485, lineGap: 2 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
