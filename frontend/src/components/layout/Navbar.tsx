import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Search,
  Bell,
  User,
  LogOut,
  CheckCircle,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [quickTarget, setQuickTarget] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTarget.trim()) return;
    navigate(`/scan?target=${encodeURIComponent(quickTarget.trim())}`);
    setQuickTarget('');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-navy-950/90 border-b border-slate-800/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-slate-100 text-sm tracking-wide">
              <span>UNIFIED RECON</span>
              <span className="px-1.5 py-0.2 text-[10px] bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30 font-mono">
                OSINT
              </span>
            </div>
            <div className="text-[10px] text-slate-400 hidden sm:block">
              Passive Cybersecurity Intelligence
            </div>
          </div>
        </div>
      </div>

      {/* Center Search Bar */}
      <form
        onSubmit={handleQuickSearch}
        className="hidden md:flex items-center flex-1 max-w-md mx-6"
      >
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Quick recon target (e.g. example.com or 8.8.8.8)..."
            value={quickTarget}
            onChange={(e) => setQuickTarget(e.target.value)}
            className="w-full bg-navy-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 font-mono"
          />
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Safe Mode Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[11px] text-emerald-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>PASSIVE MODE</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 relative focus:outline-none"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400"></span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-navy-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-800/60 text-xs font-semibold text-slate-300">
                System Notifications
              </div>
              <div className="p-3 text-xs text-slate-400 space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-slate-200 font-medium">Safe Passive OSINT Active</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Target resolution strictly limited to authorized public DNS, RDAP, and IP metadata.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-cyan-900/40 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-semibold text-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'UR'}
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-medium text-slate-200 max-w-[120px] truncate">
                {user?.name || 'Operator'}
              </div>
              <div className="text-[10px] text-slate-400 max-w-[120px] truncate">
                {user?.email || 'security@recon.local'}
              </div>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-navy-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50">
              <div className="px-4 py-2 border-b border-slate-800/60">
                <p className="text-xs font-medium text-slate-200">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/settings');
                }}
                className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-800/60 flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                Settings & Profile
              </button>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full px-4 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
