import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, CheckCircle, XCircle, Clock, X, FileText, ExternalLink } from 'lucide-react';
import { usersAPI } from '../../api/client';
import { QueryErrorBanner } from '../../components/common';
import { STATUS_BADGE } from '../../constants';
import toast from 'react-hot-toast';

const API_ORIGIN = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/api\/v1\/?$/, '');

const statusStyle: Record<string, string> = {
  ...STATUS_BADGE,
  pending: 'bg-yellow-100 text-yellow-700',
};

const formatStatus = (s: string) => s.replace(/_/g, ' ');

export default function UserApproval() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending_admin_approval');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [feedback, setFeedback] = useState('');

  const { data: statsData, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['users-approval-stats'],
    queryFn: () => usersAPI.getApprovalStats(),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['users-approval', page, search, statusFilter],
    queryFn: () => usersAPI.getAll({ page, limit: 10, search: search || undefined, status: statusFilter || undefined }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, feedback: fb }: { id: string; action: 'approve' | 'reject'; feedback?: string }) =>
      usersAPI.review(id, { action, feedback: fb }),
    onSuccess: (_, vars) => {
      toast.success(`User ${vars.action === 'approve' ? 'approved' : 'rejected'}`);
      qc.invalidateQueries({ queryKey: ['users-approval'] });
      qc.invalidateQueries({ queryKey: ['users-approval-stats'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setSelectedUser(null);
      setFeedback('');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Action failed'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => usersAPI.updateStatus(id, status),
    onSuccess: (_, vars) => {
      toast.success(`User ${vars.status === 'active' ? 'approved' : 'updated'}`);
      qc.invalidateQueries({ queryKey: ['users-approval'] });
      qc.invalidateQueries({ queryKey: ['users-approval-stats'] });
    },
    onError: () => toast.error('Action failed'),
  });

  const stats = (statsData as {
    total_applications?: number;
    total_approved?: number;
    total_rejected?: number;
    total_pending?: number;
  }) || { total_applications: 0, total_approved: 0, total_rejected: 0, total_pending: 0 };
  const users = (data as any)?.data || [];
  const pagination = (data as any)?.pagination;

  const isPendingReview = (u: any) =>
    ['pending', 'pending_admin_approval'].includes(u.status);

  const openReview = async (u: any) => {
    try {
      const detail = await usersAPI.getById(u.id);
      setSelectedUser(detail);
      setFeedback('');
    } catch {
      setSelectedUser(u);
    }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">User Approval Management</h1><p className="page-subtitle">Review cooperative leader applications and documents</p></div>

      {(statsError || isError) && (
        <QueryErrorBanner onRetry={() => { refetchStats(); refetch(); }} />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: statsLoading ? '...' : stats.total_applications, bg: 'bg-white' },
          { label: 'Pending Review', value: statsLoading ? '...' : stats.total_pending, bg: 'bg-orange-50 border-orange-200' },
          { label: 'Approved', value: statsLoading ? '...' : stats.total_approved, bg: 'bg-green-50 border-green-200' },
          { label: 'Rejected', value: statsLoading ? '...' : stats.total_rejected, bg: 'bg-red-50 border-red-200' },
        ].map((s, i) => (
          <div key={i} className={`card border ${s.bg}`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-3xl font-bold ${statsLoading ? 'animate-pulse' : ''}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field pl-9" placeholder="Search by name, email, phone..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></div>
        <select className="input-field w-48" value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1);}}>
          <option value="">All Status</option>
          <option value="pending_admin_approval">Pending Admin</option>
          <option value="pending">Pending (Legacy)</option>
          <option value="active">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header"><tr>
              {['App ID','Full Name','Role','Contact','Cooperative','Submitted','Status','Actions'].map(h=><th key={h} className="table-th">{h}</th>)}
            </tr></thead>
            <tbody>
              {isLoading ? Array(5).fill(0).map((_,i)=><tr key={i}>{Array(8).fill(0).map((_,j)=><td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse"/></td>)}</tr>)
              : users.length===0 ? <tr><td colSpan={8} className="table-td text-center py-12 text-gray-400">No users found</td></tr>
              : users.map((u:any)=>(
                <tr key={u.id} className="table-tr">
                  <td className="table-td text-agri-green font-medium text-xs">REG-{u.id.slice(0,6).toUpperCase()}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-agri-green font-bold text-xs flex-shrink-0">{u.full_name?.charAt(0)}</div>
                      <div><p className="font-medium text-gray-800">{u.full_name}</p><p className="text-xs text-gray-400">ID: {u.national_id}</p></div>
                    </div>
                  </td>
                  <td className="table-td capitalize text-gray-600">{u.role?.replace('_',' ')}</td>
                  <td className="table-td text-xs"><p>{u.phone}</p><p className="text-gray-400">{u.email}</p></td>
                  <td className="table-td text-xs text-gray-500">
                    {u.registration_cooperative?.name || u.farmer_profile?.cooperative?.name || '—'}
                  </td>
                  <td className="table-td text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="table-td"><span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusStyle[u.status]||'bg-gray-100 text-gray-600'}`}>{formatStatus(u.status)}</span></td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      {isPendingReview(u) && (
                        <button title="Review" onClick={() => openReview(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={15}/></button>
                      )}
                      {u.status==='active'&&<button title="Suspend" onClick={()=>statusMutation.mutate({id:u.id,status:'suspended'})} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg"><Clock size={15}/></button>}
                      {u.status==='suspended'&&<button title="Reactivate" onClick={()=>statusMutation.mutate({id:u.id,status:'active'})} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><CheckCircle size={15}/></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination&&<div className="px-5 py-4 border-t flex items-center justify-between text-sm"><p className="text-gray-400">Showing {users.length} of {pagination.total}</p><div className="flex gap-2"><button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button><button disabled={!pagination.hasNext} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button></div></div>}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Review Application</h3>
              <button onClick={() => setSelectedUser(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <div className="space-y-3 text-sm mb-4">
              <p><span className="text-gray-500">Name:</span> <strong>{selectedUser.full_name}</strong></p>
              <p><span className="text-gray-500">Role:</span> {selectedUser.role}</p>
              <p><span className="text-gray-500">Email:</span> {selectedUser.email}</p>
              {selectedUser.registration_cooperative && (
                <p><span className="text-gray-500">Cooperative:</span> {selectedUser.registration_cooperative.name}</p>
              )}
            </div>
            {selectedUser.documents?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Uploaded Documents</p>
                <div className="space-y-2">
                  {selectedUser.documents.map((doc: any) => (
                    <a key={doc.id} href={`${API_ORIGIN}${doc.file_path}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 text-sm">
                      <FileText size={16} className="text-agri-green"/>
                      <span className="flex-1 capitalize">{doc.document_type.replace(/_/g, ' ')}</span>
                      <ExternalLink size={14} className="text-gray-400"/>
                    </a>
                  ))}
                </div>
              </div>
            )}
            <textarea className="input-field mb-4" rows={3} placeholder="Required — provide feedback for the applicant"
              value={feedback} onChange={e => setFeedback(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setSelectedUser(null)} className="btn-secondary flex-1 py-2.5">Cancel</button>
              <button onClick={() => { if (!feedback.trim()) { toast.error('Feedback is required'); return; } reviewMutation.mutate({ id: selectedUser.id, action: 'reject', feedback: feedback.trim() }); }}
                className="flex-1 py-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50">Reject</button>
              <button onClick={() => { if (!feedback.trim()) { toast.error('Feedback is required'); return; } reviewMutation.mutate({ id: selectedUser.id, action: 'approve', feedback: feedback.trim() }); }}
                className="btn-primary flex-1 py-2.5">Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
