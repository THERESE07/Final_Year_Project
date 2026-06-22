import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Package } from 'lucide-react';
import { inputRequestsAPI, allocationsAPI } from '../../api/client';
import { QueryErrorBanner, FormField } from '../../components/common';
import toast from 'react-hot-toast';

const statusBadge = (s: string) => ({
  pending: 'badge-pending', fulfilled: 'badge-active', rejected: 'badge-rejected',
}[s] || 'bg-gray-100 text-gray-600');

export default function InputRequests() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [reviewTarget, setReviewTarget] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [quantity, setQuantity] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['coop-input-requests', statusFilter],
    queryFn: () => inputRequestsAPI.getAll({ status: statusFilter || undefined, limit: 20 }),
  });

  const { data: inventoryData, isLoading: inventoryLoading, refetch: refetchInventory } = useQuery({
    queryKey: ['coop-inventory'],
    queryFn: () => allocationsAPI.getInventory(),
    enabled: !!reviewTarget,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, feedback: fb, quantity: qty }: {
      id: string; action: 'approve' | 'reject'; feedback: string; quantity?: number;
    }) => inputRequestsAPI.review(id, { action, feedback: fb, quantity: qty }),
    onSuccess: (_, vars) => {
      toast.success(`Request ${vars.action === 'approve' ? 'approved' : 'rejected'}`);
      qc.invalidateQueries({ queryKey: ['coop-input-requests'] });
      qc.invalidateQueries({ queryKey: ['coop-inventory'] });
      closeReview();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Action failed'),
  });

  const inventory: any[] = Array.isArray(inventoryData) ? inventoryData : (inventoryData as any)?.data || [];
  const reviewInputId = reviewTarget?.input_id || reviewTarget?.input?.id;
  const coopStock = reviewTarget
    ? inventory.find((i: any) => i.input_id === reviewInputId)
    : null;

  const requests = ((data as any)?.data || []).filter((r: any) =>
    !search || r.farmer?.user?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const closeReview = () => {
    setReviewTarget(null);
    setFeedback('');
    setQuantity('');
  };

  const openReview = (request: any) => {
    setReviewTarget(request);
    setQuantity(String(request.quantity));
    setFeedback('');
  };

  useEffect(() => {
    if (reviewTarget) refetchInventory();
  }, [reviewTarget, refetchInventory]);

  const submitReview = (action: 'approve' | 'reject') => {
    if (!feedback.trim()) { toast.error('Feedback is required'); return; }
    if (action === 'approve') {
      const qty = parseFloat(quantity);
      if (!quantity || isNaN(qty) || qty <= 0) {
        toast.error('Enter a valid quantity to allocate');
        return;
      }
      if (coopStock && qty > coopStock.remaining_quantity) {
        toast.error(`Insufficient cooperative stock. Remaining: ${coopStock.remaining_quantity} ${coopStock.unit}`);
        return;
      }
      reviewMutation.mutate({
        id: reviewTarget.id,
        action,
        feedback: feedback.trim(),
        quantity: qty,
      });
    } else {
      reviewMutation.mutate({ id: reviewTarget.id, action, feedback: feedback.trim() });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Input Requests</h1>
        <p className="page-subtitle">Review farmer input requests — adjust quantity and provide feedback</p>
      </div>

      {isError && <QueryErrorBanner onRetry={refetch} />}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search by farmer name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="fulfilled">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>{['Farmer', 'Input', 'Quantity', 'Reason', 'Submitted', 'Status', 'Actions'].map(h => (
                <th key={h} className="table-th">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {isLoading ? Array(4).fill(0).map((_, i) => (
                <tr key={i}>{Array(7).fill(0).map((_, j) => (
                  <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                ))}</tr>
              )) : requests.length === 0 ? (
                <tr><td colSpan={7} className="table-td text-center py-12 text-gray-400">
                  <Package size={32} className="mx-auto mb-2 opacity-30" /><p>No requests found</p>
                </td></tr>
              ) : requests.map((r: any) => (
                <tr key={r.id} className="table-tr">
                  <td className="table-td">
                    <p className="font-medium">{r.farmer?.user?.full_name || '—'}</p>
                    <p className="text-xs text-gray-400">{r.farmer?.user?.phone}</p>
                  </td>
                  <td className="table-td">{r.input?.name || '—'}</td>
                  <td className="table-td">{r.quantity} {r.input?.unit}</td>
                  <td className="table-td text-xs text-gray-500 max-w-[120px] truncate">{r.reason || '—'}</td>
                  <td className="table-td text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="table-td">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(r.status)}`}>
                      {r.status === 'fulfilled' ? 'Approved' : r.status?.charAt(0).toUpperCase() + r.status?.slice(1)}
                    </span>
                  </td>
                  <td className="table-td">
                    {r.status === 'pending' && (
                      <button onClick={() => openReview(r)} className="text-xs btn-primary py-1 px-3">Review</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-2">Review Input Request</h3>
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1 mb-4">
              <p><span className="text-gray-500">Farmer:</span> <strong>{reviewTarget.farmer?.user?.full_name}</strong></p>
              <p><span className="text-gray-500">Input:</span> {reviewTarget.input?.name}</p>
              <p>
                <span className="text-gray-500">Requested:</span>{' '}
                {parseFloat(reviewTarget.quantity).toLocaleString()} {reviewTarget.input?.unit}
              </p>
              {reviewTarget.reason && (
                <p><span className="text-gray-500">Reason:</span> {reviewTarget.reason}</p>
              )}
              {inventoryLoading ? (
                <p className="text-gray-500">Loading cooperative inventory...</p>
              ) : coopStock ? (
                <>
                  <p className="text-orange-600">
                    <span className="text-gray-500">Allocated to cooperative:</span>{' '}
                    {parseFloat(String(coopStock.allocated_quantity)).toLocaleString()} {coopStock.unit}
                  </p>
                  <p className="text-orange-600">
                    <span className="text-gray-500">Remaining stock:</span>{' '}
                    {parseFloat(String(coopStock.remaining_quantity)).toLocaleString()} {coopStock.unit}
                  </p>
                </>
              ) : (
                <p className="text-red-600">No cooperative stock allocated for this input</p>
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
                placeholder={`Default: ${reviewTarget.quantity} ${reviewTarget.input?.unit}`}
              />
              <p className="text-xs text-gray-400 mt-1">
                You may allocate a different quantity than the farmer requested
              </p>
            </FormField>

            <FormField label="Feedback *">
              <textarea className="input-field" rows={4} value={feedback} onChange={e => setFeedback(e.target.value)}
                placeholder="Required — explain your decision to the farmer" />
            </FormField>

            <div className="flex gap-3 mt-4">
              <button onClick={closeReview} className="btn-secondary flex-1 py-2.5">Cancel</button>
              <button onClick={() => submitReview('reject')} className="flex-1 py-2.5 border border-red-200 text-red-600 rounded-xl">Reject</button>
              <button
                onClick={() => submitReview('approve')}
                disabled={reviewMutation.isPending || inventoryLoading || !coopStock}
                className="btn-primary flex-1 py-2.5 disabled:opacity-50"
              >
                {reviewMutation.isPending ? 'Processing...' : 'Approve & Allocate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
