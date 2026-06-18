import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Search } from 'lucide-react';
import { inputsAPI } from '../../api/client';

const statusBadge = (s: string) => ({ distributed:'badge-active', pending:'badge-pending', approved:'badge-approved', cancelled:'badge-rejected' }[s]||'bg-gray-100 text-gray-600');

export default function FarmerInputs() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['farmer-inputs', search, status],
    queryFn: () => inputsAPI.getDistributions({ limit: 20, status: status||undefined }),
  });

  const items = ((data as any)?.data || []).filter((d: any) =>
    !search || d.input?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const total = items.length;
  const received = items.filter((d:any)=>d.status==='distributed').length;
  const pending = items.filter((d:any)=>d.status==='pending').length;
  const value = items.reduce((s:number,d:any)=>s+parseFloat(d.total_amount||0),0);

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">My Inputs</h1><p className="page-subtitle">View your allocated agricultural inputs and distribution history</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[{l:'Total Allocated',v:total,c:'text-agri-green'},{l:'Received',v:received,c:'text-green-600'},{l:'Pending',v:pending,c:'text-yellow-600'},{l:'Total Value (RWF)',v:value.toLocaleString(),c:'text-blue-600'}].map((s,i)=>(
          <div key={i} className="card"><p className="text-xs text-gray-500">{s.l}</p><p className={`text-xl font-bold ${s.c}`}>{s.v}</p></div>
        ))}
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field pl-9" placeholder="Search inputs..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select className="input-field w-40" value={status} onChange={e=>setStatus(e.target.value)}><option value="">All Status</option><option value="distributed">Received</option><option value="pending">Pending</option><option value="approved">Approved</option></select>
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="table-header"><tr>{['Input Name','Quantity','Supplier','Season','Date','Value (RWF)','Status'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading?Array(4).fill(0).map((_,i)=><tr key={i}>{Array(7).fill(0).map((_,j)=><td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse"/></td>)}</tr>)
            :items.length===0?<tr><td colSpan={7} className="table-td text-center py-12 text-gray-400"><Package size={32} className="mx-auto mb-2 opacity-30"/><p>No inputs allocated yet</p></td></tr>
            :items.map((d:any)=>(
              <tr key={d.id} className="table-tr">
                <td className="table-td"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0"><Package size={13} className="text-agri-green"/></div><span className="font-medium text-gray-800">{d.input?.name||'—'}</span></div></td>
                <td className="table-td text-gray-600">{d.quantity} {d.input?.unit}</td>
                <td className="table-td text-gray-500 text-xs">{d.input?.supplier||'—'}</td>
                <td className="table-td text-gray-500 text-xs">{d.season||'—'}</td>
                <td className="table-td text-gray-500 text-xs">{d.distribution_date||'Pending'}</td>
                <td className="table-td font-medium">{parseFloat(d.total_amount||0).toLocaleString()}</td>
                <td className="table-td"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(d.status)}`}>{d.status==='distributed'?'Received':d.status?.charAt(0).toUpperCase()+d.status?.slice(1)}</span></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
