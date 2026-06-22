import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, DollarSign, Package, Info, Check } from 'lucide-react';
import { useNotifications } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingRows, QueryErrorBanner } from '../../components/common';
import { getNotificationRoute } from '../../utils/notificationRoutes';
import { Notification } from '../../types';

const typeIcon = (type: string) => {
  const map: Record<string,{icon:any,color:string,bg:string}> = {
    subsidy:{icon:DollarSign,color:'text-green-600',bg:'bg-green-100'},
    input:{icon:Package,color:'text-blue-600',bg:'bg-blue-100'},
    success:{icon:Check,color:'text-green-600',bg:'bg-green-50'},
    warning:{icon:Info,color:'text-orange-500',bg:'bg-orange-100'},
    info:{icon:Info,color:'text-blue-500',bg:'bg-blue-50'},
  };
  return map[type]||map['info'];
};

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff/60000);
  if (m<60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h<24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'all'|'unread'|'read'>('all');
  const { notifications, unreadCount, isLoading, isError, refetch, markRead, markAllRead } = useNotifications(30, tab);

  const filtered = tab==='all' ? notifications : tab==='unread' ? notifications.filter(n=>!n.is_read) : notifications.filter(n=>n.is_read);

  const handleNotificationClick = (n: Notification) => {
    const route = getNotificationRoute(user?.role, n);
    if (!n.is_read) markRead.mutate(n.id);
    if (route) navigate(route);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Notifications</h1><p className="page-subtitle">Stay updated with system activities and alerts</p></div>
        {unreadCount>0&&<button onClick={()=>markAllRead.mutate()} disabled={markAllRead.isPending} className="btn-secondary text-sm flex items-center gap-2"><CheckCheck size={15}/>Mark All Read</button>}
      </div>

      {isError && <QueryErrorBanner onRetry={() => refetch()} />}

      <div className="flex gap-2">
        {(['all','unread','read'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize ${tab===t?'bg-agri-green text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t}{t==='unread'&&unreadCount>0?` (${unreadCount})`:''}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <table className="w-full"><tbody><LoadingRows cols={1} rows={5} /></tbody></table>
        ) : filtered.length===0 ? (
          <div className="text-center py-16 text-gray-400"><Bell size={40} className="mx-auto mb-3 opacity-30"/><p>No notifications</p></div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(n=>{
              const ti = typeIcon(n.type || '');
              const Icon = ti.icon;
              const route = getNotificationRoute(user?.role, n);
              return (
                <div
                  key={n.id}
                  role={route ? 'button' : undefined}
                  tabIndex={route ? 0 : undefined}
                  onClick={() => route && handleNotificationClick(n)}
                  onKeyDown={e => route && e.key === 'Enter' && handleNotificationClick(n)}
                  className={`px-5 py-4 flex items-start gap-4 hover:bg-gray-50 ${!n.is_read?'bg-blue-50/30':''} ${route ? 'cursor-pointer' : ''}`}
                >
                  <div className={`w-10 h-10 ${ti.bg} rounded-xl flex items-center justify-center flex-shrink-0`}><Icon size={18} className={ti.color}/></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!n.is_read?'font-semibold text-gray-900':'text-gray-700'}`}>{n.title}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    {route && <p className="text-xs text-agri-green mt-1">Click to view →</p>}
                    {!n.is_read && !route && (
                      <button onClick={e => { e.stopPropagation(); markRead.mutate(n.id); }} disabled={markRead.isPending} className="text-xs text-agri-green mt-2 hover:underline">Mark as read</button>
                    )}
                  </div>
                  {!n.is_read&&<div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"/>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Notification Preferences</h3>
        <p className="text-xs text-gray-400 mb-4">Preferences are managed by your account settings. Contact admin for SMS/email configuration.</p>
        {['Input distribution alerts','Subsidy status updates','System announcements'].map(pref=>(
          <label key={pref} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
            <input type="checkbox" defaultChecked className="rounded text-agri-green"/>
            <span className="text-sm text-gray-700">{pref}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
