import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Plus, X } from 'lucide-react';
import { subsidyAPI } from '../../api/client';
import toast from 'react-hot-toast';

const statusBadge = (s:string) => ({ disbursed:'badge-active', approved:'badge-approved', pending:'badge-pending', rejected:'badge-rejected', under_review:'bg-purple-100 text-purple-700' }[s]||'bg-gray-100 text-gray-600');

export default function FarmerSubsidies() {
  const qc = useQueryClient();
  const [showApply, setShowApply] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const { data } = useQuery({ queryKey: ['farmer-subsidies'], queryFn: () => subsidyAPI.getApplications({ limit: 20 }) });
  const { data: programs } = useQuery({ queryKey: ['active-programs'], queryFn: () => subsidyAPI.getPrograms({ status: 'active', limit: 20 }) });

  const applyMutation = useMutation({
    mutationFn: (d:any) => subsidyAPI.apply(d),
    onSuccess: () => { toast.success('Application submitted'); qc.invalidateQueries({queryKey:['farmer-subsidies']}); setShowApply(false); setSelectedProgram(''); setAmount(''); setReason(''); },
    onError: (e:any) => toast.error(e.response?.data?.message||'Failed to submit'),
  });

  const apps = (data as any)?.data || [];
  const progs = (programs as any)?.data || [];
  const total = apps.reduce((s:number,a:any)=>s+parseFloat(a.approved_amount||a.requested_amount||0),0);
  const received = apps.reduce((s:number,a:any)=>s+parseFloat(a.disbursed_amount||0),0);
  const pending = total - received;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">My Subsidies</h1><p className="page-subtitle">Track your subsidy allocations and disbursements</p></div>
        <button onClick={()=>setShowApply(true)} className="btn-primary flex items-center gap-2"><Plus size={16}/>Apply for Subsidy</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-green-50"><p className="text-xs text-gray-500">Total Allocated</p><p className="text-2xl font-bold text-agri-green">RWF {total.toLocaleString()}</p></div>
        <div className="card bg-blue-50"><p className="text-xs text-gray-500">Total Disbursed</p><p className="text-2xl font-bold text-blue-600">RWF {received.toLocaleString()}</p></div>
        <div className="card bg-orange-50"><p className="text-xs text-gray-500">Pending</p><p className="text-2xl font-bold text-orange-600">RWF {pending.toLocaleString()}</p></div>
      </div>
      <div className="space-y-4">
        {apps.length===0?<div className="card text-center py-16 text-gray-400"><DollarSign size={40} className="mx-auto mb-3 opacity-30"/><p className="mb-3">No subsidy applications yet</p><button onClick={()=>setShowApply(true)} className="btn-primary text-sm px-6 py-2">Apply Now</button></div>
        :apps.map((a:any)=>(
          <div key={a.id} className="card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0"><DollarSign size={22} className="text-agri-green"/></div>
                <div>
                  <h3 className="font-semibold text-gray-900">{a.program?.name||'—'}</h3>
                  <p className="text-xs text-gray-400 capitalize">{a.program?.type} subsidy</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                    <span>Requested: <strong>RWF {parseFloat(a.requested_amount).toLocaleString()}</strong></span>
                    {a.approved_amount&&<span>Approved: <strong className="text-agri-green">RWF {parseFloat(a.approved_amount).toLocaleString()}</strong></span>}
                    <span>Disbursed: <strong className="text-blue-600">RWF {parseFloat(a.disbursed_amount||0).toLocaleString()}</strong></span>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${statusBadge(a.status)}`}>{a.status?.replace('_',' ')}</span>
                <p className="text-xs text-gray-400 mt-2">{a.created_at?new Date(a.created_at).toLocaleDateString():''}</p>
              </div>
            </div>
            {a.approved_amount&&<div className="mt-4"><div className="flex justify-between text-xs text-gray-400 mb-1"><span>Disbursement Progress</span><span>{a.approved_amount>0?Math.round((a.disbursed_amount/a.approved_amount)*100):0}%</span></div><div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-agri-green h-2 rounded-full" style={{width:`${a.approved_amount>0?Math.min((a.disbursed_amount/a.approved_amount)*100,100):0}%`}}/></div></div>}
            {a.rejection_reason&&<p className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded-lg">Rejection reason: {a.rejection_reason}</p>}
          </div>
        ))}
      </div>
      {showApply&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b"><h2 className="font-bold text-lg">Apply for Subsidy</h2><button onClick={()=>setShowApply(false)}><X size={20} className="text-gray-400"/></button></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Subsidy Program *</label>
                <select className="input-field" value={selectedProgram} onChange={e=>setSelectedProgram(e.target.value)}>
                  <option value="">Select program...</option>
                  {progs.map((p:any)=><option key={p.id} value={p.id}>{p.name} (Max: RWF {(parseFloat(p.max_amount_per_farmer||p.total_budget)||0).toLocaleString()})</option>)}
                </select>
                {progs.length===0&&<p className="text-xs text-gray-400 mt-1">No active programs available</p>}
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Requested Amount (RWF) *</label><input type="number" className="input-field" placeholder="e.g. 50000" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason for Application *</label><textarea rows={3} className="input-field resize-none" placeholder="Explain how you will use this subsidy..." value={reason} onChange={e=>setReason(e.target.value)}/></div>
              <div className="flex gap-3"><button onClick={()=>setShowApply(false)} className="flex-1 btn-secondary">Cancel</button><button onClick={()=>applyMutation.mutate({program_id:selectedProgram,requested_amount:parseFloat(amount),application_reason:reason})} disabled={!selectedProgram||!amount||!reason||applyMutation.isPending} className="flex-1 btn-primary">{applyMutation.isPending?'Submitting...':'Submit Application'}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
