import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Key,
  Shield,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  FileText,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Card } from '../components/common/Card.js';
import { Badge } from '../components/common/Badge.js';
import { useToast } from '../context/ToastContext.js';

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      showToast('error', 'Weak Password', 'New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'Mismatch', 'New password and confirmation do not match.');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await api.changePassword({ currentPassword, newPassword });
      if (res.success) {
        showToast('success', 'Password Changed', 'Your password has been successfully updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast('error', 'Failed', res.message);
      }
    } catch (err: any) {
      showToast('error', 'Update Error', err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs mb-1">
          <Shield className="w-4 h-4" />
          <span>SECURITY & CONFIGURATION</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Account & Platform Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your credentials, session policies, and review ethical reconnaissance compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Profile Summary */}
        <div className="space-y-6">
          <Card title="Operator Profile">
            <div className="space-y-4 text-xs">
              <div className="w-14 h-14 rounded-full bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-lg font-mono">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'UR'}
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">Full Name:</div>
                <div className="font-semibold text-slate-100 text-sm mt-0.5">
                  {user?.name || 'Operator'}
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">Registered Email:</div>
                <div className="text-slate-300 font-mono mt-0.5 break-all">
                  {user?.email}
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">Account Created:</div>
                <div className="text-slate-400 font-mono mt-0.5 text-[11px]">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">Access Level:</div>
                <div className="mt-1">
                  <Badge variant="cyan" size="sm">
                    AUTHORIZED OSINT ANALYST
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Platform</span>
              </button>
            </div>
          </Card>

          {/* Theme card */}
          <Card title="Display & Theme">
            <div className="text-xs text-slate-400 space-y-2">
              <p>
                Currently locked to <strong>Cyber Dark Navy</strong> for optimal cybersecurity SOC readability and contrast standards.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <span className="w-4 h-4 rounded-full bg-navy-950 border border-cyan-500"></span>
                <span className="text-[11px] text-slate-300 font-mono">Navy #060b13 / Cyan #00e5ff</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Security & Policies */}
        <div className="md:col-span-2 space-y-6">
          {/* Change Password */}
          <Card title="Update Password" subtitle="Enforce strong password authentication">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-navy-950 border border-slate-700 text-slate-100 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Min 8 characters"
                    className="w-full bg-navy-950 border border-slate-700 text-slate-100 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    className="w-full bg-navy-950 border border-slate-700 text-slate-100 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </Card>

          {/* Data Retention & Privacy Notice */}
          <Card title="Data Retention & Privacy Architecture">
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">User Data Isolation:</strong> All scan records are tied to the authenticated user ID and indexed in MongoDB. Other users cannot query or inspect your reconnaissance history.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Zero Individual Geo-Tracking:</strong> IP metadata collection is strictly limited to autonomous system (ASN), ISP organization, and city-level routing. No individual homes, devices, or private persons are tracked.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Ethical & Legal Compliance:</strong> The platform enforces passive reconnaissance (DNS queries, RDAP domain registrations, and BGP routing prefixes). Active intrusion, port scans, and exploitation are strictly disabled.
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
