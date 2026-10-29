import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  FileCode,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { api, downloadReportFile } from '../services/api.js';
import { ReconReport } from '../types/index.js';
import { Card } from '../components/common/Card.js';
import { Badge } from '../components/common/Badge.js';
import { Skeleton } from '../components/common/Skeleton.js';
import { useToast } from '../context/ToastContext.js';

export const ScanHistory: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [reports, setReports] = useState<ReconReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await api.getReports({
        page: currentPage,
        limit: 10,
        q: searchQuery,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });

      if (res.success) {
        setReports(res.reports || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || 0);
      }
    } catch (err: any) {
      showToast('error', 'Error fetching scan history', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [currentPage, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchReports();
  };

  const handleDelete = async (id: string, target: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete reconnaissance record for ${target}?`)) return;

    try {
      await api.deleteReport(id);
      showToast('success', 'Report Deleted', `Report for ${target} was removed.`);
      fetchReports();
    } catch (err: any) {
      showToast('error', 'Deletion failed', err.message);
    }
  };

  const handleExport = async (id: string, format: 'json' | 'csv' | 'pdf', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsExporting(`${id}_${format}`);
      await downloadReportFile(id, format);
      showToast('success', 'Export Downloaded', `${format.toUpperCase()} report exported successfully.`);
    } catch (err: any) {
      showToast('error', 'Export Error', err.message);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs mb-1">
            <History className="w-4 h-4" />
            <span>HISTORICAL SCAN ARCHIVE</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Reconnaissance Scan History</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse, filter, inspect, and export your previous reconnaissance lookups.
          </p>
        </div>

        <button
          onClick={() => navigate('/scan')}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-md shadow-cyan-500/20"
        >
          <span>New Recon Scan</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by target host or IP (e.g. cloudflare.com)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-navy-950 border border-slate-700/80 text-slate-200 placeholder-slate-500 text-xs rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-44">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-navy-950 border border-slate-700/80 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success Only</option>
                <option value="partial">Partial Only</option>
                <option value="failed">Failed Only</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-navy-900 border border-slate-700 hover:border-cyan-400 text-slate-200 text-xs rounded-lg font-medium transition-colors"
            >
              Filter
            </button>
          </div>
        </form>
      </Card>

      {/* Reports Table */}
      <Card
        title={`Saved Reports (${totalCount})`}
        subtitle="Confidential scan logs saved exclusively to your account"
      >
        {isLoading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">DNS</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-center">Export</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {reports.map((report) => (
                  <tr
                    key={report._id}
                    onClick={() => navigate(`/results/${report._id}`)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-semibold text-slate-100">
                      {report.target}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="cyan" size="sm">
                        {report.targetType.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={
                          report.overallStatus === 'success'
                            ? 'success'
                            : report.overallStatus === 'partial'
                            ? 'warning'
                            : 'error'
                        }
                      >
                        {report.overallStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {report.summaryStats?.dnsRecordsCount || 0}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {report.summaryStats?.durationMs || 0} ms
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(report.lookupTimestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => handleExport(report._id, 'json', e)}
                          className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
                          title="Export JSON"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleExport(report._id, 'csv', e)}
                          className="p-1 rounded text-slate-400 hover:text-emerald-300 hover:bg-slate-800"
                          title="Export CSV"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleExport(report._id, 'pdf', e)}
                          className="p-1 rounded text-slate-400 hover:text-rose-300 hover:bg-slate-800"
                          title="Export PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2 font-sans">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/results/${report._id}`);
                          }}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                        >
                          Open
                        </button>
                        <button
                          onClick={(e) => handleDelete(report._id, report.target, e)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete Report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No reconnaissance reports found for the selected query.</p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 mt-4 text-xs text-slate-400">
            <div>
              Page <span className="text-slate-200 font-bold">{currentPage}</span> of{' '}
              <span className="text-slate-200 font-bold">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-navy-950 border border-slate-800 text-slate-300 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-navy-950 border border-slate-800 text-slate-300 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
