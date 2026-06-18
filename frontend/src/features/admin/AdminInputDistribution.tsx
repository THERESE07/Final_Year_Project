import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, Package, ClipboardList, Plus } from 'lucide-react';
import { allocationsAPI, inputsAPI, cooperativesAPI } from '../../api/client';
import { FormField } from '../../components/common';
import toast from 'react-hot-toast';

const statusBadge = (s: string) => ({
  active: 'badge-active',
  approved: 'badge-approved',
  pending: 'badge-pending',
  rejected: 'badge-rejected',
  depleted: 'bg-gray-100 text-gray-600',
}[s] || 'bg-gray-100 text-gray-600');

export default function AdminInputDistribution() {
  const qc = useQueryClient();
  const [requestFilter, setRequestFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [reviewTarget, setReviewTarget] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [quantity, setQuantity] = useState('');
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [directCoopId, setDirectCoopId] = useState('');
  const [directInputId, setDirectInputId] = useState('');
  const [directQuantity, setDirectQuantity] = useState('');
  const [directNotes, setDirectNotes] = useState('');

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['admin-allocation-requests', requestFilter],
    queryFn: () => allocationsAPI.getRequests({ status: requestFilter || undefined, limit: 100 }),
  });

  const { data: allocationsData, isLoading: allocationsLoading } = useQuery({
    queryKey: ['admin-allocations'],
    queryFn: () => allocationsAPI.getAllocations({ limit: 50 }),
  });

  const { data: catalogData } = useQuery({
    queryKey: ['inputs-national-stock'],
    queryFn: () => inputsAPI.getAll({ limit: 100 }),
    enabled: !!reviewTarget || showDirectModal,
  });

  const { data: coopsData } = useQuery({
    queryKey: ['coops-for-allocation'],
    queryFn: () => cooperativesAPI.getAll({ limit: 100 }),
    enabled: showDirectModal,
  });

  const reviewMutation = useMutation({
    mutationFn: (d: { id: string; action: 'approve' | 'reject'; feedback: string; quantity?: number }) =>
      allocationsAPI.reviewRequest(d.id, { action: d.action, feedback: d.feedback, quantity: d.quantity }),
    onSuccess: (_, v) => {
      toast.success(`Request ${v.action === 'approve' ? 'approved' : 'rejected'}`);
      qc.invalidateQueries({ queryKey: ['admin-allocations'] });
      qc.invalidateQueries({ queryKey: ['admin-allocation-requests'] });
      closeReview();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const directMutation = useMutation({
    mutationFn: (d: { cooperative_id: string; input_id: string; quantity: number; notes: string }) =>
      allocationsAPI.createAllocation(d),
    onSuccess: () => {
      toast.success('Inputs allocated to cooperative');
      qc.invalidateQueries({ queryKey: ['admin-allocations'] });
      qc.invalidateQueries({ queryKey: ['inputs-national-stock'] });
      closeDirectModal();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const closeReview = () => {
    setReviewTarget(null);
    setFeedback('');
    setQuantity('');
  };

  const closeDirectModal = () => {
    setShowDirectModal(false);
    setDirectCoopId('');
    setDirectInputId('');
    setDirectQuantity('');
    setDirectNotes('');
  };

  const openReview = (request: any) => {
    setReviewTarget(request);
    setQuantity(String(request.requested_quantity));
    setFeedback('');
  };

  const requests = ((requestsData as any)?.data || []).filter((r: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.cooperative?.name?.toLowerCase().includes(q) ||
      r.input?.name?.toLowerCase().includes(q)
    );
  });

  const allocations = (allocationsData as any)?.data || [];
  const catalog = (catalogData as any)?.data || [];
  const cooperatives = (coopsData as any)?.data || [];
  const nationalStock = reviewTarget
    ? catalog.find((i: any) => i.id === reviewTarget.input_id)
    : null;
  const selectedDirectInput = catalog.find((i: any) => i.id === directInputId);

  const handleReview = (action: 'approve' | 'reject') => {
    if (!feedback.trim()) {
      toast.error('Feedback is required');
      return;
    }
    if (action === 'approve') {
      const qty = parseFloat(quantity);
      if (!quantity || isNaN(qty) || qty <= 0) {
        toast.error('Enter a valid quantity to allocate');
        return;
      }
      if (nationalStock && qty > parseFloat(nationalStock.stock_quantity)) {
        toast.error(`Insufficient national stock. Available: ${nationalStock.stock_quantity} ${nationalStock.unit}`);
        return;
      }
      reviewMutation.mutate({
        id: reviewTarget.id,
        action,
        feedback: feedback.trim(),
        quantity: qty,
      });
    } else {
      reviewMutation.mutate({
        id: reviewTarget.id,
        action,
        feedback: feedback.trim(),
      });
    }
  };

  const handleDirectAllocate = () => {
    if (!directCoopId) { toast.error('Select a cooperative'); return; }
    if (!directInputId) { toast.error('Select an input'); return; }
    if (!directNotes.trim()) { toast.error('Feedback is required'); return; }
    const qty = parseFloat(directQuantity);
    if (!directQuantity || isNaN(qty) || qty <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    if (selectedDirectInput && qty > parseFloat(selectedDirectInput.stock_quantity)) {
      toast.error(`Insufficient national stock. Available: ${selectedDirectInput.stock_quantity} ${selectedDirectInput.unit}`);
      return;
    }
    directMutation.mutate({
      cooperative_id: directCoopId,
      input_id: directInputId,
      quantity: qty,
      notes: directNotes.trim(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Input Distribution Management</h1>
          <p className="page-subtitle">Review cooperative requests and track allocations to cooperatives</p>
        </div>
        <button onClick={() => setShowDirectModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Distribution
        </button>
      </div>

      {/* ── Distribution Requests ── */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-agri-green" />
            <h3 className="font-semibold">Cooperative Distribution Requests</h3>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input-field pl-8 py-1.5 text-sm w-48"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input-field py-1.5 text-sm w-36"
              value={requestFilter}
              onChange={e => setRequestFilter(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="">All</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                {['Request ID', 'Cooperative', 'Input', 'Requested Qty', 'Reason', 'Submitted', 'Status', 'Actions'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requestsLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-td text-center py-12 text-gray-400">
                    <Package size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No {requestFilter || ''} requests found</p>
                  </td>
                </tr>
              ) : (
                requests.map((r: any) => (
                  <tr key={r.id} className="table-tr">
                    <td className="table-td text-xs font-mono text-agri-green">
                      REQ-{r.id.slice(0, 6).toUpperCase()}
                    </td>
                    <td className="table-td font-medium">{r.cooperative?.name || '—'}</td>
                    <td className="table-td">{r.input?.name || '—'}</td>
                    <td className="table-td">
                      {parseFloat(r.requested_quantity).toLocaleString()} {r.input?.unit}
                    </td>
                    <td className="table-td text-xs text-gray-500 max-w-[140px] truncate">
                      {r.reason || '—'}
                    </td>
                    <td className="table-td text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="table-td">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="table-td">
                      {r.status === 'pending' ? (
                        <button
                          onClick={() => openReview(r)}
                          className="text-xs btn-primary py-1.5 px-3"
                        >
                          Review
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400" title={r.feedback || ''}>
                          {r.feedback ? r.feedback.slice(0, 30) + (r.feedback.length > 30 ? '…' : '') : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Allocation Tracking ── */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="font-semibold">Distribution Tracking (Cooperative Level)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                {['Cooperative', 'Input', 'Category', 'Allocated', 'Distributed', 'Remaining', 'Status', 'Date'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allocationsLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : allocations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-td text-center py-12 text-gray-400">
                    <p>No cooperative allocations yet</p>
                  </td>
                </tr>
              ) : (
                allocations.map((a: any) => (
                  <tr key={a.id} className="table-tr">
                    <td className="table-td font-medium">{a.cooperative?.name || '—'}</td>
                    <td className="table-td">{a.input?.name || '—'}</td>
                    <td className="table-td text-gray-500">{a.input?.category?.name || '—'}</td>
                    <td className="table-td">
                      {parseFloat(a.allocated_quantity).toLocaleString()} {a.input?.unit}
                    </td>
                    <td className="table-td">
                      {parseFloat(a.distributed_quantity || 0).toLocaleString()} {a.input?.unit}
                    </td>
                    <td className="table-td font-medium text-agri-green">
                      {parseFloat(a.quantity_remaining ?? (a.allocated_quantity - a.distributed_quantity)).toLocaleString()} {a.input?.unit}
                    </td>
                    <td className="table-td">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="table-td text-xs text-gray-500">{a.allocation_date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Review Modal ── */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-lg">Review Distribution Request</h2>
              <button onClick={closeReview}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                <p>
                  <span className="text-gray-500">Request ID:</span>{' '}
                  <span className="font-mono text-agri-green">REQ-{reviewTarget.id.slice(0, 6).toUpperCase()}</span>
                </p>
                <p><span className="text-gray-500">Cooperative:</span> <strong>{reviewTarget.cooperative?.name}</strong></p>
                <p><span className="text-gray-500">Input:</span> {reviewTarget.input?.name}</p>
                <p>
                  <span className="text-gray-500">Requested Quantity:</span>{' '}
                  {parseFloat(reviewTarget.requested_quantity).toLocaleString()} {reviewTarget.input?.unit}
                </p>
                {reviewTarget.reason && (
                  <p><span className="text-gray-500">Reason:</span> {reviewTarget.reason}</p>
                )}
                {nationalStock && (
                  <p className="text-orange-600">
                    <span className="text-gray-500">National stock available:</span>{' '}
                    {parseFloat(nationalStock.stock_quantity).toLocaleString()} {nationalStock.unit}
                  </p>
                )}
              </div>

              <FormField label="Quantity To Allocate *">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="input-field"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder={`Default: ${reviewTarget.requested_quantity} ${reviewTarget.input?.unit}`}
                />
                <p className="text-xs text-gray-400 mt-1">
                  You may allocate a different quantity than requested
                </p>
              </FormField>

              <FormField label="Feedback *">
                <textarea
                  className="input-field"
                  rows={4}
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Required — explain your approval or rejection decision to the cooperative leader"
                />
              </FormField>

              <div className="flex gap-3 pt-2">
                <button onClick={closeReview} className="btn-secondary flex-1 py-2.5">Cancel</button>
                <button
                  onClick={() => handleReview('reject')}
                  disabled={reviewMutation.isPending}
                  className="flex-1 py-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleReview('approve')}
                  disabled={reviewMutation.isPending}
                  className="btn-primary flex-1 py-2.5 disabled:opacity-50"
                >
                  {reviewMutation.isPending ? 'Processing...' : 'Approve & Allocate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Direct Allocation Modal ── */}
      {showDirectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-lg">New Distribution to Cooperative</h2>
              <button onClick={closeDirectModal}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">
                Allocate inputs directly to a cooperative without a prior request.
              </p>

              <FormField label="Cooperative *">
                <select
                  className="input-field"
                  value={directCoopId}
                  onChange={e => setDirectCoopId(e.target.value)}
                >
                  <option value="">Select cooperative</option>
                  {cooperatives.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.district}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Input *">
                <select
                  className="input-field"
                  value={directInputId}
                  onChange={e => setDirectInputId(e.target.value)}
                >
                  <option value="">Select input</option>
                  {catalog.filter((i: any) => i.is_active).map((i: any) => (
                    <option key={i.id} value={i.id}>
                      {i.name} — {parseFloat(i.stock_quantity).toLocaleString()} {i.unit} available
                    </option>
                  ))}
                </select>
              </FormField>

              {selectedDirectInput && (
                <div className="bg-orange-50 rounded-xl p-3 text-sm text-orange-700">
                  National stock available: {parseFloat(selectedDirectInput.stock_quantity).toLocaleString()} {selectedDirectInput.unit}
                </div>
              )}

              <FormField label="Quantity To Allocate *">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="input-field"
                  value={directQuantity}
                  onChange={e => setDirectQuantity(e.target.value)}
                  placeholder={selectedDirectInput ? `Max ${selectedDirectInput.stock_quantity} ${selectedDirectInput.unit}` : 'Enter quantity'}
                />
              </FormField>

              <FormField label="Feedback / Notes *">
                <textarea
                  className="input-field"
                  rows={4}
                  value={directNotes}
                  onChange={e => setDirectNotes(e.target.value)}
                  placeholder="Required — explain why this allocation is being made"
                />
              </FormField>

              <div className="flex gap-3 pt-2">
                <button onClick={closeDirectModal} className="btn-secondary flex-1 py-2.5">Cancel</button>
                <button
                  onClick={handleDirectAllocate}
                  disabled={directMutation.isPending}
                  className="btn-primary flex-1 py-2.5 disabled:opacity-50"
                >
                  {directMutation.isPending ? 'Allocating...' : 'Allocate to Cooperative'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
