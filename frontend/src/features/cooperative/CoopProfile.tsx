import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, MapPin, Phone, Mail, Users, Edit3, Save, X } from 'lucide-react';
import { analyticsAPI, cooperativesAPI, authAPI } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const CoopProfile: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [showPw, setShowPw] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new_password: '', confirm: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['coop-profile'],
    queryFn: () => analyticsAPI.cooperativeDashboard(),
  });

  const coop = (data as any)?.data?.cooperative;
  const stats = (data as any)?.data?.stats || {};

  const updateMutation = useMutation({
    mutationFn: (d: any) => cooperativesAPI.update(coop?.id, d),
    onSuccess: () => { toast.success('Cooperative updated'); setEditing(false); qc.invalidateQueries({ queryKey: ['coop-profile'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update'),
  });

  const pwMutation = useMutation({
    mutationFn: () => authAPI.changePassword({ current_password: passwords.current, new_password: passwords.new_password }),
    onSuccess: () => { toast.success('Password updated'); setPasswords({ current: '', new_password: '', confirm: '' }); setShowPw(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const startEdit = () => {
    setEditForm({
      name: coop?.name || '',
      description: coop?.description || '',
      contact_phone: coop?.contact_phone || '',
      contact_email: coop?.contact_email || '',
      sector: coop?.sector || '',
    });
    setEditing(true);
  };

  const handlePwSubmit = () => {
    if (passwords.new_password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (passwords.new_password !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    pwMutation.mutate();
  };

  if (isLoading) return <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />;

  if (!coop) return (
    <div className="card text-center py-16">
      <Building2 size={48} className="mx-auto mb-3 text-gray-300" />
      <p className="text-gray-500">No cooperative found for your account.</p>
      <p className="text-xs text-gray-400 mt-1">Please contact administrator.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Cooperative Profile</h1><p className="text-sm text-gray-500">Manage your cooperative information</p></div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Cooperative Info */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Cooperative Information</h3>
              {!editing ? (
                <button onClick={startEdit} className="flex items-center gap-2 btn-primary px-4 py-2 text-sm"><Edit3 size={14} />Edit</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="flex items-center gap-1 border border-gray-300 text-gray-600 px-3 py-2 rounded-xl text-sm"><X size={14} />Cancel</button>
                  <button onClick={() => updateMutation.mutate(editForm)} disabled={updateMutation.isPending} className="flex items-center gap-1 btn-primary px-3 py-2 text-sm"><Save size={14} />{updateMutation.isPending ? 'Saving...' : 'Save'}</button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Building2 size={28} className="text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{coop.name}</p>
                {coop.registration_number && <p className="text-sm text-gray-500">Reg: {coop.registration_number}</p>}
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${coop.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{coop.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Cooperative Name', key: 'name', editable: true },
                { label: 'Registration Number', value: coop.registration_number || '—', editable: false },
                { label: 'Province', value: coop.province, editable: false },
                { label: 'District', value: coop.district, editable: false },
                { label: 'Sector', key: 'sector', editable: true },
                { label: 'Established Year', value: coop.established_year || '—', editable: false },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                  {editing && f.editable && f.key ? (
                    <input className="input-field" value={editForm[f.key] || ''} onChange={e => setEditForm((p: any) => ({ ...p, [f.key!]: e.target.value }))} />
                  ) : (
                    <div className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-gray-50">{f.key ? (coop as any)[f.key] || '—' : f.value}</div>
                  )}
                </div>
              ))}

              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                {editing ? (
                  <textarea rows={3} className="input-field resize-none" value={editForm.description || ''} onChange={e => setEditForm((p: any) => ({ ...p, description: e.target.value }))} />
                ) : (
                  <div className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-gray-50">{coop.description || '—'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Contact Person', value: coop.contact_person || user?.full_name || '—', icon: Users, key: null },
                { label: 'Contact Phone', value: coop.contact_phone || '—', icon: Phone, key: 'contact_phone' },
                { label: 'Contact Email', value: coop.contact_email || user?.email || '—', icon: Mail, key: 'contact_email' },
                { label: 'Location', value: [coop.sector, coop.district, coop.province].filter(Boolean).join(', '), icon: MapPin, key: null },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                  {editing && f.key ? (
                    <input className="input-field" value={editForm[f.key] || ''} onChange={e => setEditForm((p: any) => ({ ...p, [f.key!]: e.target.value }))} />
                  ) : (
                    <div className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-gray-50 flex items-center gap-2">
                      <f.icon size={14} className="text-gray-400 flex-shrink-0" />{f.value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Change Password */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Account Security</h3>
              <button onClick={() => setShowPw(p => !p)} className="text-sm text-agri-green hover:underline">{showPw ? 'Cancel' : 'Change Password'}</button>
            </div>
            {showPw ? (
              <div className="space-y-4">
                {[{ l: 'Current Password', k: 'current' }, { l: 'New Password', k: 'new_password' }, { l: 'Confirm Password', k: 'confirm' }].map(f => (
                  <div key={f.k}>
                    <label className="block text-sm text-gray-600 mb-1">{f.l}</label>
                    <input type="password" className="input-field" value={(passwords as any)[f.k]} onChange={e => setPasswords(p => ({ ...p, [f.k]: e.target.value }))} />
                  </div>
                ))}
                <button onClick={handlePwSubmit} disabled={pwMutation.isPending} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {pwMutation.isPending ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            ) : <p className="text-sm text-gray-400">Click "Change Password" to update your account password</p>}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Cooperative Statistics</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Farmers', value: parseInt(stats.total_farmers) || 0, color: 'text-agri-green' },
                { label: 'Distributed (kg)', value: parseFloat(stats.total_distributed_kg || 0).toFixed(1), color: 'text-blue-600' },
                { label: 'Distributed Value (RWF)', value: parseFloat(stats.total_distributed_value || 0).toLocaleString(), color: 'text-orange-600' },
                { label: 'Pending Distributions', value: parseInt(stats.pending_distributions) || 0, color: 'text-yellow-600' },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">My Account</h3>
            <div className="space-y-2 text-sm">
              <div><p className="text-xs text-gray-400">Logged in as</p><p className="font-medium text-gray-800">{user?.full_name}</p></div>
              <div><p className="text-xs text-gray-400">Email</p><p className="text-gray-600">{user?.email}</p></div>
              <div><p className="text-xs text-gray-400">Last Login</p><p className="text-gray-600">{(user as any)?.last_login ? new Date((user as any).last_login).toLocaleString() : '—'}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoopProfile;
