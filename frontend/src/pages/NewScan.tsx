import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Shield,
  ShieldAlert,
  Server,
  Globe,
  Radio,
  CheckCircle2,
  Loader2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api.js';
import { Card } from '../components/common/Card.js';
import { Badge } from '../components/common/Badge.js';
import { useToast } from '../context/ToastContext.js';

export const NewScan: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [target, setTarget] = useState(searchParams.get('target') || '');
  const [detectedType, setDetectedType] = useState<'domain' | 'ipv4' | 'ipv6' | 'unknown'>('unknown');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  // Quick preset samples for educational viva demo
  const samplePresets = import.meta.env.VITE_DEMO_MODE === 'true'
    ? [{ label: 'Example Domain', target: 'example.com', type: 'domain' }]
    : [
        { label: 'Cloudflare', target: 'cloudflare.com', type: 'domain' },
        { label: 'Google DNS', target: '8.8.8.8', type: 'ipv4' },
        { label: 'Wikipedia', target: 'wikipedia.org', type: 'domain' },
        { label: 'One.One.One.One', target: '1.1.1.1', type: 'ipv4' },
        { label: 'GitHub', target: 'github.com', type: 'domain' },
      ];

  // Client-side instant input validator
  useEffect(() => {
    const raw = target.trim();
    if (!raw) {
      setDetectedType('unknown');
      setValidationError(null);
      return;
    }

    // Reject schemes
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(raw)) {
      setValidationError('Please remove the URL protocol (e.g. http:// or https://). Enter only the domain or IP.');
      setDetectedType('unknown');
      return;
    }

    // Reject command injection characters
    if (/[;&|`$><!\\"'\s]/.test(raw)) {
      setValidationError('Input contains forbidden characters or spaces.');
      setDetectedType('unknown');
      return;
    }

    // Reject paths or ports
    if (raw.includes('/') || (raw.includes(':') && !raw.includes('::') && !raw.startsWith('['))) {
      if (raw.includes('/') || raw.includes('?') || raw.includes('#')) {
        setValidationError('Target should not contain URL paths, query parameters, or port numbers.');
        setDetectedType('unknown');
        return;
      }
    }

    const lower = raw.toLowerCase();

    // Check private ranges (SSRF defense)
    if (
      lower === 'localhost' ||
      lower.endsWith('.localhost') ||
      lower.startsWith('127.') ||
      lower.startsWith('10.') ||
      lower.startsWith('192.168.') ||
      lower.startsWith('169.254.') ||
      lower === '::1'
    ) {
      setValidationError('Prohibited target: Private, loopback, and local network ranges are blocked to prevent SSRF vulnerabilities.');
      setDetectedType('unknown');
      return;
    }

    // IPv4 regex
    const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
    if (ipv4Regex.test(lower)) {
      setDetectedType('ipv4');
      setValidationError(null);
      return;
    }

    // IPv6 basic regex
    if (lower.includes(':') && /^[0-9a-fA-F:]+$/.test(lower)) {
      setDetectedType('ipv6');
      setValidationError(null);
      return;
    }

    // Domain regex
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
    if (domainRegex.test(lower)) {
      setDetectedType('domain');
      setValidationError(null);
      return;
    }

    setValidationError('Please enter a valid domain name (e.g. example.com) or public IP address.');
    setDetectedType('unknown');
  }, [target]);

  const handleLaunchScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError || !target.trim()) return;

    setIsScanning(true);
    setScanStep(1);

    const stepTimer1 = setTimeout(() => setScanStep(2), 600);
    const stepTimer2 = setTimeout(() => setScanStep(3), 1300);
    const stepTimer3 = setTimeout(() => setScanStep(4), 2100);

    try {
      const res = await api.fullScan(target.trim());
      if (res.success && res.report) {
        showToast('success', 'Scan Completed', `Reconnaissance finished for ${res.report.target}`);
        navigate(`/results/${res.report._id || 'live'}`, { state: { report: res.report } });
      } else {
        showToast('error', 'Lookup failed', res.message || 'Unknown reconnaissance error');
      }
    } catch (err: any) {
      showToast('error', 'Reconnaissance Error', err.message || 'Lookup failed');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setIsScanning(false);
      setScanStep(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs mb-1">
          <Radio className="w-4 h-4 animate-pulse" />
          <span>PASSIVE OSINT MODULE</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Reconnaissance Target Search</h1>
        <p className="text-xs text-slate-400 mt-1">
          Perform non-intrusive reconnaissance across DNS zone records, WHOIS domain registration, and public IP autonomous system metadata.
        </p>
      </div>

      {/* Main Target Input Card */}
      <Card className="border-cyan-500/30">
        <form onSubmit={handleLaunchScan} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Target Hostname or IP Address
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-3.5 text-slate-400">
                {detectedType === 'domain' ? (
                  <Globe className="w-5 h-5 text-cyan-400" />
                ) : detectedType === 'ipv4' || detectedType === 'ipv6' ? (
                  <Server className="w-5 h-5 text-blue-400" />
                ) : (
                  <Search className="w-5 h-5 text-slate-500" />
                )}
              </div>
              <input
                type="text"
                placeholder="Enter domain (e.g. google.com) or IP (e.g. 8.8.8.8)..."
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={isScanning}
                className="w-full bg-navy-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm rounded-xl pl-11 pr-24 py-3 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
              />

              {/* Detected Type Pill */}
              <div className="absolute right-3 top-3">
                {detectedType !== 'unknown' ? (
                  <Badge variant="cyan" size="sm">
                    {detectedType.toUpperCase()}
                  </Badge>
                ) : null}
              </div>
            </div>

            {/* Validation Feedback */}
            {validationError ? (
              <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
            ) : target.trim() && detectedType !== 'unknown' ? (
              <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Target format validated. Ready for passive reconnaissance.</span>
              </div>
            ) : null}
          </div>

          {/* Quick Demo Presets */}
          <div>
            <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <span>Quick Presets for Viva Demonstration:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {samplePresets.map((preset) => (
                <button
                  key={preset.target}
                  type="button"
                  onClick={() => setTarget(preset.target)}
                  disabled={isScanning}
                  className="px-2.5 py-1 rounded-lg bg-navy-950 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-300 font-mono transition-colors"
                >
                  {preset.target}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isScanning || !!validationError || !target.trim()}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                isScanning || !!validationError || !target.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 active:scale-[0.99]'
              }`}
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Executing Passive Reconnaissance...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Launch Passive Reconnaissance</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Scan Step Stepper */}
        {isScanning && (
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-3 font-mono text-xs">
            <div className="text-slate-300 font-semibold mb-2">Scan Progress Pipeline:</div>
            <div className="space-y-2">
              <div className={`flex items-center gap-2 ${scanStep >= 1 ? 'text-cyan-400' : 'text-slate-500'}`}>
                {scanStep > 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />}
                <span>Phase 1: Validating Target Format & SSRF Protection Filters</span>
              </div>
              <div className={`flex items-center gap-2 ${scanStep >= 2 ? 'text-cyan-400' : 'text-slate-500'}`}>
                {scanStep > 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : scanStep === 2 ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
                <span>Phase 2: Resolving DNS Records (A, AAAA, MX, NS, TXT, CNAME, SOA)</span>
              </div>
              <div className={`flex items-center gap-2 ${scanStep >= 3 ? 'text-cyan-400' : 'text-slate-500'}`}>
                {scanStep > 3 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : scanStep === 3 ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
                <span>Phase 3: Querying ICANN RDAP & Domain WHOIS Registry</span>
              </div>
              <div className={`flex items-center gap-2 ${scanStep >= 4 ? 'text-cyan-400' : 'text-slate-500'}`}>
                {scanStep > 4 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : scanStep === 4 ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
                <span>Phase 4: Gathering Autonomous System (ASN), ISP & Reverse DNS</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Security Scope & Ethical Guidelines Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-navy-950/60 border-slate-800">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-slate-200">Safe Passive Reconnaissance</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Queries are strictly limited to publicly authoritative DNS name servers, ICANN RDAP endpoints, and public BGP routing databases. No packets or exploits are transmitted to target servers.
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-navy-950/60 border-slate-800">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-slate-200">SSRF & Injection Defenses</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Strict server-side validation rejects RFC 1918 private subnets, loopback addresses, cloud metadata endpoints (169.254.169.254), and command injection characters.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
