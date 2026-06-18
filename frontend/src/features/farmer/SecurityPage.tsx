import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Activity, AlertTriangle, Monitor, Clock, Shield, Lock } from 'lucide-react';
import { authAPI } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const SecurityPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [timeout_, setTimeout_] = useState('30 minutes');
  const [passwords, setPasswords] = useState({ current: '', new_password: '', confirm: '' });

  const pwMutation = useMutation({
    mutationFn: () => authAPI.changePassword({ current_password: passwords.current, new_password: passwords.new_password }),
    onSuccess: () => { toast.success('Password updated'); setPasswords({ current: '', new_password: '', confirm: '' }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handlePwChange = () => {
    if (!passwords.current) { toast.error('Enter current password'); return; }
    if (passwords.new_password.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (passwords.new_password !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    pwMutation.mutate();
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('This will log you out of all devices. Continue?')) return;
    await logout();
    toast.success('Logged out from all devices');
  };

  const currentSession = {
    device: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop - ' + (navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Browser'),
    location: 'Kigali, Rwanda',
    loginTime: user ? new Date((user as any).last_login || Date.now()).toLocaleString() : '—',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security & Session Monitoring</h1>
        <p className="text-sm text-gray-500">Manage your account security and login settings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Account Status', value: (user as any)?.status || 'active', icon: Shield, color: 'text-agri-green', bg: 'bg-green-100' },
          { label: 'Last Login', value: (user as any)?.last_login ? new Date((user as any).last_login).toLocaleDateString() : 'Today', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Active Sessions', value: '1', icon: Monitor, color: 'text-orange-500', bg: 'bg-orange-100' },
          { label: 'Verification', value: (user as any)?.is_verified ? 'Verified' : 'Pending', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100' },
        ].map((s, i) => (
          <div key={i} className="card flex items-center gap-3">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}><s.icon size={18} className={s.color} /></div>
            <div><p className="text-xs text-gray-400">{s.label}</p><p className="text-sm font-bold text-gray-900 capitalize">{s.value}</p></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Current Session */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4"><Monitor size={16} className="text-blue-600" /><h3 className="font-semibold text-gray-900">Current Active Session</h3></div>
            <div className="border border-agri-green bg-green-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Monitor size={16} className="text-agri-green" />
                  <span className="font-medium text-sm text-gray-900">{currentSession.device}</span>
                  <span className="text-xs text-agri-green bg-green-100 px-2 py-0.5 rounded-full">● Current Session</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div><p className="text-gray-400">User</p><p className="font-medium text-gray-700">{user?.full_name}</p></div>
                <div><p className="text-gray-400">Email</p><p className="font-medium text-gray-700 truncate">{user?.email}</p></div>
                <div><p className="text-gray-400">Role</p><p className="font-medium text-gray-700 capitalize">{user?.role}</p></div>
                <div><p className="text-gray-400">Last Login</p><p className="font-medium text-gray-700">{currentSession.loginTime}</p></div>
                <div><p className="text-gray-400">Location</p><p className="font-medium text-gray-700">{currentSession.location}</p></div>
                <div><p className="text-gray-400">Status</p><p className="font-medium text-green-600">Active</p></div>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4"><Lock size={16} className="text-blue-600" /><h3 className="font-semibold text-gray-900">Change Password</h3></div>
            <div className="space-y-4">
              {[
                { label: 'Current Password', key: 'current', placeholder: 'Enter current password' },
                { label: 'New Password (min 8 characters)', key: 'new_password', placeholder: 'Enter new password' },
                { label: 'Confirm New Password', key: 'confirm', placeholder: 'Re-enter new password' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm text-gray-600 mb-1">{f.label}</label>
                  <input type="password" className="input-field" placeholder={f.placeholder}
                    value={(passwords as any)[f.key]}
                    onChange={e => setPasswords(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <button onClick={handlePwChange} disabled={pwMutation.isPending}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {pwMutation.isPending ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>

          {/* Account Info */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4"><Activity size={16} className="text-agri-green" /><h3 className="font-semibold text-gray-900">Account Information</h3></div>
            <div className="space-y-3">
              {[
                { label: 'Account Created', value: (user as any)?.created_at ? new Date((user as any).created_at).toLocaleString() : '—' },
                { label: 'Last Login', value: (user as any)?.last_login ? new Date((user as any).last_login).toLocaleString() : '—' },
                { label: 'Account Status', value: (user as any)?.status || 'active' },
                { label: 'Account ID', value: user?.id?.slice(0, 12).toUpperCase() + '...' || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start gap-3 border-l-2 border-gray-100 pl-3">
                  <div>
                    <p className="text-xs font-medium text-gray-700">{label}</p>
                    <p className="text-xs text-gray-500 capitalize">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Security Alerts */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3"><AlertTriangle size={16} className="text-orange-500" /><h3 className="font-semibold text-gray-900">Security Notices</h3></div>
            <div className="space-y-2">
              {(user as any)?.is_verified ? (
                <div className="border rounded-lg p-3 text-xs bg-green-50 border-green-200 text-green-800">
                  <p className="font-medium">✓ Account Verified</p>
                  <p className="opacity-70 mt-0.5">Your identity has been verified</p>
                </div>
              ) : (
                <div className="border rounded-lg p-3 text-xs bg-orange-50 border-orange-200 text-orange-800">
                  <p className="font-medium">⚠ Account Pending Verification</p>
                  <p className="opacity-70 mt-0.5">Admin will verify your account</p>
                </div>
              )}
              <div className="border rounded-lg p-3 text-xs bg-blue-50 border-blue-200 text-blue-800">
                <p className="font-medium">ℹ Active Session</p>
                <p className="opacity-70 mt-0.5">You have 1 active session</p>
              </div>
            </div>
          </div>

          {/* Session Settings */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4"><Lock size={16} className="text-gray-600" /><h3 className="font-semibold text-gray-900">Session Settings</h3></div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Session Timeout</label>
                <select className="input-field" value={timeout_} onChange={e => setTimeout_(e.target.value)}>
                  <option>15 minutes</option><option>30 minutes</option><option>1 hour</option><option>2 hours</option>
                </select>
              </div>
              <button onClick={() => toast.success('Settings saved')} className="w-full bg-agri-green text-white py-2.5 rounded-xl text-sm font-medium hover:bg-agri-lightgreen">Save Settings</button>
              <button onClick={handleLogoutAll} className="w-full border border-red-300 text-red-600 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50">Logout All Devices</button>
            </div>
          </div>

          {/* Tips */}
          <div className="card bg-blue-50 border-blue-100">
            <div className="flex items-center gap-2 mb-2"><Shield size={14} className="text-blue-600" /><p className="text-sm font-semibold text-blue-800">Security Tips</p></div>
            {['Never share your password with anyone', 'Use a strong password with numbers and symbols', 'Log out when using shared computers', 'Contact admin if you notice suspicious activity'].map(tip => (
              <p key={tip} className="text-xs text-blue-700 mb-1">• {tip}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
