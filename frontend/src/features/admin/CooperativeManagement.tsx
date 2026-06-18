import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Eye, Edit, Users, MapPin, X } from 'lucide-react';
import { cooperativesAPI } from '../../api/client';
import { useCooperatives } from '../../hooks';
import { QueryErrorBanner } from '../../components/common';
import { parsePayload, cooperativePayloadSchema } from '../../utils/schemas';
import { QUERY_KEYS } from '../../constants';
import toast from 'react-hot-toast';

const emptyForm = { name:'', registration_number:'', province:'', district:'', sector:'', contact_person:'', contact_phone:'', contact_email:'', description:'', established_year:'' };

export default function CooperativeManagement() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewFarmersId, setViewFarmersId] = useState<string | null>(null);
  const [farmersList, setFarmersList] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);

  const { coops, pagination, isLoading, isError, refetch } = useCooperatives(page, search);

  const { data: coopStats, isLoading: statsLoading } = useQuery({
    queryKey: ['cooperatives-stats'],
    queryFn: () => cooperativesAPI.getStats(),
  });

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => cooperativesAPI.create(d),
    onSuccess: () => {
      toast.success('Cooperative registered');
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.COOPERATIVES] });
      qc.invalidateQueries({ queryKey: ['cooperatives-stats'] });
      setShowModal(false);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => cooperativesAPI.update(id, data),
    onSuccess: () => {
      toast.success('Cooperative updated');
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.COOPERATIVES] });
      qc.invalidateQueries({ queryKey: ['cooperatives-stats'] });
      setShowModal(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const openCreate = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      name: c.name || '',
      registration_number: c.registration_number || '',
      province: c.province || '',
      district: c.district || '',
      sector: c.sector || '',
      contact_person: c.contact_person || '',
      contact_phone: c.contact_phone || '',
      contact_email: c.contact_email || '',
      description: c.description || '',
      established_year: c.established_year ? String(c.established_year) : '',
    });
    setShowModal(true);
  };

  const handleSave = () => {
    const payload = {
      ...form,
      established_year: form.established_year ? parseInt(form.established_year) : undefined,
      contact_email: form.contact_email || undefined,
    };
    const parsed = parsePayload(cooperativePayloadSchema, payload);
    if (!parsed.success) { toast.error(parsed.message); return; }
    if (editId) updateMutation.mutate({ id: editId, data: parsed.data });
    else createMutation.mutate(parsed.data);
  };

  const handleViewFarmers = async (id: string) => {
    try {
      const res = await cooperativesAPI.getFarmers(id);
      setFarmersList((res as any) || []);
      setViewFarmersId(id);
    } catch {
      toast.error('Failed to load farmers');
    }
  };

  const stats = (coopStats as {
    total_cooperatives?: number;
    active_cooperatives?: number;
    total_members?: number;
  }) || { total_cooperatives: 0, active_cooperatives: 0, total_members: 0 };
  const pageActiveCount = coops.filter((c: any) => c.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Cooperative Management</h1><p className="page-subtitle">Manage cooperatives, members, and track performance</p></div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={16}/>Register New</button>
      </div>

      {isError && <QueryErrorBanner onRetry={() => refetch()} />}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Cooperatives', value: statsLoading ? '...' : stats.total_cooperatives },
          { label: 'Active (this page)', value: isLoading ? '...' : pageActiveCount },
          { label: 'Total Members', value: statsLoading ? '...' : stats.total_members },
          { label: 'Provinces (page)', value: isLoading ? '...' : [...new Set(coops.map((c: any) => c.province))].length },
        ].map((s, i) => (
          <div key={i} className="card">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold text-gray-900 ${statsLoading || isLoading ? 'animate-pulse' : ''}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field pl-9" placeholder="Search cooperatives..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></div>
      </div>

      {isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{Array(6).fill(0).map((_,i)=><div key={i} className="card h-48 animate-pulse bg-gray-100"/>)}</div>
      : coops.length===0 ? <div className="card text-center py-16 text-gray-400"><Users size={48} className="mx-auto mb-3 opacity-30"/><p>No cooperatives found</p></div>
      : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {coops.map((c:any)=>(
            <div key={c.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0"><Users size={18} className="text-blue-600"/></div>
                  <div><h3 className="font-semibold text-gray-900">{c.name}</h3>{c.registration_number&&<p className="text-xs text-gray-400">Reg: {c.registration_number}</p>}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.status==='active'?'badge-active':'badge-suspended'}`}>{c.status}</span>
              </div>
              <div className="space-y-1.5 mb-3 text-sm text-gray-500">
                <div className="flex items-center gap-1.5"><MapPin size={13}/>{[c.sector,c.district,c.province].filter(Boolean).join(', ')}</div>
                <div className="flex items-center gap-1.5"><Users size={13}/>{parseInt(c.farmer_count || 0, 10)} farmers{c.established_year&&` · Since ${c.established_year}`}</div>
                {c.manager&&<p className="text-xs">Manager: <span className="font-medium text-gray-700">{c.manager.full_name}</span></p>}
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={()=>handleViewFarmers(c.id)} className="flex-1 flex items-center justify-center gap-1 text-xs text-agri-green hover:bg-green-50 py-1.5 rounded-lg"><Eye size={13}/>View Farmers</button>
                <button onClick={()=>openEdit(c)} className="flex-1 flex items-center justify-center gap-1 text-xs text-gray-500 hover:bg-gray-50 py-1.5 rounded-lg"><Edit size={13}/>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination&&pagination.totalPages>1&&<div className="flex justify-center gap-2"><button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-4 py-2 border rounded-xl disabled:opacity-40 text-sm hover:bg-gray-50">Previous</button><span className="px-4 py-2 text-sm text-gray-500">Page {page} of {pagination.totalPages}</span><button disabled={!pagination.hasNext} onClick={()=>setPage(p=>p+1)} className="px-4 py-2 border rounded-xl disabled:opacity-40 text-sm hover:bg-gray-50">Next</button></div>}

      {showModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b"><h2 className="font-bold text-lg">{editId?'Edit Cooperative':'Register New Cooperative'}</h2><button onClick={()=>{setShowModal(false);setEditId(null);}} className="text-gray-400 hover:text-gray-600"><X size={20}/></button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input className="input-field" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Cooperative name"/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Reg. Number</label><input className="input-field" value={form.registration_number} onChange={e=>setForm(p=>({...p,registration_number:e.target.value}))}/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Est. Year</label><input type="number" className="input-field" value={form.established_year} onChange={e=>setForm(p=>({...p,established_year:e.target.value}))} placeholder="2020"/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Province *</label><select className="input-field" value={form.province} onChange={e=>setForm(p=>({...p,province:e.target.value}))}><option value="">Select</option>{['Kigali','Northern','Southern','Eastern','Western'].map(x=><option key={x}>{x}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">District *</label><input className="input-field" value={form.district} onChange={e=>setForm(p=>({...p,district:e.target.value}))}/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Sector *</label><input className="input-field" value={form.sector} onChange={e=>setForm(p=>({...p,sector:e.target.value}))}/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label><input className="input-field" value={form.contact_person} onChange={e=>setForm(p=>({...p,contact_person:e.target.value}))}/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label><input className="input-field" value={form.contact_phone} onChange={e=>setForm(p=>({...p,contact_phone:e.target.value}))}/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label><input className="input-field" value={form.contact_email} onChange={e=>setForm(p=>({...p,contact_email:e.target.value}))}/></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea rows={2} className="input-field resize-none" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={()=>{setShowModal(false);setEditId(null);}} className="flex-1 btn-secondary">Cancel</button>
                <button onClick={handleSave} disabled={!form.name||!form.province||!form.district||!form.sector||createMutation.isPending||updateMutation.isPending} className="flex-1 btn-primary">{createMutation.isPending||updateMutation.isPending?'Saving...':editId?'Update':'Register'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewFarmersId&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b"><h2 className="font-bold text-lg">Cooperative Farmers</h2><button onClick={()=>setViewFarmersId(null)}><X size={20} className="text-gray-400"/></button></div>
            <div className="p-6 space-y-3">
              {farmersList.length===0?<p className="text-sm text-gray-400 text-center py-8">No farmers registered</p>
              :farmersList.map((f:any)=>(
                <div key={f.id} className="border border-gray-100 rounded-xl p-3">
                  <p className="font-medium text-sm">{f.user?.full_name || f.full_name}</p>
                  <p className="text-xs text-gray-400">{f.farmer_code||''} · {f.user?.phone || f.phone||''}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
