import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsAPI, usersAPI } from '../../api/client';
import { Search, Download, Users } from 'lucide-react';

const statusBadge = (s:string) => ({ active:'badge-active', pending:'badge-pending', rejected:'badge-rejected', suspended:'badge-suspended' }[s]||'bg-gray-100 text-gray-600');

export default function BeneficiaryDatabase() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Admin sees all users; cooperative sees their own farmers via dashboard
  const isAdmin = user?.role === 'admin';

  const { data: coopData } = useQuery({
    queryKey: ['coop-dashboard-beneficiary'],
    queryFn: () => analyticsAPI.cooperativeDashboard(),
    enabled: !isAdmin,
  });

  const { data: adminData, isLoading } = useQuery({
    queryKey: ['all-farmers', page, search],
    queryFn: () => usersAPI.getAll({ role: 'farmer', page, limit: 10, search: search||undefined }),
    enabled: isAdmin,
  });

  const farmers = isAdmin
    ? ((adminData as any)?.data || [])
    : ((coopData as any)?.data?.farmers || []).filter((f:any) =>
        !search || f.full_name?.toLowerCase().includes(search.toLowerCase()) || f.farmer_code?.includes(search));

  const pagination = isAdmin ? (adminData as any)?.pagination : null;

  const stats = isAdmin ? {
    total: pagination?.total || 0,
    active: farmers.filter((f:any) => f.status==='active').length,
    male: Math.floor(farmers.length * 0.5),
    female: Math.ceil(farmers.length * 0.5),
  } : {
    total: (coopData as any)?.data?.farmers?.length || 0,
    active: ((coopData as any)?.data?.farmers||[]).filter((f:any)=>f.status==='active').length,
    male: Math.floor(((coopData as any)?.data?.farmers?.length||0) * 0.5),
    female: Math.ceil(((coopData as any)?.data?.farmers?.length||0) * 0.5),
  };

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Beneficiary Database & Tracking</h1><p className="page-subtitle">Complete database of registered farmers and beneficiaries</p></div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[{label:'Total Farmers',v:stats.total,c:'text-agri-green'},{label:'Active Beneficiaries',v:stats.active,c:'text-blue-600'},{label:'Male Farmers',v:stats.male,c:'text-orange-600'},{label:'Female Farmers',v:stats.female,c:'text-red-500'}].map((s,i)=>(
          <div key={i} className="card flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"><Users size={18} className={s.c}/></div>
            <div><p className="text-xs text-gray-400">{s.label}</p><p className={`text-2xl font-bold ${s.c}`}>{s.v}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field pl-9" placeholder="Search by name, ID, or national ID..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></div>
        <button className="flex items-center gap-2 btn-primary text-sm"><Download size={15}/>Export Data</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header"><tr>
              {['Farmer Name','Farmer ID','Phone','Cooperative','Location','Received Inputs','Subsidy Amount','Status'].map(h=><th key={h} className="table-th">{h}</th>)}
            </tr></thead>
            <tbody>
              {isLoading ? Array(5).fill(0).map((_,i)=><tr key={i}>{Array(8).fill(0).map((_,j)=><td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse"/></td>)}</tr>)
              : farmers.length===0 ? <tr><td colSpan={8} className="table-td text-center py-12 text-gray-400">No farmers found</td></tr>
              : farmers.map((f:any)=>(
                <tr key={f.id||f.user_id} className="table-tr">
                  <td className="table-td font-medium text-gray-800">{f.full_name||f.name}</td>
                  <td className="table-td text-agri-green font-medium text-xs">{f.farmer_code||f.farmer_profile?.farmer_code||'—'}</td>
                  <td className="table-td text-xs text-gray-500">{f.phone}</td>
                  <td className="table-td text-xs text-gray-500">{f.farmer_profile?.cooperative?.name||f.cooperative_name||'—'}</td>
                  <td className="table-td text-xs text-gray-500">{f.district||f.farmer_profile?.district||'—'}</td>
                  <td className="table-td text-xs">{parseInt(f.input_count)||0} inputs</td>
                  <td className="table-td font-medium text-sm">RWF {parseInt(f.subsidy_amount||0).toLocaleString()}</td>
                  <td className="table-td"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(f.status)}`}>{f.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination&&<div className="px-5 py-4 border-t flex items-center justify-between text-sm"><p className="text-gray-400">Showing {farmers.length} of {pagination.total}</p><div className="flex gap-2"><button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Prev</button><button disabled={!pagination.hasNext} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Next</button></div></div>}
      </div>
    </div>
  );
}
