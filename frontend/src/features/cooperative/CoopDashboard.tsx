import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Package, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { inputsAPI } from '../../api/client';
import { useCoopDashboard } from '../../hooks';
import { QueryErrorBanner } from '../../components/common';
import toast from 'react-hot-toast';

export default function CoopDashboard() {
  const qc = useQueryClient();
  const { cooperative, stats, farmers, pendingRequests, stock, isLoading, isError, refetch } = useCoopDashboard();

  const approveMutation = useMutation({
    mutationFn: (id: string) => inputsAPI.approveDistribution(id),
    onSuccess: () => { toast.success('Distribution approved'); qc.invalidateQueries({queryKey:['cooperative-dashboard']}); },
    onError: (e:any) => toast.error(e.response?.data?.message||'Failed'),
  });

  if (isLoading) return <div className="space-y-6"><div className="h-32 bg-gray-100 rounded-2xl animate-pulse"/><div className="grid grid-cols-4 gap-4">{Array(4).fill(0).map((_,i)=><div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse"/>)}</div></div>;

  if (isError) return <QueryErrorBanner onRetry={() => refetch()} />;
  if (!cooperative) return <div className="card text-center py-16 text-gray-400"><p>No cooperative found for your account. Contact admin.</p></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Cooperative Dashboard</h1><p className="page-subtitle">Manage your cooperative and farmers</p></div>

      <div className="bg-blue-700 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">{cooperative.name}</h2>
        <p className="text-blue-200 text-sm mb-3">ID: {cooperative.id.slice(0,8).toUpperCase()}</p>
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div><p className="text-blue-300 text-xs">Location</p><p className="font-medium">{cooperative.district}, {cooperative.province}</p></div>
          <div><p className="text-blue-300 text-xs">Contact</p><p className="font-medium">{cooperative.contact_phone||'—'}</p></div>
          <div><p className="text-blue-300 text-xs">Since</p><p className="font-medium">{cooperative.established_year||'—'}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {label:'Total Farmers',value:parseInt(stats.total_farmers||0),icon:Users,color:'text-agri-green',bg:'bg-green-100'},
          {label:'Total Distributed (kg)',value:parseFloat(stats.total_distributed_kg||0).toFixed(0),icon:Package,color:'text-blue-600',bg:'bg-blue-100'},
          {label:'Distributed Value',value:`RWF ${(parseFloat(stats.total_distributed_value||0)/1000).toFixed(0)}K`,icon:TrendingUp,color:'text-orange-600',bg:'bg-orange-100'},
          {label:'Pending Requests',value:parseInt(stats.pending_distributions||0),icon:Clock,color:'text-yellow-600',bg:'bg-yellow-100'},
        ].map((s,i)=>(
          <div key={i} className="card flex items-center gap-3">
            <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}><s.icon size={22} className={s.color}/></div>
            <div><p className="text-xs text-gray-500">{s.label}</p><p className="text-xl font-bold text-gray-900">{s.value}</p></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-0 overflow-hidden">
          <div className="p-5 border-b"><h3 className="font-semibold text-gray-900">Registered Farmers ({farmers?.length||0})</h3></div>
          <div className="divide-y divide-gray-50">
            {farmers?.length===0?<div className="p-8 text-center text-gray-400">No farmers registered yet</div>
            :farmers?.slice(0,8).map((f:any)=>(
              <div key={f.id||f.user_id} className="px-5 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{f.full_name}</p>
                    <p className="text-xs text-gray-400">{f.farmer_code} · {f.phone}</p>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500"><span>Inputs: {f.input_count||0}</span><span>Subsidy: RWF {parseFloat(f.subsidy_amount||0).toLocaleString()}</span></div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${f.status==='active'?'badge-active':'badge-pending'}`}>{f.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-900">Pending Requests</h3><span className="bg-orange-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">{pendingRequests?.length||0}</span></div>
          {pendingRequests?.length===0?<p className="text-gray-400 text-sm text-center py-8">No pending requests</p>
          :pendingRequests?.map((r:any)=>(
            <div key={r.id} className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-3">
              <div className="mb-2"><p className="font-medium text-sm text-gray-800">{r.farmer_name}</p><p className="text-xs text-gray-500">{r.input_name}</p><p className="text-sm font-bold text-gray-700">{r.quantity} {r.unit}</p><p className="text-xs text-gray-400">{r.distribution_date}</p></div>
              <div className="flex gap-2">
                <button onClick={()=>approveMutation.mutate(r.id)} className="flex-1 bg-agri-green text-white text-xs py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-agri-lightgreen"><CheckCircle size={11}/>Approve</button>
                <button onClick={() => toast.error('Rejection requires admin review — contact administrator')} className="flex-1 border border-gray-300 text-gray-600 text-xs py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-gray-50"><XCircle size={11}/>Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b"><h3 className="font-semibold text-gray-900">Input Stock Overview</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead className="table-header"><tr>{['Input Name','Category','Available','Distributed','Supplier','Status'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
            <tbody>
              {stock?.map((s:any)=>(
                <tr key={s.id} className="table-tr">
                  <td className="table-td font-medium text-gray-800">{s.name}</td>
                  <td className="table-td text-gray-500">{s.category_name||'—'}</td>
                  <td className={`table-td font-medium ${parseFloat(s.stock_quantity)<=parseFloat(s.minimum_stock)?'text-red-500':'text-agri-green'}`}>{parseFloat(s.stock_quantity).toLocaleString()} {s.unit}</td>
                  <td className="table-td text-gray-500">{parseFloat(s.total_distributed||0).toLocaleString()} {s.unit}</td>
                  <td className="table-td text-gray-500 text-xs">{s.supplier||'—'}</td>
                  <td className="table-td"><span className={`text-xs px-2 py-1 rounded-full font-medium ${parseFloat(s.stock_quantity)<=parseFloat(s.minimum_stock)?'bg-red-100 text-red-700':'badge-active'}`}>{parseFloat(s.stock_quantity)<=parseFloat(s.minimum_stock)?'Low Stock':'In Stock'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
