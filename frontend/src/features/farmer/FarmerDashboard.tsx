import React from 'react';
import { Package, DollarSign, Calendar, Bell, MapPin, Building2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFarmerDashboard, useNotifications } from '../../hooks';
import { QueryErrorBanner } from '../../components/common';
import { CURRENT_SEASON, SEASON_END } from '../../constants';

const statusBadge = (s: string) => ({
  distributed: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700', disbursed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-500',
}[s?.toLowerCase()] || 'bg-gray-100 text-gray-600');

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const FarmerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { stats, distributions, applications, isLoading, isError, refetch } = useFarmerDashboard();
  const { notifications, unreadCount } = useNotifications(5);

  const profile = user;

  if (isLoading) return (
    <div className="space-y-6">
      <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-3 gap-4">{Array(3).fill(0).map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {isError && <QueryErrorBanner onRetry={() => refetch()} />}
      {/* Profile Banner */}
      <div className="bg-agri-green rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{profile?.full_name || 'Welcome'}</h2>
            <p className="text-green-200 text-sm">Farmer · {profile?.email}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-green-100">
              <span className="flex items-center gap-1"><Building2 size={14} /> {profile?.farmer_profile?.cooperative?.name || 'No cooperative assigned'}</span>
              {profile?.created_at && <span className="flex items-center gap-1"><Calendar size={14} /> Since {new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>}
            </div>
          </div>
          <div className="text-right hidden sm:block flex-shrink-0">
            <p className="text-green-200 text-xs">Location</p>
            <p className="font-semibold flex items-center gap-1 justify-end">
              <MapPin size={14} />
              {profile?.farmer_profile?.district || '—'}, {profile?.farmer_profile?.province || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0"><Package size={22} className="text-agri-green" /></div>
          <div>
            <p className="text-sm text-gray-500">Total Inputs</p>
            <p className="text-2xl font-bold text-gray-900">{parseInt(stats.total_inputs) || 0}</p>
            <p className="text-xs text-gray-400">{parseInt(stats.received_inputs) || 0} received · {parseInt(stats.pending_inputs) || 0} pending</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0"><DollarSign size={22} className="text-blue-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Total Subsidies</p>
            <p className="text-2xl font-bold text-gray-900">
              {parseFloat(stats.total_subsidy_amount) > 0
                ? `RWF ${(parseFloat(stats.total_subsidy_amount) / 1000).toFixed(0)}K`
                : 'RWF 0'}
            </p>
            <p className="text-xs text-gray-400">{parseInt(stats.total_applications) || 0} applications · {parseInt(stats.disbursed_applications) || 0} disbursed</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0"><TrendingUp size={22} className="text-orange-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Active Season</p>
            <p className="text-2xl font-bold text-gray-900">{CURRENT_SEASON}</p>
            <p className="text-xs text-gray-400">Season ends {SEASON_END}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* My Inputs */}
        <div className="xl:col-span-2 card p-0 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">My Allocated Inputs</h3>
            <Link to="/farmer/inputs" className="text-xs text-agri-green hover:underline">View All →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Input Name', 'Quantity', 'Supplier', 'Date', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {distributions.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                    <Package size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No inputs allocated yet</p>
                    <p className="text-xs mt-1">Your inputs will appear here once distributed</p>
                  </td></tr>
                ) : distributions.slice(0, 5).map((d: any) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{d.input_name}</td>
                    <td className="px-5 py-3 text-gray-600">{d.quantity} {d.unit}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{d.supplier || '—'}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{d.distribution_date || 'Pending'}</td>
                    <td className="px-5 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge(d.status)}`}>{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && <span className="bg-agri-green text-white text-xs px-2 py-0.5 rounded-full">{unreadCount} new</span>}
          </div>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : notifications.map((n: any) => (
              <div key={n.id} className={`p-3 rounded-xl text-sm ${!n.is_read ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <p className="text-gray-800 font-medium leading-snug text-xs">{n.title}</p>
                <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-gray-400 text-xs mt-1">{timeAgo(n.created_at)}</p>
              </div>
            ))}
          </div>
          <Link to="/farmer/notifications" className="block text-center text-agri-green text-sm mt-4 hover:underline">View All Notifications</Link>
        </div>
      </div>

      {/* Subsidy Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">My Subsidy Applications</h3>
          <Link to="/farmer/subsidies" className="text-xs text-agri-green hover:underline">View All →</Link>
        </div>
        {applications.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <DollarSign size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No subsidy applications yet</p>
            <Link to="/farmer/subsidies" className="inline-block mt-3 btn-primary text-sm px-5 py-2">Apply for Subsidy</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {applications.slice(0, 3).map((a: any) => (
              <div key={a.id} className="border border-gray-100 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-700 mb-2 truncate">{a.program_name}</p>
                <p className="text-lg font-bold text-gray-900">RWF {parseFloat(a.approved_amount || a.requested_amount).toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">{a.disbursement_date ? new Date(a.disbursement_date).toLocaleDateString() : a.reviewed_at ? new Date(a.reviewed_at).toLocaleDateString() : 'Processing'}</p>
                <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full font-medium ${statusBadge(a.status)}`}>{a.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerDashboard;
