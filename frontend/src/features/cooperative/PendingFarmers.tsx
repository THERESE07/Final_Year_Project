import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, CheckCircle, XCircle, Users } from 'lucide-react';
import { cooperativesAPI } from '../../api/client';
import { QueryErrorBanner, FormField } from '../../components/common';
import toast from 'react-hot-toast';

export default function PendingFarmers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [reviewTarget, setReviewTarget] = useState<any>(null);
  const [feedback, setFeedback] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['pending-farmers', search],
    queryFn: () => cooperativesAPI.getPendingFarmers({ search: search || undefined, limit: 20 }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ userId, action, feedback: fb }: { userId: string; action: 'approve' | 'reject'; feedback: string }) =>
      cooperativesAPI.reviewFarmer(userId, { action, feedback: fb }),
    onSuccess: (_, vars) => {
      toast.success(`Farmer ${vars.action === 'approve' ? 'approved' : 'rejected'}`);
      qc.invalidateQueries({ queryKey: ['pending-farmers'] });
      setReviewTarget(null);
      setFeedback('');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Action failed'),
  });

  const farmers = (data as any)?.data || [];

  const submitReview = (action: 'approve' | 'reject') => {
    if (!feedback.trim()) { toast.error('Feedback is required'); return; }
    reviewMutation.mutate({ userId: reviewTarget.id, action, feedback: feedback.trim() });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Pending Farmers</h1>
        <p className="page-subtitle">Review farmer registrations — feedback is required for every decision</p>
      </div>

      {isError && <QueryErrorBanner onRetry={refetch} />}

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input-field pl-9" placeholder="Search farmers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>{['Farmer', 'Contact', 'Location', 'Farm Details', 'Submitted', 'Actions'].map(h => (
                <th key={h} className="table-th">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {isLoading ? Array(4).fill(0).map((_, i) => (
                <tr key={i}>{Array(6).fill(0).map((_, j) => (
                  <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                ))}</tr>
              )) : farmers.length === 0 ? (
                <tr><td colSpan={6} className="table-td text-center py-12 text-gray-400">
                  <Users size={32} className="mx-auto mb-2 opacity-30" /><p>No pending farmers</p>
                </td></tr>
              ) : farmers.map((u: any) => (
                <tr key={u.id} className="table-tr">
                  <td className="table-td">
                    <p className="font-medium">{u.full_name}</p>
                    <p className="text-xs text-gray-400">ID: {u.national_id}</p>
                  </td>
                  <td className="table-td text-xs"><p>{u.phone}</p><p className="text-gray-400">{u.email}</p></td>
                  <td className="table-td text-xs text-gray-500">
                    {[u.farmer_profile?.sector, u.farmer_profile?.district, u.farmer_profile?.province].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="table-td text-xs text-gray-500">
                    {u.farmer_profile?.farm_size_hectares ? `${u.farmer_profile.farm_size_hectares} ha` : '—'}
                  </td>
                  <td className="table-td text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="table-td">
                    <button onClick={() => { setReviewTarget(u); setFeedback(''); }}
                      className="text-xs btn-primary py-1.5 px-3">Review</button>
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
            <h3 className="text-lg font-bold mb-2">Review: {reviewTarget.full_name}</h3>
            <p className="text-sm text-gray-500 mb-4">{reviewTarget.email}</p>
            <FormField label="Feedback *">
              <textarea className="input-field" rows={4} value={feedback} onChange={e => setFeedback(e.target.value)}
                placeholder="Required — provide approval or rejection feedback for the applicant" />
            </FormField>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setReviewTarget(null)} className="btn-secondary flex-1 py-2.5">Cancel</button>
              <button onClick={() => submitReview('reject')} className="flex-1 py-2.5 border border-red-200 text-red-600 rounded-xl">Reject</button>
              <button onClick={() => submitReview('approve')} className="btn-primary flex-1 py-2.5">Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
