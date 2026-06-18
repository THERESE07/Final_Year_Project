import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, Search } from 'lucide-react';
import { inputRequestsAPI, inputsAPI } from '../../api/client';
import { QueryErrorBanner, FormField } from '../../components/common';
import toast from 'react-hot-toast';

const statusBadge = (s: string) => ({
  pending: 'badge-pending',
  fulfilled: 'badge-active',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
}[s] || 'bg-gray-100 text-gray-600');

export default function FarmerInputRequests() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ input_id: '', quantity: '', reason: '', season: 'Season B' });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['farmer-input-requests'],
    queryFn: () => inputRequestsAPI.getAll({ limit: 20 }),
  });

  const { data: inputsData } = useQuery({
    queryKey: ['inputs-for-request'],
    queryFn: () => inputsAPI.getAll({ limit: 50 }),
    enabled: showModal,
  });

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => inputRequestsAPI.create(d),
    onSuccess: () => {
      toast.success('Input request submitted');
      qc.invalidateQueries({ queryKey: ['farmer-input-requests'] });
      setShowModal(false);
      setForm({ input_id: '', quantity: '', reason: '', season: 'Season B' });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to submit request'),
  });

  const requests = (data as any)?.data || [];
  const inputs = (inputsData as any)?.data || [];

  const handleSubmit = () => {
    if (!form.input_id || !form.quantity) {
      toast.error('Select an input and enter quantity');
      return;
    }
    createMutation.mutate({
      input_id: form.input_id,
      quantity: parseFloat(form.quantity),
      reason: form.reason || undefined,
      season: form.season,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Input Requests</h1>
          <p className="page-subtitle">Request agricultural inputs from your cooperative leader</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Request
        </button>
      </div>

      {isError && <QueryErrorBanner onRetry={refetch} />}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>{['Input', 'Quantity', 'Season', 'Reason', 'Submitted', 'Status'].map(h => (
                <th key={h} className="table-th">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {isLoading ? Array(3).fill(0).map((_, i) => (
                <tr key={i}>{Array(6).fill(0).map((_, j) => (
                  <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                ))}</tr>
              )) : requests.length === 0 ? (
                <tr><td colSpan={6} className="table-td text-center py-12 text-gray-400">
                  <Package size={32} className="mx-auto mb-2 opacity-30" /><p>No input requests yet</p>
                </td></tr>
              ) : requests.map((r: any) => (
                <tr key={r.id} className="table-tr">
                  <td className="table-td font-medium">{r.input?.name || '—'}</td>
                  <td className="table-td">{r.quantity} {r.input?.unit}</td>
                  <td className="table-td text-gray-500">{r.season || '—'}</td>
                  <td className="table-td text-gray-500 text-xs max-w-xs truncate">{r.reason || '—'}</td>
                  <td className="table-td text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="table-td">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(r.status)}`}>
                      {r.status === 'fulfilled' ? 'Approved' : r.status?.charAt(0).toUpperCase() + r.status?.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">New Input Request</h3>
            <div className="space-y-4">
              <FormField label="Select Input *">
                <select className="input-field" value={form.input_id} onChange={e => setForm(p => ({ ...p, input_id: e.target.value }))}>
                  <option value="">Choose input...</option>
                  {inputs.map((i: any) => (
                    <option key={i.id} value={i.id}>{i.name} — Stock: {i.stock_quantity} {i.unit}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Quantity *">
                <input type="number" min="0.1" step="0.1" className="input-field" value={form.quantity}
                  onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
              </FormField>
              <FormField label="Season">
                <input className="input-field" value={form.season} onChange={e => setForm(p => ({ ...p, season: e.target.value }))} />
              </FormField>
              <FormField label="Reason (optional)">
                <textarea className="input-field" rows={3} value={form.reason}
                  onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Why do you need this input?" />
              </FormField>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 py-2.5">Cancel</button>
              <button onClick={handleSubmit} disabled={createMutation.isPending} className="btn-primary flex-1 py-2.5">
                {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
