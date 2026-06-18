import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { usersAPI } from '../../api/client';
import toast from 'react-hot-toast';

const statusStyle: Record<string,string> = {
  pending:'bg-yellow-100 text-yellow-700', active:'bg-green-100 text-green-700',
  rejected:'bg-red-100 text-red-700', suspended:'bg-gray-100 text-gray-600'
};

export default function UserApproval() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['users-approval', page, search, statusFilter],
    queryFn: () => usersAPI.getAll({ page, limit: 10, search: search || undefined, status: statusFilter || undefined }),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => usersAPI.updateStatus(id, status),
    onSuccess: (_, vars) => {
      toast.success(`User ${vars.status === 'active' ? 'approved' : 'rejected'}`);
      qc.invalidateQueries({ queryKey: ['users-approval'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: () => toast.error('Action failed'),
  });

  const users = (data as any)?.data || [];
  const pagination = (data as any)?.pagination;
  const total = pagination?.total || 0;
  const pending = users.filter((u:any) => u.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">User Approval Management</h1><p className="page-subtitle">Review and approve user registrations</p></div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: total, bg: 'bg-white' },
          { label: 'Pending Review', value: users.filter((u:any) => u.status==='pending').length, bg: 'bg-orange-50 border-orange-200' },
          { label: 'Approved', value: users.filter((u:any) => u.status==='active').length, bg: 'bg-green-50 border-green-200' },
          { label: 'Rejected', value: users.filter((u:any) => u.status==='rejected').length, bg: 'bg-red-50 border-red-200' },
        ].map((s,i) => <div key={i} className={`card border ${s.bg}`}><p className="text-xs text-gray-500">{s.label}</p><p className="text-3xl font-bold">{s.value}</p></div>)}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field pl-9" placeholder="Search by name, email, phone..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></div>
        <select className="input-field w-40" value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1);}}>
          <option value="">All Status</option><option value="pending">Pending</option><option value="active">Approved</option><option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header"><tr>
              {['App ID','Full Name','Role','Contact','Location','Submitted','Status','Actions'].map(h=><th key={h} className="table-th">{h}</th>)}
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
                  <td className="table-td text-xs text-gray-500">{u.farmer_profile?.district||'—'}, {u.farmer_profile?.province||'—'}</td>
                  <td className="table-td text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="table-td"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle[u.status]||'bg-gray-100 text-gray-600'}`}>{u.status}</span></td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      {u.status==='pending'&&<><button title="Approve" onClick={()=>mutation.mutate({id:u.id,status:'active'})} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><CheckCircle size={15}/></button><button title="Reject" onClick={()=>mutation.mutate({id:u.id,status:'rejected'})} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><XCircle size={15}/></button></>}
                      {u.status==='active'&&<button title="Suspend" onClick={()=>mutation.mutate({id:u.id,status:'suspended'})} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg"><Clock size={15}/></button>}
                      {u.status==='suspended'&&<button title="Reactivate" onClick={()=>mutation.mutate({id:u.id,status:'active'})} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><CheckCircle size={15}/></button>}
                      <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><Eye size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination&&<div className="px-5 py-4 border-t flex items-center justify-between text-sm"><p className="text-gray-400">Showing {users.length} of {pagination.total}</p><div className="flex gap-2"><button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button><button disabled={!pagination.hasNext} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button></div></div>}
      </div>
    </div>
  );
}
