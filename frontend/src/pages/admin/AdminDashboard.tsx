import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Building2, Package, DollarSign, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { analyticsAPI, usersAPI } from '../../api/client';
import toast from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const { data: dashData, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => analyticsAPI.adminDashboard(),
    refetchInterval: 30000,
  });

  const { data: pendingUsers } = useQuery({
    queryKey: ['pending-users'],
    queryFn: () => usersAPI.getAll({ status: 'pending', limit: '5' }),
  });

  const stats = (dashData as any)?.data?.stats || {};
  const activities = (dashData as any)?.data?.recent_activities || [];

  const handleApprove = async (userId: string) => {
    try {
      await usersAPI.updateStatus(userId, 'active');
      toast.success('User approved');
    } catch { toast.error('Failed to approve user'); }
  };

  const handleReject = async (userId: string) => {
    try {
      await usersAPI.updateStatus(userId, 'rejected');
      toast.error('User rejected');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Administrator Dashboard</h1><p className="page-subtitle">Real-time overview of the AgriSubsidy system</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Farmers', value: isLoading ? '...' : stats.total_farmers?.toLocaleString() || '0', icon: Users, color: 'text-agri-green', bg: 'bg-green-100' },
          { label: 'Cooperatives', value: isLoading ? '...' : stats.total_cooperatives?.toLocaleString() || '0', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Active Inputs', value: isLoading ? '...' : stats.total_active_inputs?.toLocaleString() || '0', icon: Package, color: 'text-orange-500', bg: 'bg-orange-100' },
          { label: 'Total Subsidies (RWF)', value: isLoading ? '...' : `${((stats.total_subsidies_rwf || 0) / 1e6).toFixed(1)}M`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Distributed (tons)', value: isLoading ? '...' : (stats.total_distributed_tons || 0).toFixed(1), icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Pending Actions', value: isLoading ? '...' : ((stats.pending_users || 0) + (stats.pending_applications || 0)).toString(), icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center mb-3`}><s.icon size={22} className={s.color} /></div>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Low stock alert */}
      {stats.pending_users > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800">{stats.pending_users} user{stats.pending_users !== 1 ? 's' : ''} awaiting approval</p>
            <Link to="/admin/user-approval" className="text-xs text-yellow-700 underline">Review now →</Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Recent System Activities</h3>
          {activities.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No recent activities</p>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 6).map((a: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.actor}</p>
                    <p className="text-xs text-gray-500">{a.action}</p>
                    <p className="text-xs text-gray-400">{new Date(a.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Pending Approvals</h3>
          {(pendingUsers as any)?.data?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No pending approvals</p>
          ) : (
            <div className="space-y-3">
              {((pendingUsers as any)?.data || []).map((u: any) => (
                <div key={u.id} className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div><p className="font-medium text-sm text-gray-800">{u.full_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{u.role.replace('_', ' ')}</p></div>
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Pending</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(u.id)} className="flex-1 bg-agri-green text-white text-xs py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-agri-lightgreen">
                      <CheckCircle size={11} /> Approve
                    </button>
                    <button onClick={() => handleReject(u.id)} className="flex-1 border border-gray-300 text-gray-600 text-xs py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-gray-50">
                      <XCircle size={11} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[{ label: 'Approve Users', path: '/admin/user-approval' }, { label: 'Register Cooperative', path: '/admin/cooperative-management' }, { label: 'Manage Inputs', path: '/admin/input-catalog' }, { label: 'View Analytics', path: '/admin/analytics-reports' }].map((a, i) => (
            <Link key={i} to={a.path} className="border-2 border-gray-200 rounded-xl p-4 text-center text-sm font-medium text-gray-700 hover:border-agri-green hover:bg-green-50 hover:text-agri-green transition-colors">{a.label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
