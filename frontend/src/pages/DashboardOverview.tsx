import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Activity,
  Globe,
  Server,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../services/api.js';
import { DashboardStats } from '../types/index.js';
import { Card } from '../components/common/Card.js';
import { Badge } from '../components/common/Badge.js';
import { Skeleton } from '../components/common/Skeleton.js';
import { useToast } from '../context/ToastContext.js';

export const DashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quickInput, setQuickInput] = useState('');

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await api.getDashboardStats();
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err: any) {
      showToast('error', 'Error loading statistics', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    navigate(`/scan?target=${encodeURIComponent(quickInput.trim())}`);
  };

  const pieData = stats
    ? [
        { name: 'Domains', value: stats.typeBreakdown.domain || 0, color: '#00e5ff' },
        { name: 'IPv4', value: stats.typeBreakdown.ipv4 || 0, color: '#3b82f6' },
        { name: 'IPv6', value: stats.typeBreakdown.ipv6 || 0, color: '#a855f7' },
      ].filter((item) => item.value > 0)
    : [];

  const successRate = stats && stats.totalReports > 0
    ? Math.round(((stats.statusBreakdown.success || 0) / stats.totalReports) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-cyan-500/5 blur-3xl pointer-events-none" />
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>Authorized Passive Reconnaissance Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            Centralized Intelligence Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
            Perform safe, authorized OSINT intelligence collection across domain name records, WHOIS/RDAP registries, and public IP networks in one unified interface.
          </p>

          {/* Quick Start Form */}
          <form onSubmit={handleQuickScan} className="mt-5 flex items-center gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Enter domain or IP (e.g. cloudflare.com)..."
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                className="w-full bg-navy-950/90 border border-slate-700/80 text-slate-200 placeholder-slate-500 text-xs sm:text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs sm:text-sm rounded-lg transition-all flex items-center gap-1.5 flex-shrink-0 shadow-md shadow-cyan-500/20"
            >
              <span>Scan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Recon Reports</div>
            {isLoading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-100 font-mono mt-0.5">
                {stats?.totalReports || 0}
              </div>
            )}
            <div className="text-[11px] text-slate-500 mt-0.5">Saved in database</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Unique Targets</div>
            {isLoading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-100 font-mono mt-0.5">
                {stats?.uniqueTargetsCount || 0}
              </div>
            )}
            <div className="text-[11px] text-slate-500 mt-0.5">Distinct hosts analyzed</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Scan Success Rate</div>
            {isLoading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <div className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
                {successRate}%
              </div>
            )}
            <div className="text-[11px] text-slate-500 mt-0.5">Full & partial resolutions</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Avg Duration</div>
            {isLoading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-100 font-mono mt-0.5">
                {stats?.avgDurationMs || 0} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
            )}
            <div className="text-[11px] text-slate-500 mt-0.5">Parallel passive lookups</div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Area Chart */}
        <Card
          className="lg:col-span-2"
          title={
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Historical Reconnaissance Activity (Past 7 Days)</span>
            </span>
          }
          subtitle="Real-time scan frequency tracking"
        >
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Skeleton className="h-56 w-full" />
            </div>
          ) : stats && stats.timeline && stats.timeline.length > 0 ? (
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.timeline}>
                  <defs>
                    <linearGradient id="scansColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00e5ff" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => val.slice(5)}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b1329',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="scans"
                    stroke="#00e5ff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#scansColor)"
                    name="Lookups Performed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
              <Activity className="w-8 h-8 mb-2 opacity-50" />
              <span>No scan activity recorded yet. Run your first lookup above!</span>
            </div>
          )}
        </Card>

        {/* Target Type Breakdown Pie */}
        <Card
          title="Target Classification"
          subtitle="Proportion of domains vs IP targets"
        >
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Skeleton className="h-44 w-44 rounded-full" />
            </div>
          ) : pieData.length > 0 ? (
            <div className="h-64 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b1329',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-4 text-xs mt-2">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-300 font-medium">
                      {item.name} ({item.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
              <Globe className="w-8 h-8 mb-2 opacity-50" />
              <span>No targets analyzed yet.</span>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Lookups Table */}
      <Card
        title="Recent Reconnaissance Lookups"
        subtitle="Latest automated scans saved to your database"
        action={
          <button
            onClick={() => navigate('/history')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
          >
            <span>View Full History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        }
      >
        {isLoading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : stats && stats.recentScans && stats.recentScans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">DNS Records</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {stats.recentScans.map((scan) => (
                  <tr
                    key={scan._id}
                    onClick={() => navigate(`/results/${scan._id}`)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {scan.target}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="cyan" size="sm">
                        {scan.targetType.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={
                          scan.overallStatus === 'success'
                            ? 'success'
                            : scan.overallStatus === 'partial'
                            ? 'warning'
                            : 'error'
                        }
                      >
                        {scan.overallStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {scan.summaryStats?.dnsRecordsCount || 0}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {scan.summaryStats?.durationMs || 0} ms
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(scan.lookupTimestamp).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/results/${scan._id}`);
                        }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                      >
                        View Report →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-slate-500 text-xs">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-60 text-amber-400" />
            <p>No reconnaissance scans performed yet.</p>
            <button
              onClick={() => navigate('/scan')}
              className="mt-3 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-lg hover:bg-cyan-500/20 font-medium text-xs transition-colors"
            >
              Start First Recon Scan
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};
