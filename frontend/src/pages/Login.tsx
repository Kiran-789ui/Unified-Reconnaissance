import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      showToast('success', 'Welcome Back', 'Logged in to Unified Reconnaissance Platform.');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      showToast('error', 'Authentication Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Login for B.Tech project presentation & viva examiners
  const handleQuickDemoLogin = async () => {
    setError(null);
    setIsLoading(true);
    const demoEmail = 'student@recon.local';
    const demoPass = 'CyberSec2026!';

    try {
      try {
        await login(demoEmail, demoPass);
      } catch {
        // If demo user doesn't exist yet, auto-create
        await register('Cybersecurity Student', demoEmail, demoPass);
      }
      showToast('success', 'Demo Session Initialized', 'Logged in as Cybersecurity Student.');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Demo initialization failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background cyber accent blur */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Logo and title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2 shadow-lg shadow-cyan-500/10">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Unified Reconnaissance Platform
          </h1>
          <p className="text-xs text-slate-400">
            Passive OSINT, DNS & WHOIS Intelligence Dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-navy-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-5">
          <div className="border-b border-slate-800/80 pb-3">
            <h2 className="text-sm font-semibold text-slate-200">Account Authentication</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Sign in to access your saved reconnaissance scans</p>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="analyst@university.edu"
                  className="w-full bg-navy-950 border border-slate-700/80 text-slate-100 text-xs rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-navy-950 border border-slate-700/80 text-slate-100 text-xs rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 mt-2"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Examiner Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={isLoading}
              className="w-full py-2 px-3 bg-navy-950 hover:bg-slate-800/80 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>1-Click Project Viva / Demo Login</span>
            </button>
          </div>

          <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800/80">
            <span>Don't have an account? </span>
            <Link to="/register" className="text-cyan-400 hover:underline font-semibold">
              Create Analyst Account
            </Link>
          </div>
        </div>

        {/* Ethical disclaimer footer */}
        <p className="text-[11px] text-center text-slate-500 max-w-sm mx-auto">
          Authorized for passive OSINT reconnaissance and educational cybersecurity research.
        </p>
      </div>
    </div>
  );
};
