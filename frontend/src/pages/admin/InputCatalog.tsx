import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Package, Star, X, AlertTriangle } from 'lucide-react';
import { inputsAPI } from '../../api/client';
import toast from 'react-hot-toast';

export default function InputCatalog() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:'', category_id:'', description:'', unit:'kg', unit_price:'', subsidized_price:'', stock_quantity:'', minimum_stock:'', supplier:'', season:'', batch_number:'' });

  const { data, isLoading } = useQuery({
    queryKey: ['inputs-catalog', page, search, categoryId],
    queryFn: () => inputsAPI.getAll({ page, limit: 9, search: search||undefined, category_id: categoryId||undefined }),
  });

  const { data: cats } = useQuery({ queryKey: ['input-categories'], queryFn: () => inputsAPI.getCategories() });

  const createMutation = useMutation({
    mutationFn: (d: any) => inputsAPI.create(d),
    onSuccess: () => { toast.success('Input added to catalog'); qc.invalidateQueries({queryKey:['inputs-catalog']}); setShowModal(false); setForm({name:'',category_id:'',description:'',unit:'kg',unit_price:'',subsidized_price:'',stock_quantity:'',minimum_stock:'',supplier:'',season:'',batch_number:''}); },
    onError: (e:any) => toast.error(e.response?.data?.message||'Failed'),
  });

  const inputs = (data as any)?.data || [];
  const pagination = (data as any)?.pagination;
  const categories = (cats as any) || [];

  const discountPct = (input: any) => {
    if (!input.subsidized_price || !input.unit_price) return 0;
    return Math.round((1 - input.subsidized_price / input.unit_price) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Input Catalog & Distribution</h1><p className="page-subtitle">Manage agricultural inputs available for distribution</p></div>
        <button onClick={()=>setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16}/>Add Input</button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field pl-9" placeholder="Search inputs..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></div>
        <select className="input-field w-44" value={categoryId} onChange={e=>{setCategoryId(e.target.value);setPage(1);}}>
          <option value="">All Categories</option>
          {categories.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{Array(6).fill(0).map((_,i)=><div key={i} className="card h-64 animate-pulse bg-gray-100"/>)}</div>
      : inputs.length===0 ? <div className="card text-center py-16 text-gray-400"><Package size={48} className="mx-auto mb-3 opacity-30"/><p>No inputs found</p></div>
      : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {inputs.map((input:any)=>{
            const disc = discountPct(input);
            const isLow = parseFloat(input.stock_quantity) <= parseFloat(input.minimum_stock);
            return (
              <div key={input.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><Package size={18} className="text-agri-green"/></div>
                    <div><p className="text-xs text-gray-400 uppercase font-medium">{input.category?.name||'Uncategorized'}</p><h4 className="font-semibold text-gray-900 text-sm">{input.name}</h4></div>
                  </div>
                  {disc>0&&<span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold">{disc}% OFF</span>}
                </div>
                {input.description&&<p className="text-xs text-gray-500 mb-3 line-clamp-2">{input.description}</p>}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Stock Level</span><span className={isLow?'text-red-500 font-medium':''}>{parseFloat(input.stock_quantity).toLocaleString()} {input.unit}</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-2"><div className={`h-2 rounded-full ${isLow?'bg-red-400':'bg-agri-green'}`} style={{width:`${Math.min(100,parseFloat(input.stock_quantity)/(parseFloat(input.minimum_stock)*5||1)*100)}%`}}/></div>
                </div>
                {isLow&&<div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3"><AlertTriangle size={12}/>Low stock — reorder needed</div>}
                <div className="flex items-center justify-between mb-3">
                  <div>{input.subsidized_price&&<><span className="text-lg font-bold text-agri-green">RWF {parseFloat(input.subsidized_price).toLocaleString()}</span><span className="text-xs text-gray-400 line-through ml-1">RWF {parseFloat(input.unit_price).toLocaleString()}</span></>}
                  {!input.subsidized_price&&<span className="text-lg font-bold text-gray-800">RWF {parseFloat(input.unit_price).toLocaleString()}</span>}
                  <p className="text-xs text-gray-400">per {input.unit}</p></div>
                </div>
                {input.supplier&&<p className="text-xs text-gray-400 mb-3">Supplier: {input.supplier}</p>}
                <span className={`text-xs px-2 py-1 rounded-full ${input.is_active?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{input.is_active?'In Stock':'Inactive'}</span>
              </div>
            );
          })}
        </div>
      )}

      {pagination&&pagination.totalPages>1&&<div className="flex justify-center gap-2"><button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-4 py-2 border rounded-xl disabled:opacity-40 text-sm">Previous</button><span className="px-4 py-2 text-sm text-gray-500">{page}/{pagination.totalPages}</span><button disabled={!pagination.hasNext} onClick={()=>setPage(p=>p+1)} className="px-4 py-2 border rounded-xl disabled:opacity-40 text-sm">Next</button></div>}

      {showModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b"><h2 className="font-bold text-lg">Add New Input</h2><button onClick={()=>setShowModal(false)}><X size={20} className="text-gray-400"/></button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input className="input-field" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select className="input-field" value={form.category_id} onChange={e=>setForm(p=>({...p,category_id:e.target.value}))}><option value="">Select</option>{categories.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label><select className="input-field" value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))}>{['kg','liter','piece','bag','ton'].map(u=><option key={u}>{u}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (RWF) *</label><input type="number" className="input-field" value={form.unit_price} onChange={e=>setForm(p=>({...p,unit_price:e.target.value}))}/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Subsidized Price</label><input type="number" className="input-field" value={form.subsidized_price} onChange={e=>setForm(p=>({...p,subsidized_price:e.target.value}))}/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label><input type="number" className="input-field" value={form.stock_quantity} onChange={e=>setForm(p=>({...p,stock_quantity:e.target.value}))}/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Alert</label><input type="number" className="input-field" value={form.minimum_stock} onChange={e=>setForm(p=>({...p,minimum_stock:e.target.value}))}/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label><input className="input-field" value={form.supplier} onChange={e=>setForm(p=>({...p,supplier:e.target.value}))}/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Season</label><select className="input-field" value={form.season} onChange={e=>setForm(p=>({...p,season:e.target.value}))}><option value="">Select</option>{['Season A','Season B','Season C'].map(s=><option key={s}>{s}</option>)}</select></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea rows={2} className="input-field resize-none" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
              </div>
              <div className="flex gap-3"><button onClick={()=>setShowModal(false)} className="flex-1 btn-secondary">Cancel</button><button onClick={()=>createMutation.mutate({...form,unit_price:parseFloat(form.unit_price),subsidized_price:form.subsidized_price?parseFloat(form.subsidized_price):undefined,stock_quantity:parseFloat(form.stock_quantity||'0'),minimum_stock:parseFloat(form.minimum_stock||'0')})} disabled={!form.name||!form.unit_price||createMutation.isPending} className="flex-1 btn-primary">{createMutation.isPending?'Adding...':'Add Input'}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
