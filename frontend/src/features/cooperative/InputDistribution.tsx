import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, X, Package } from 'lucide-react';
import { inputsAPI, allocationsAPI } from '../../api/client';
import { QueryErrorBanner, FormField } from '../../components/common';
import { parsePayload, distributionPayloadSchema } from '../../utils/schemas';
import toast from 'react-hot-toast';

const statusBadge = (s: string) => ({
  distributed: 'badge-active', pending: 'badge-pending', approved: 'badge-approved', cancelled: 'badge-rejected',
}[s] || 'bg-gray-100 text-gray-600');

export default function InputDistribution() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'inventory' | 'tracking'>('inventory');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [form, setForm] = useState({
    farmer_id: '', input_id: '', quantity: '',
    distribution_date: new Date().toISOString().split('T')[0], season: 'Season B', notes: '',
  });
  const [requestForm, setRequestForm] = useState({ input_id: '', requested_quantity: '', reason: '' });

  const { data: inventoryData, isLoading: invLoading } = useQuery({
    queryKey: ['coop-inventory'],
    queryFn: () => allocationsAPI.getInventory(),
    enabled: tab === 'inventory' || showModal,
  });

  const { data: distData, isLoading: distLoading } = useQuery({
    queryKey: ['distributions-list', page],
    queryFn: () => inputsAPI.getDistributions({ page, limit: 10 }),
    enabled: tab === 'tracking',
  });

  const { data: farmersData, isLoading: farmersLoading, isError: farmersError, refetch: refetchFarmers } = useQuery({
    queryKey: ['distribution-farmers'],
    queryFn: () => inputsAPI.getDistributionFarmers(),
    enabled: showModal,
  });

  const { data: catalogData } = useQuery({
    queryKey: ['inputs-catalog-request'],
    queryFn: () => inputsAPI.getAll({ limit: 50 }),
    enabled: showRequestModal,
  });

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => inputsAPI.createDistribution(d),
    onSuccess: () => {
      toast.success('Input distributed to farmer');
      qc.invalidateQueries({ queryKey: ['distributions-list'] });
      qc.invalidateQueries({ queryKey: ['coop-inventory'] });
      setShowModal(false);
      setForm({ farmer_id: '', input_id: '', quantity: '', distribution_date: new Date().toISOString().split('T')[0], season: 'Season B', notes: '' });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const requestMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => allocationsAPI.createRequest(d),
    onSuccess: () => {
      toast.success('Request submitted to admin');
      setShowRequestModal(false);
      setRequestForm({ input_id: '', requested_quantity: '', reason: '' });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const inventory: Array<any> = (inventoryData as any[]) || [];
  const distributions = (distData as any)?.data || [];
  const pagination = (distData as any)?.pagination;
  const farmers: Array<{ farmer_id: string; full_name: string; farmer_code?: string }> = (farmersData as any[]) || [];
  const catalog = (catalogData as any)?.data || [];

  const selectedInv = inventory.find(i => i.input_id === form.input_id);
  const remaining = selectedInv?.remaining_quantity ?? 0;

  const handleCreate = () => {
    const parsed = parsePayload(distributionPayloadSchema, {
      farmer_id: form.farmer_id,
      input_id: form.input_id,
      quantity: parseFloat(form.quantity),
      distribution_date: form.distribution_date,
      season: form.season,
      notes: form.notes || undefined,
    });
    if (!parsed.success) { toast.error(parsed.message); return; }
    if (parseFloat(form.quantity) > remaining) {
      toast.error(`Cannot distribute more than remaining stock (${remaining})`);
      return;
    }
    createMutation.mutate(parsed.data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Input Distribution</h1>
          <p className="page-subtitle">Manage cooperative inventory and distribute inputs to farmers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRequestModal(true)} className="btn-secondary flex items-center gap-2 text-sm">
            Request from Admin
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Distribution
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['inventory', 'tracking'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-agri-green text-white' : 'text-gray-600'}`}>
            {t === 'inventory' ? 'Input Inventory' : 'Distribution Tracking'}
          </button>
        ))}
      </div>

      {tab === 'inventory' ? (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>{['Input Name', 'Category', 'Allocated', 'Distributed', 'Remaining', 'Allocation Date'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {invLoading ? Array(4).fill(0).map((_, i) => (
                  <tr key={i}>{Array(6).fill(0).map((_, j) => (
                    <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                )) : inventory.length === 0 ? (
                  <tr><td colSpan={6} className="table-td text-center py-12 text-gray-400">
                    <Package size={32} className="mx-auto mb-2 opacity-30" /><p>No inputs allocated to your cooperative yet</p>
                  </td></tr>
                ) : inventory.map((i: any) => (
                  <tr key={i.allocation_id} className="table-tr">
                    <td className="table-td font-medium">{i.input_name}</td>
                    <td className="table-td text-gray-500">{i.category || '—'}</td>
                    <td className="table-td">{i.allocated_quantity} {i.unit}</td>
                    <td className="table-td">{i.distributed_quantity} {i.unit}</td>
                    <td className="table-td font-medium text-agri-green">{i.remaining_quantity} {i.unit}</td>
                    <td className="table-td text-xs text-gray-500">{i.allocation_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>{['Farmer', 'Input', 'Quantity', 'Date', 'Cooperative', 'Status'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {distLoading ? Array(5).fill(0).map((_, i) => (
                  <tr key={i}>{Array(6).fill(0).map((_, j) => (
                    <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                )) : distributions.length === 0 ? (
                  <tr><td colSpan={6} className="table-td text-center py-12 text-gray-400">No distributions yet</td></tr>
                ) : distributions.map((d: any) => (
                  <tr key={d.id} className="table-tr">
                    <td className="table-td font-medium">{d.farmer?.user?.full_name || '—'}</td>
                    <td className="table-td">{d.input?.name || '—'}</td>
                    <td className="table-td">{d.quantity} {d.input?.unit}</td>
                    <td className="table-td text-xs text-gray-500">{d.distribution_date}</td>
                    <td className="table-td text-xs text-gray-500">{d.cooperative?.name || '—'}</td>
                    <td className="table-td"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge(d.status)}`}>{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && (
            <div className="px-5 py-4 border-t flex items-center justify-between text-sm">
              <p className="text-gray-400">{distributions.length} of {pagination.total}</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Prev</button>
                <button disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-lg">Distribute to Farmer</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              {farmersError && <QueryErrorBanner onRetry={() => refetchFarmers()} />}
              <FormField label="Farmer *">
                <select className="input-field" value={form.farmer_id} onChange={e => setForm(p => ({ ...p, farmer_id: e.target.value }))} disabled={farmersLoading}>
                  <option value="">{farmersLoading ? 'Loading...' : 'Select farmer'}</option>
                  {farmers.map(f => <option key={f.farmer_id} value={f.farmer_id}>{f.full_name}{f.farmer_code ? ` (${f.farmer_code})` : ''}</option>)}
                </select>
              </FormField>
              <FormField label="Input *">
                <select className="input-field" value={form.input_id} onChange={e => setForm(p => ({ ...p, input_id: e.target.value }))}>
                  <option value="">Select from cooperative inventory</option>
                  {inventory.filter(i => i.remaining_quantity > 0).map(i => (
                    <option key={i.input_id} value={i.input_id}>{i.input_name} — {i.remaining_quantity} {i.unit} remaining</option>
                  ))}
                </select>
              </FormField>
              {selectedInv && <p className="text-xs text-gray-500">Available: {remaining} {selectedInv.unit}</p>}
              <FormField label="Quantity *">
                <input type="number" className="input-field" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
              </FormField>
              <FormField label="Distribution Date">
                <input type="date" className="input-field" value={form.distribution_date} onChange={e => setForm(p => ({ ...p, distribution_date: e.target.value }))} />
              </FormField>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 py-2.5">Cancel</button>
                <button onClick={handleCreate} disabled={!form.farmer_id || !form.input_id || !form.quantity || createMutation.isPending}
                  className="btn-primary flex-1 py-2.5">{createMutation.isPending ? 'Distributing...' : 'Distribute'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-4">Request Inputs from Admin</h2>
            <div className="space-y-4">
              <FormField label="Input *">
                <select className="input-field" value={requestForm.input_id} onChange={e => setRequestForm(p => ({ ...p, input_id: e.target.value }))}>
                  <option value="">Select input</option>
                  {catalog.map((i: any) => <option key={i.id} value={i.id}>{i.name} (National stock: {i.stock_quantity} {i.unit})</option>)}
                </select>
              </FormField>
              <FormField label="Requested Quantity *">
                <input type="number" className="input-field" value={requestForm.requested_quantity}
                  onChange={e => setRequestForm(p => ({ ...p, requested_quantity: e.target.value }))} />
              </FormField>
              <FormField label="Reason">
                <textarea className="input-field" rows={2} value={requestForm.reason}
                  onChange={e => setRequestForm(p => ({ ...p, reason: e.target.value }))} />
              </FormField>
              <div className="flex gap-3">
                <button onClick={() => setShowRequestModal(false)} className="btn-secondary flex-1 py-2.5">Cancel</button>
                <button onClick={() => requestMutation.mutate({
                  input_id: requestForm.input_id,
                  requested_quantity: parseFloat(requestForm.requested_quantity),
                  reason: requestForm.reason || undefined,
                })} disabled={!requestForm.input_id || !requestForm.requested_quantity || requestMutation.isPending}
                  className="btn-primary flex-1 py-2.5">Submit Request</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
