import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  Download,
  Trash2,
  Calendar,
  Clock,
  ArrowLeft,
  FileCode,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  ExternalLink,
  Layers,
  Globe,
  Database,
  Lock,
} from 'lucide-react';
import { api, downloadReportFile } from '../services/api.js';
import { ReconReport, DnsRecord } from '../types/index.js';
import { Card } from '../components/common/Card.js';
import { Badge } from '../components/common/Badge.js';
import { Skeleton } from '../components/common/Skeleton.js';
import { useToast } from '../context/ToastContext.js';

export const ScanResults: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [report, setReport] = useState<ReconReport | null>(location.state?.report || null);
  const [isLoading, setIsLoading] = useState(!report && !!id && id !== 'live');
  const [activeTab, setActiveTab] = useState<'overview' | 'dns' | 'whois' | 'ip' | 'raw'>('overview');
  const [dnsTypeFilter, setDnsTypeFilter] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState<string | null>(null);

  useEffect(() => {
    if (!report && id && id !== 'live') {
      const fetchReport = async () => {
        try {
          setIsLoading(true);
          const res = await api.getReport(id);
          if (res.success && res.report) {
            setReport(res.report);
          } else {
            showToast('error', 'Report not found', res.message);
          }
        } catch (err: any) {
          showToast('error', 'Failed to load report', err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchReport();
    }
  }, [id, report]);

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    if (!report?._id) {
      showToast('warning', 'Live Preview', 'Please save or view from Scan History to download full report.');
      return;
    }

    try {
      setIsExporting(format);
      await downloadReportFile(report._id, format);
      showToast('success', 'Export Ready', `Downloaded report in ${format.toUpperCase()} format.`);
    } catch (err: any) {
      showToast('error', 'Export Failed', err.message);
    } finally {
      setIsExporting(null);
    }
  };

  const handleDelete = async () => {
    if (!report?._id) return;
    if (!window.confirm(`Are you sure you want to delete the report for ${report.target}?`)) return;

    try {
      await api.deleteReport(report._id);
      showToast('success', 'Deleted', 'Reconnaissance report removed from history.');
      navigate('/history');
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast('info', 'Copied to Clipboard', label);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20 max-w-lg mx-auto">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-100">No Recon Report Found</h2>
        <p className="text-xs text-slate-400 mt-2">
          The requested report could not be loaded or may have been deleted.
        </p>
        <button
          onClick={() => navigate('/scan')}
          className="mt-5 px-4 py-2 bg-cyan-500 text-slate-950 font-semibold text-xs rounded-lg hover:bg-cyan-400 transition-colors"
        >
          Start New Reconnaissance
        </button>
      </div>
    );
  }

  // Filter DNS records
  const dnsRecords = report.dns?.records || [];
  const filteredDns = dnsTypeFilter === 'ALL'
    ? dnsRecords
    : dnsRecords.filter((r) => r.type === dnsTypeFilter);

  const availableDnsTypes = Array.from(new Set(dnsRecords.map((r) => r.type)));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/history')}
            className="p-2 rounded-lg bg-navy-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold text-slate-100">
                {report.target}
              </span>
              <Badge variant="cyan" size="sm">
                {report.targetType.toUpperCase()}
              </Badge>
              <Badge
                variant={
                  report.overallStatus === 'success'
                    ? 'success'
                    : report.overallStatus === 'partial'
                    ? 'warning'
                    : 'error'
                }
              >
                {report.overallStatus.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {new Date(report.lookupTimestamp).toUTCString()}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {report.summaryStats?.durationMs || 0} ms
              </span>
            </div>
          </div>
        </div>

        {/* Export and Delete Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-navy-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => handleExport('json')}
              disabled={isExporting !== null}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded transition-colors flex items-center gap-1 font-medium"
              title="Download JSON Report"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>JSON</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting !== null}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded transition-colors flex items-center gap-1 font-medium"
              title="Download CSV Report"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting !== null}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded transition-colors flex items-center gap-1 font-medium"
              title="Download PDF Report"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>PDF</span>
            </button>
          </div>

          {report._id && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-navy-900 border border-slate-800 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors"
              title="Delete Report"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('dns')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'dns'
              ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>DNS Records ({report.dns?.records?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('whois')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'whois'
              ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>WHOIS Registration</span>
        </button>

        <button
          onClick={() => setActiveTab('ip')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ip'
              ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>IP & Network Routing</span>
        </button>

        <button
          onClick={() => setActiveTab('raw')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'raw'
              ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Raw Metadata</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">DNS Records Resolved</div>
                <div className="text-xl font-bold text-slate-100 font-mono">
                  {report.summaryStats?.dnsRecordsCount || 0}
                </div>
              </div>
            </Card>

            <Card className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">WHOIS Status</div>
                <div className="text-sm font-bold text-slate-100 font-mono capitalize">
                  {report.whois?.status || 'Unavailable'}
                </div>
              </div>
            </Card>

            <Card className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">IP Routing / ASN</div>
                <div className="text-sm font-bold text-slate-100 font-mono capitalize">
                  {report.ipInfo?.status || 'Unavailable'}
                </div>
              </div>
            </Card>
          </div>

          {/* Data Sources Breakdown */}
          <Card title="Data Sources & Query Audit Trail" subtitle="Verified passive lookups performed">
            {report.dataSources && report.dataSources.length > 0 ? (
              <div className="space-y-3">
                {report.dataSources.map((ds, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-navy-950/80 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 text-xs flex items-center gap-2">
                        <span>{ds.name}</span>
                        <Badge
                          variant={ds.status === 'success' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {ds.status}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{ds.description}</div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(ds.queriedAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No data source logs recorded.</p>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: DNS Records */}
      {activeTab === 'dns' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-navy-900/60 p-4 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filter by Record Type:</span>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setDnsTypeFilter('ALL')}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium ${
                    dnsTypeFilter === 'ALL'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-navy-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  ALL ({dnsRecords.length})
                </button>
                {availableDnsTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setDnsTypeFilter(type)}
                    className={`px-2 py-1 rounded text-xs font-mono font-medium ${
                      dnsTypeFilter === type
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-navy-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <Badge variant="neutral" size="sm">
              Source: {report.dns?.source || 'Passive DNS Resolver'}
            </Badge>
          </div>

          {/* DNS Safety Notice */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[11px] text-blue-300 flex items-start gap-2">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
            <span>
              <strong>Passive OSINT Notice:</strong> DNS record resolution reflects publicly declared domain zone mappings. Presence of specific records does not imply malice or complete safety.
            </span>
          </div>

          {filteredDns.length > 0 ? (
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-navy-900 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Record Value / Destination</th>
                    <th className="py-2.5 px-3">TTL (Sec)</th>
                    <th className="py-2.5 px-3 text-right">Copy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono bg-navy-950">
                  {filteredDns.map((record, index) => (
                    <tr key={index} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded font-bold text-xs bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          {record.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-200 break-all max-w-lg">
                        {record.value}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {record.ttl !== undefined ? record.ttl : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-sans">
                        <button
                          onClick={() => copyToClipboard(record.value, `${record.type} record`)}
                          className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                          title="Copy value"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <span>No DNS records matched the filter or were returned by recursive resolvers.</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: WHOIS Information */}
      {activeTab === 'whois' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Registration Identifiers">
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-slate-400 text-[11px]">Sponsoring Registrar:</div>
                  <div className="font-semibold text-slate-100 mt-0.5 font-mono">
                    {report.whois?.data?.registrar || 'Unavailable / Redacted'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Registrant Organization:</div>
                  <div className="font-semibold text-slate-100 mt-0.5 font-mono">
                    {report.whois?.data?.registrantOrganization || 'Redacted for Privacy'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Registrant Country:</div>
                  <div className="font-semibold text-slate-100 mt-0.5 font-mono">
                    {report.whois?.data?.registrantCountry || 'Unavailable'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Privacy Protection Status:</div>
                  <div className="mt-1">
                    {report.whois?.data?.isPrivacyProtected ? (
                      <Badge variant="cyan" size="sm">
                        PRIVACY PROTECTED / REDACTED
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        STANDARD PUBLIC LISTING
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Registration Lifecycle Dates">
              <div className="space-y-3 text-xs font-mono">
                <div>
                  <div className="text-slate-400 text-[11px] font-sans">Creation Date:</div>
                  <div className="font-semibold text-slate-200 mt-0.5">
                    {report.whois?.data?.creationDate || 'Unavailable'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px] font-sans">Expiration Date:</div>
                  <div className="font-semibold text-slate-200 mt-0.5">
                    {report.whois?.data?.expirationDate || 'Unavailable'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px] font-sans">Last Updated Date:</div>
                  <div className="font-semibold text-slate-200 mt-0.5">
                    {report.whois?.data?.updatedDate || 'Unavailable'}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Name Servers & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Authoritative Name Servers">
              {report.whois?.data?.nameServers && report.whois.data.nameServers.length > 0 ? (
                <ul className="space-y-1.5 text-xs font-mono text-cyan-300">
                  {report.whois.data.nameServers.map((ns, i) => (
                    <li key={i} className="flex items-center gap-2 p-2 bg-navy-950 rounded border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      <span>{ns}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-slate-500">No name servers returned via WHOIS/RDAP.</div>
              )}
            </Card>

            <Card title="Domain Status Codes">
              {report.whois?.data?.status && report.whois.data.status.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {report.whois.data.status.map((st, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded text-[11px] font-mono bg-navy-950 border border-slate-800 text-slate-300"
                    >
                      {st}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500">No explicit status codes returned.</div>
              )}
            </Card>
          </div>

          {/* Raw Text Viewer */}
          {report.whois?.data?.rawText && (
            <Card title="Raw WHOIS / RDAP Response Text">
              <pre className="p-3 bg-navy-950 border border-slate-800 rounded-lg text-slate-300 font-mono text-xs overflow-x-auto max-h-72 whitespace-pre-wrap leading-relaxed">
                {report.whois.data.rawText}
              </pre>
            </Card>
          )}
        </div>
      )}

      {/* Tab 4: IP & Network Information */}
      {activeTab === 'ip' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="IP Address & Protocol Details">
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-slate-400 text-[11px]">Resolved IP Address:</div>
                  <div className="font-semibold text-slate-100 font-mono text-sm mt-0.5">
                    {report.ipInfo?.data?.ip || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">IP Version:</div>
                  <div className="font-mono text-slate-200 mt-0.5">
                    IPv{report.ipInfo?.data?.ipVersion || 4}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Address Scope:</div>
                  <div className="mt-1">
                    {report.ipInfo?.data?.isPrivate ? (
                      <Badge variant="warning" size="sm">
                        PRIVATE / RESERVED (RFC 1918)
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm">
                        PUBLIC ROUTABLE INTERNET ADDRESS
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Autonomous System (ASN) & ISP Routing">
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-slate-400 text-[11px]">Autonomous System Number:</div>
                  <div className="font-semibold text-slate-100 font-mono mt-0.5">
                    {report.ipInfo?.data?.asn || 'Unavailable'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Autonomous System Name:</div>
                  <div className="text-slate-200 mt-0.5 font-mono">
                    {report.ipInfo?.data?.asName || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Internet Service Provider (ISP):</div>
                  <div className="text-slate-200 mt-0.5 font-mono">
                    {report.ipInfo?.data?.isp || report.ipInfo?.data?.organization || 'Unavailable'}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Geographic & Regional Metadata">
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-slate-400 text-[11px]">Country:</div>
                  <div className="font-semibold text-slate-200 mt-0.5">
                    {report.ipInfo?.data?.country || 'Unavailable'} ({report.ipInfo?.data?.countryCode || 'N/A'})
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Region / City:</div>
                  <div className="text-slate-200 mt-0.5">
                    {[report.ipInfo?.data?.region, report.ipInfo?.data?.city].filter(Boolean).join(', ') || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Timezone:</div>
                  <div className="text-slate-200 font-mono mt-0.5">
                    {report.ipInfo?.data?.timezone || 'N/A'}
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Reverse DNS (PTR Records)">
              {report.ipInfo?.data?.reverseDns && report.ipInfo.data.reverseDns.length > 0 ? (
                <ul className="space-y-1.5 text-xs font-mono text-cyan-300">
                  {report.ipInfo.data.reverseDns.map((ptr, i) => (
                    <li key={i} className="p-2 bg-navy-950 rounded border border-slate-800 break-all">
                      {ptr}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-slate-500 py-3">
                  No PTR reverse DNS record configured for this IP address.
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Tab 5: Raw Metadata */}
      {activeTab === 'raw' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Raw JSON representation of the entire scan report:
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(report, null, 2), 'Full JSON Report')}
              className="px-3 py-1.5 bg-navy-900 border border-slate-800 rounded-lg text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Raw JSON</span>
            </button>
          </div>

          <pre className="p-4 bg-navy-950 border border-slate-800 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed">
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
