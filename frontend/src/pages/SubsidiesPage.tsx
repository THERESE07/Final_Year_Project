import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, DollarSign, X, Users } from 'lucide-react';
import { subsidyAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const SubsidiesPage: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', type: 'cash', total_budget: '', season: '', start_date: '', end_date: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['subsidies', page, search, status],
    queryFn: () => subsidyAPI.getPrograms({ page, limit: 9, search, status }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => subsidyAPI.createProgram(data),
    onSuccess: () => { toast.success('Subsidy created'); qc.invalidateQueries({ queryKey: ['subsidies'] }); setShowModal(false); setForm({ name: '', description: '', type: 'cash', total_budget: '', season: '', start_date: '', end_date: '' }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const typeColors: Record<string, string> = {
    cash: 'bg-green-100 text-green-700', input: 'bg-blue-100 text-blue-700',
    voucher: 'bg-purple-100 text-purple-700', loan: 'bg-orange-100 text-orange-700'
  };

  const getProgress = (s: any) => {
    const pct = s.total_budget > 0 ? (s.disbursed_budget / s.total_budget) * 100 : 0;
    return Math.min(pct, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subsidy Management</h1>
          <p className="text-sm text-gray-500">Manage and track agricultural subsidy programs</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Subsidy
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input-field pl-9" placeholder="Search subsidies..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input-field w-full sm:w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="card h-48 animate-pulse bg-gray-100" />)}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <DollarSign size={48} className="mx-auto mb-3 opacity-30" />
          <p>No subsidies found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.data?.map((s: any) => (
            <div key={s.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{s.season || 'No season'}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${typeColors[s.type]}`}>{s.type}</span>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Disbursed</span>
                    <span>{getProgress(s).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-agri-green h-2 rounded-full transition-all" style={{ width: `${getProgress(s)}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-400">Budget</p>
                    <p className="font-semibold text-gray-700">{(s.total_budget / 1e6).toFixed(1)}M</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-gray-400">Allocated</p>
                    <p className="font-semibold text-agri-green">{(s.allocated_budget / 1e6).toFixed(1)}M</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-gray-400">Disbursed</p>
                    <p className="font-semibold text-blue-600">{(s.disbursed_budget / 1e6).toFixed(1)}M</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Users size={12} />
                  <span>{s.beneficiary_count} beneficiaries</span>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.status === 'active' ? 'badge-active' : 'badge-suspended'}`}>{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50 text-sm">Previous</button>
          <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {data.pagination.totalPages}</span>
          <button disabled={page >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50 text-sm">Next</button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-lg">Create New Subsidy</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subsidy Name *</label>
                <input className="input-field" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Season A Fertilizer Subsidy" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select className="input-field" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    <option value="cash">Cash</option>
                    <option value="input">Input</option>
                    <option value="voucher">Voucher</option>
                    <option value="loan">Loan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                  <select className="input-field" value={form.season} onChange={e => setForm(p => ({ ...p, season: e.target.value }))}>
                    <option value="">Select</option>
                    <option>Season A</option><option>Season B</option><option>Season C</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Budget (RWF) *</label>
                <input type="number" className="input-field" value={form.total_budget} onChange={e => setForm(p => ({ ...p, total_budget: e.target.value }))} placeholder="e.g., 5000000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" className="input-field" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" className="input-field" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} className="input-field resize-none" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe this subsidy program..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Cancel</button>
                <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="flex-1 btn-primary">
                  {createMutation.isPending ? 'Creating...' : 'Create Subsidy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubsidiesPage;
