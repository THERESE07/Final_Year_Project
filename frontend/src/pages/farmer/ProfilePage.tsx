import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Lock, Activity, Edit3, Save, X } from 'lucide-react';
import { authAPI, analyticsAPI } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', gender: '' });
  const [passwords, setPasswords] = useState({ current: '', new_password: '', confirm: '' });
  const [showPwSection, setShowPwSection] = useState(false);

  const { data: dashData } = useQuery({
    queryKey: ['farmer-dashboard-profile'],
    queryFn: () => analyticsAPI.farmerDashboard(),
  });
  const stats = (dashData as any)?.data?.stats || {};

  const pwMutation = useMutation({
    mutationFn: () => authAPI.changePassword({
      current_password: passwords.current,
      new_password: passwords.new_password,
    }),
    onSuccess: () => {
      toast.success('Password updated successfully');
      setPasswords({ current: '', new_password: '', confirm: '' });
      setShowPwSection(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update password'),
  });

  const handlePwSubmit = () => {
    if (!passwords.current) { toast.error('Enter your current password'); return; }
    if (passwords.new_password.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (passwords.new_password !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    pwMutation.mutate();
  };

  const startEdit = () => {
    setEditForm({ full_name: user?.full_name || '', phone: user?.phone || '', gender: (user as any)?.gender || '' });
    setEditing(true);
  };

  const fields = [
    { label: 'Full Name', value: user?.full_name || '—' },
    { label: 'National ID', value: (user as any)?.national_id || '—' },
    { label: 'Email Address', value: user?.email || '—' },
    { label: 'Phone Number', value: (user as any)?.phone || '—' },
    { label: 'Gender', value: (user as any)?.gender || '—' },
    { label: 'Role', value: user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || '—' },
    { label: 'Cooperative', value: (user as any)?.farmer_profile?.cooperative?.name || '—' },
    { label: 'Farm Location', value: [(user as any)?.farmer_profile?.district, (user as any)?.farmer_profile?.province].filter(Boolean).join(', ') || '—' },
    { label: 'Farm Size', value: (user as any)?.farmer_profile?.farm_size_hectares ? `${(user as any).farmer_profile.farm_size_hectares} hectares` : '—' },
    { label: 'Crop Types', value: (user as any)?.farmer_profile?.crop_types?.join(', ') || '—' },
    { label: 'Member Since', value: user?.created_at ? new Date((user as any).created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '—' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500">View and manage your personal information</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Personal Information</h3>
              {!editing ? (
                <button onClick={startEdit} className="flex items-center gap-2 btn-primary px-4 py-2 text-sm"><Edit3 size={14} />Edit Profile</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="flex items-center gap-1 border border-gray-300 text-gray-600 px-3 py-2 rounded-xl text-sm hover:bg-gray-50"><X size={14} />Cancel</button>
                  <button onClick={() => { toast.success('Profile update coming soon'); setEditing(false); }} className="flex items-center gap-1 btn-primary px-3 py-2 text-sm"><Save size={14} />Save</button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-agri-green text-2xl font-bold">{user?.full_name?.charAt(0) || 'U'}</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{user?.full_name || '—'}</p>
                <p className="text-sm text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${(user as any)?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>{(user as any)?.status || 'active'}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map(f => (
                <div key={f.label}>
                  <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                  {editing && ['Full Name', 'Phone Number'].includes(f.label) ? (
                    <input className="input-field" defaultValue={f.value === '—' ? '' : f.value}
                      onChange={e => setEditForm(p => ({ ...p, [f.label === 'Full Name' ? 'full_name' : 'phone']: e.target.value }))} />
                  ) : (
                    <div className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-gray-50">{f.value}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Change Password */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Lock size={18} className="text-blue-600" /><h3 className="font-semibold text-gray-900">Change Password</h3></div>
              <button onClick={() => setShowPwSection(p => !p)} className="text-sm text-agri-green hover:underline">{showPwSection ? 'Cancel' : 'Change'}</button>
            </div>
            {showPwSection && (
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
                <button onClick={handlePwSubmit} disabled={pwMutation.isPending}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {pwMutation.isPending ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            )}
            {!showPwSection && <p className="text-sm text-gray-400">Click "Change" to update your password</p>}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Account Summary</h3>
            <div className="space-y-3">
              <div><p className="text-xs text-gray-400">Account Status</p><span className={`inline-block mt-1 text-xs px-2.5 py-1 rounded-full font-medium ${(user as any)?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>{(user as any)?.status || 'Active'}</span></div>
              <div><p className="text-xs text-gray-400">Verification</p><span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">{(user as any)?.is_verified ? 'Verified' : 'Pending'}</span></div>
              <div><p className="text-xs text-gray-400">Last Login</p><p className="text-sm text-gray-700 mt-0.5">{(user as any)?.last_login ? new Date((user as any).last_login).toLocaleString() : '—'}</p></div>
              <div><p className="text-xs text-gray-400">Member Since</p><p className="text-sm text-gray-700 mt-0.5">{(user as any)?.created_at ? new Date((user as any).created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '—'}</p></div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Farming Summary</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Inputs', value: parseInt(stats.total_inputs) || 0 },
                { label: 'Received Inputs', value: parseInt(stats.received_inputs) || 0 },
                { label: 'Total Subsidy (RWF)', value: parseFloat(stats.total_subsidy_amount || 0).toLocaleString() },
                { label: 'Applications', value: parseInt(stats.total_applications) || 0 },
              ].map(s => (
                <div key={s.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{s.label}</span>
                  <span className="font-medium text-gray-800">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card bg-orange-50 border-orange-100">
            <div className="flex items-center gap-2 mb-2"><Activity size={14} className="text-orange-600" /><p className="text-sm font-medium text-orange-800">Security Tip</p></div>
            <p className="text-xs text-orange-700">Never share your password or PIN with anyone including AGRIFOP staff.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
