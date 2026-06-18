import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Trash2, DollarSign, Package, Info, Check } from 'lucide-react';
import { notificationsAPI } from '../../api/client';
import toast from 'react-hot-toast';

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
  const qc = useQueryClient();
  const [tab, setTab] = useState<'all'|'unread'|'read'>('all');

  const { data } = useQuery({ queryKey: ['notifications-page', tab], queryFn: () => notificationsAPI.getAll({ limit: 30 }) });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => { toast.success('All marked as read'); qc.invalidateQueries({queryKey:['notifications-page']}); },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => notificationsAPI.markRead(id),
    onSuccess: () => qc.invalidateQueries({queryKey:['notifications-page']}),
  });

  const all = (data as any)?.data || [];
  const filtered = tab==='all' ? all : tab==='unread' ? all.filter((n:any)=>!n.is_read) : all.filter((n:any)=>n.is_read);
  const unreadCount = all.filter((n:any)=>!n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Notifications</h1><p className="page-subtitle">Stay updated with system activities and alerts</p></div>
        <div className="flex gap-2">
          <button onClick={()=>markAllMutation.mutate()} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50"><CheckCheck size={15}/>Mark all read</button>
        </div>
      </div>

      <div className="flex gap-2">
        {[{k:'all',l:`All (${all.length})`},{k:'unread',l:`Unread (${unreadCount})`,badge:unreadCount},{k:'read',l:`Read (${all.length-unreadCount})`}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k as any)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab===t.k?'bg-agri-green text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t.l}{t.badge&&tab!==t.k?<span className="bg-agri-green text-white text-xs px-1.5 py-0.5 rounded-full">{t.badge}</span>:null}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {filtered.length===0?<div className="py-16 text-center text-gray-400"><Bell size={40} className="mx-auto mb-3 opacity-30"/><p>No notifications</p></div>
          :filtered.map((n:any)=>{const {icon:Icon,color,bg}=typeIcon(n.type);return(
            <div key={n.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${!n.is_read?'bg-blue-50/30':''}`}>
              <div className={`w-9 h-9 ${bg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}><Icon size={16} className={color}/></div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${!n.is_read?'text-gray-900':'text-gray-700'}`}>{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <div className="flex gap-3 mt-1.5 items-center">
                  <span className="text-xs text-gray-400">{timeAgo(n.created_at)}</span>
                  {!n.is_read&&<button onClick={()=>markOneMutation.mutate(n.id)} className="text-xs text-agri-green hover:underline">Mark as read</button>}
                </div>
              </div>
              {!n.is_read&&<div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"/>}
            </div>
          );})}
        </div>
      </div>

      <div className="card bg-green-50 border-green-100">
        <h3 className="font-semibold text-gray-800 mb-3">Notification Preferences</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[{label:'Email Notifications',desc:'Receive updates via email'},{label:'SMS Alerts',desc:'Get important alerts via SMS'},{label:'System Notifications',desc:'In-app notifications'}].map((p,i)=>(
            <div key={i} className="bg-white rounded-xl p-3 flex items-start gap-3 border border-gray-100">
              <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center flex-shrink-0 mt-0.5"><svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg></div>
              <div><p className="text-xs font-medium text-gray-800">{p.label}</p><p className="text-xs text-gray-400">{p.desc}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
