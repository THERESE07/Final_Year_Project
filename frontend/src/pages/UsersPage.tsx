import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { usersAPI } from '../api/client';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  active: 'badge-active', pending: 'badge-pending',
  rejected: 'badge-rejected', suspended: 'badge-suspended'
};

const UsersPage: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, role, status],
    queryFn: () => usersAPI.getAll({ page, limit: 10, search, role, status }).then(r => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => usersAPI.updateStatus(id, status),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: () => toast.error('Failed to update status'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">Manage farmers, cooperatives and system users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input-field pl-9" placeholder="Search by name, email or phone..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input-field w-full sm:w-40" value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            <option value="farmer">Farmer</option>
            <option value="cooperative">Cooperative</option>
            <option value="admin">Admin</option>
          </select>
          <select className="input-field w-full sm:w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Contact</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Cooperative</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Registered</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No users found</td></tr>
              ) : data?.data?.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-agri-green rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user.full_name?.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    <div>{user.email}</div>
                    <div className="text-xs">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">{user.role}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{user.cooperative_name || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={statusColors[user.status] || 'badge-pending'}>{user.status}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.status === 'pending' && (
                        <>
                          <button title="Approve"
                            onClick={() => statusMutation.mutate({ id: user.id, status: 'active' })}
                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50">
                            <CheckCircle size={16} />
                          </button>
                          <button title="Reject"
                            onClick={() => statusMutation.mutate({ id: user.id, status: 'rejected' })}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50">
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      {user.status === 'active' && (
                        <button title="Suspend"
                          onClick={() => statusMutation.mutate({ id: user.id, status: 'suspended' })}
                          className="text-yellow-600 hover:text-yellow-800 p-1 rounded hover:bg-yellow-50">
                          <Clock size={16} />
                        </button>
                      )}
                      {user.status === 'suspended' && (
                        <button title="Reactivate"
                          onClick={() => statusMutation.mutate({ id: user.id, status: 'active' })}
                          className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50">
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"><Eye size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <p className="text-gray-500">
              Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, data.pagination.total)} of {data.pagination.total}
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
              <button disabled={page >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
