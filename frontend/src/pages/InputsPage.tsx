import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Package, Edit, Trash2, X } from 'lucide-react';
import { inputsAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const InputsPage: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', unit: '', unit_price: '', stock_quantity: '', minimum_stock: '', supplier: '', season: '', description: '', category_id: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['inputs', page, search],
    queryFn: () => inputsAPI.getAll({ page, limit: 10, search }),
  });

  const { data: cats } = useQuery({
    queryKey: ['input-categories'],
    queryFn: async () => { const r = await inputsAPI.getCategories(); return r as any; },
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => editing ? inputsAPI.update(editing.id, data) : inputsAPI.create(data),
    onSuccess: () => {
      toast.success(editing ? 'Input updated' : 'Input created');
      qc.invalidateQueries({ queryKey: ['inputs'] });
      setShowModal(false); setEditing(null);
      setForm({ name: '', unit: '', unit_price: '', stock_quantity: '', minimum_stock: '', supplier: '', season: '', description: '', category_id: '' });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inputsAPI.update(id, { is_active: false }),
    onSuccess: () => { toast.success('Input deactivated'); qc.invalidateQueries({ queryKey: ['inputs'] }); },
  });

  const openEdit = (input: any) => {
    setEditing(input);
    setForm({ name: input.name, unit: input.unit, unit_price: input.unit_price, stock_quantity: input.stock_quantity, minimum_stock: input.minimum_stock, supplier: input.supplier || '', season: input.season || '', description: input.description || '', category_id: input.category_id || '' });
    setShowModal(true);
  };

  const canEdit = user?.role === 'admin' || user?.role === 'cooperative';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Input Management</h1>
          <p className="text-sm text-gray-500">Manage agricultural inputs and stock levels</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Input
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search inputs..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="card h-40 animate-pulse bg-gray-100" />)}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p>No inputs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.data?.map((input: any) => (
            <div key={input.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Package size={20} className="text-agri-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{input.name}</h3>
                    <p className="text-xs text-gray-400">{input.category_name || 'Uncategorized'}</p>
                  </div>
                </div>
                <span className={input.is_active ? 'badge-active' : 'badge-rejected'}>
                  {input.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-xs text-gray-400">Unit Price</p>
                  <p className="font-semibold text-gray-800 text-sm">RWF {Number(input.unit_price).toLocaleString()}</p>
                </div>
                <div className={`rounded-lg p-2.5 ${Number(input.stock_quantity) <= Number(input.minimum_stock) ? 'bg-red-50' : 'bg-green-50'}`}>
                  <p className="text-xs text-gray-400">In Stock</p>
                  <p className={`font-semibold text-sm ${Number(input.stock_quantity) <= Number(input.minimum_stock) ? 'text-red-600' : 'text-agri-green'}`}>
                    {Number(input.stock_quantity).toLocaleString()} {input.unit}
                  </p>
                </div>
              </div>

              {input.supplier && <p className="text-xs text-gray-400 mb-3">Supplier: {input.supplier}</p>}

              {Number(input.stock_quantity) <= Number(input.minimum_stock) && (
                <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg mb-3">⚠️ Low stock alert</div>
              )}

              {canEdit && (
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => openEdit(input)} className="flex-1 flex items-center justify-center gap-1.5 text-sm text-gray-600 hover:text-agri-green py-1.5 rounded-lg hover:bg-green-50 transition-colors">
                    <Edit size={14} /> Edit
                  </button>
                  <button onClick={() => { if (confirm('Deactivate this input?')) deleteMutation.mutate(input.id); }}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm text-gray-600 hover:text-red-600 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 size={14} /> Deactivate
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50 text-sm">Previous</button>
          <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {data.pagination.totalPages}</span>
          <button disabled={page >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50 text-sm">Next</button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-lg">{editing ? 'Edit Input' : 'Add New Input'}</h2>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input className="input-field" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., NPK Fertilizer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="input-field" value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}>
                    <option value="">Select category</option>
                    {cats?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                  <select className="input-field" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                    <option value="">Select unit</option>
                    {['kg', 'ton', 'liter', 'bag', 'piece', 'pack'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (RWF) *</label>
                  <input type="number" className="input-field" value={form.unit_price} onChange={e => setForm(p => ({ ...p, unit_price: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input type="number" className="input-field" value={form.stock_quantity} onChange={e => setForm(p => ({ ...p, stock_quantity: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Alert</label>
                  <input type="number" className="input-field" value={form.minimum_stock} onChange={e => setForm(p => ({ ...p, minimum_stock: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input className="input-field" value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} placeholder="Supplier name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                  <select className="input-field" value={form.season} onChange={e => setForm(p => ({ ...p, season: e.target.value }))}>
                    <option value="">Select season</option>
                    <option>Season A</option><option>Season B</option><option>Season C</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={2} className="input-field resize-none" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description..." />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowModal(false); setEditing(null); }} className="flex-1 btn-secondary">Cancel</button>
                <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="flex-1 btn-primary">
                  {saveMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputsPage;
