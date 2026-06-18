import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, CheckCircle, X, Package } from 'lucide-react';
import { inputsAPI, analyticsAPI } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const statusBadge = (s:string) => ({ distributed:'badge-active', pending:'badge-pending', approved:'badge-approved', cancelled:'badge-rejected' }[s]||'bg-gray-100 text-gray-600');

export default function InputDistribution() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'inventory'|'tracking'>('inventory');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ farmer_id:'', input_id:'', quantity:'', distribution_date:new Date().toISOString().split('T')[0], season:'Season B', notes:'' });

  const { data: invData, isLoading: invLoading } = useQuery({
    queryKey: ['inputs-inventory', search],
    queryFn: () => inputsAPI.getAll({ search: search||undefined, limit: 20 }),
    enabled: tab==='inventory',
  });

  const { data: distData, isLoading: distLoading } = useQuery({
    queryKey: ['distributions-list', page],
    queryFn: () => inputsAPI.getDistributions({ page, limit: 10 }),
    enabled: tab==='tracking',
  });

  const { data: coopData } = useQuery({
    queryKey: ['coop-dash-dist'],
    queryFn: () => analyticsAPI.cooperativeDashboard(),
    enabled: user?.role === 'cooperative',
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => inputsAPI.approveDistribution(id),
    onSuccess: () => { toast.success('Distribution approved & stock deducted'); qc.invalidateQueries({queryKey:['distributions-list']}); qc.invalidateQueries({queryKey:['inputs-inventory']}); },
    onError: (e:any) => toast.error(e.response?.data?.message||'Failed'),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => inputsAPI.createDistribution(d),
    onSuccess: () => { toast.success('Distribution created'); qc.invalidateQueries({queryKey:['distributions-list']}); setShowModal(false); },
    onError: (e:any) => toast.error(e.response?.data?.message||'Failed'),
  });

  const inventory = (invData as any)?.data || [];
  const distributions = (distData as any)?.data || [];
  const pagination = (distData as any)?.pagination;
  const farmers = (coopData as any)?.data?.farmers || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Input Distribution Management</h1><p className="page-subtitle">Manage inventory and track distributions</p></div>
        <button onClick={()=>setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16}/>New Distribution</button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['inventory','tracking'] as const).map(t=><button key={t} onClick={()=>setTab(t)} className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab===t?'bg-agri-green text-white':'text-gray-600 hover:text-gray-800'}`}>{t==='inventory'?'Input Inventory':'Distribution Tracking'}</button>)}
      </div>

      <div className="card"><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field pl-9" placeholder="Search..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></div></div>

      {tab==='inventory'?(
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="table-header"><tr>{['Input Name','Category','Available','Distributed','Subsidized Price','Supplier','Status'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
            <tbody>
              {invLoading?Array(5).fill(0).map((_,i)=><tr key={i}>{Array(7).fill(0).map((_,j)=><td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse"/></td>)}</tr>)
              :inventory.filter((i:any)=>!search||i.name.toLowerCase().includes(search.toLowerCase())).map((i:any)=>(
                <tr key={i.id} className="table-tr">
                  <td className="table-td font-medium text-gray-800">{i.name}</td>
                  <td className="table-td text-gray-500">{i.category?.name||'—'}</td>
                  <td className={`table-td font-medium ${parseFloat(i.stock_quantity)<=parseFloat(i.minimum_stock)?'text-red-500':'text-agri-green'}`}>{parseFloat(i.stock_quantity).toLocaleString()} {i.unit}</td>
                  <td className="table-td text-gray-500">{i.total_distributed||0} {i.unit}</td>
                  <td className="table-td">RWF {i.subsidized_price?parseFloat(i.subsidized_price).toLocaleString():parseFloat(i.unit_price).toLocaleString()}/{i.unit}</td>
                  <td className="table-td text-gray-500">{i.supplier||'—'}</td>
                  <td className="table-td"><span className={`text-xs px-2 py-1 rounded-full font-medium ${parseFloat(i.stock_quantity)<=parseFloat(i.minimum_stock)?'bg-red-100 text-red-700':'badge-active'}`}>{parseFloat(i.stock_quantity)<=parseFloat(i.minimum_stock)?'Low Stock':'In Stock'}</span></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      ):(
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="table-header"><tr>{['Farmer','Input','Quantity','Date','Season','QR Code','Status','Actions'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
            <tbody>
              {distLoading?Array(5).fill(0).map((_,i)=><tr key={i}>{Array(8).fill(0).map((_,j)=><td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse"/></td>)}</tr>)
              :distributions.map((d:any)=>(
                <tr key={d.id} className="table-tr">
                  <td className="table-td font-medium text-gray-800">{d.farmer?.user?.full_name||'—'}</td>
                  <td className="table-td">{d.input?.name||'—'}</td>
                  <td className="table-td">{d.quantity} {d.input?.unit}</td>
                  <td className="table-td text-xs text-gray-500">{d.distribution_date}</td>
                  <td className="table-td text-xs text-gray-500">{d.season||'—'}</td>
                  <td className="table-td text-xs font-mono text-gray-500">{d.qr_code||'—'}</td>
                  <td className="table-td"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge(d.status)}`}>{d.status}</span></td>
                  <td className="table-td">{d.status==='pending'&&<button onClick={()=>approveMutation.mutate(d.id)} className="flex items-center gap-1 text-xs text-agri-green hover:underline"><CheckCircle size={12}/>Approve</button>}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
          {pagination&&<div className="px-5 py-4 border-t flex items-center justify-between text-sm"><p className="text-gray-400">{distributions.length} of {pagination.total}</p><div className="flex gap-2"><button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Prev</button><button disabled={!pagination.hasNext} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Next</button></div></div>}
        </div>
      )}

      {showModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b"><h2 className="font-bold text-lg">Create Distribution</h2><button onClick={()=>setShowModal(false)}><X size={20} className="text-gray-400"/></button></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Farmer *</label><select className="input-field" value={form.farmer_id} onChange={e=>setForm(p=>({...p,farmer_id:e.target.value}))}><option value="">Select farmer</option>{farmers.map((f:any)=><option key={f.id||f.user_id} value={f.id||f.farmer_id}>{f.full_name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Input *</label><select className="input-field" value={form.input_id} onChange={e=>setForm(p=>({...p,input_id:e.target.value}))}><option value="">Select input</option>{inventory.map((i:any)=><option key={i.id} value={i.id}>{i.name} ({parseFloat(i.stock_quantity).toLocaleString()} {i.unit} available)</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label><input type="number" className="input-field" value={form.quantity} onChange={e=>setForm(p=>({...p,quantity:e.target.value}))}/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Distribution Date</label><input type="date" className="input-field" value={form.distribution_date} onChange={e=>setForm(p=>({...p,distribution_date:e.target.value}))}/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Season</label><select className="input-field" value={form.season} onChange={e=>setForm(p=>({...p,season:e.target.value}))}>{['Season A','Season B','Season C'].map(s=><option key={s}>{s}</option>)}</select></div>
              <div className="flex gap-3"><button onClick={()=>setShowModal(false)} className="flex-1 btn-secondary">Cancel</button><button onClick={()=>createMutation.mutate({...form,quantity:parseFloat(form.quantity)})} disabled={!form.farmer_id||!form.input_id||!form.quantity||createMutation.isPending} className="flex-1 btn-primary">{createMutation.isPending?'Creating...':'Create'}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
