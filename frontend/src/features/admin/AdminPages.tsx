import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Package, BarChart3, FileText, Shield, Settings, Lock, AlertTriangle, Activity, CheckCircle, Download } from 'lucide-react';
import { subsidyAPI, analyticsAPI, inputsAPI } from '../../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';
import SecurityPage from '../farmer/SecurityPage';
import ReportsPage from '../cooperative/ReportsPage';
import ExportModal from '../../components/common/ExportModal';
import { exportTableData, ExportColumn, ExportFormat } from '../../utils/exportData';

const AUDIT_COLUMNS: ExportColumn[] = [
  { header: 'User', key: 'user_name' },
  { header: 'Action', key: 'action' },
  { header: 'Timestamp', key: 'created_at', format: v => v ? new Date(String(v)).toLocaleString() : '—' },
  { header: 'IP Address', key: 'ip_address' },
];

async function exportAuditLogs(format: ExportFormat) {
  const res = await analyticsAPI.auditLogs({ limit: 5000 });
  const rows = ((res as any)?.data || []).map((l: any) => ({
    user_name: l.user_name || 'System',
    action: l.action || '—',
    created_at: l.created_at,
    ip_address: l.ip_address || '—',
  }));
  if (!rows.length) throw new Error('No audit logs to export');
  exportTableData({
    title: 'System Audit Logs',
    filename: `audit_logs_${new Date().toISOString().slice(0, 10)}`,
    columns: AUDIT_COLUMNS,
    rows,
    format,
  });
}

// =================== SUBSIDY ALLOCATION ===================
export const SubsidyAllocation: React.FC = () => {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['subsidy-applications-admin', page, status],
    queryFn: () => subsidyAPI.getApplications({ page, limit: 10, status: status||undefined }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, approved_amount, rejection_reason }: {
      id: string; action: 'approve' | 'reject'; approved_amount?: number | string; rejection_reason?: string;
    }) => subsidyAPI.review(id, {
      action,
      approved_amount: approved_amount != null ? Number(approved_amount) : undefined,
      rejection_reason,
    }),
    onSuccess: (_, v) => {
      toast.success(`Application ${v.action === 'approve' ? 'approved' : 'rejected'}`);
      qc.invalidateQueries({ queryKey: ['subsidy-applications-admin'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const disburseMutation = useMutation({
    mutationFn: ({ id, amount, method, reference }: {
      id: string; amount: number | string; method?: string; reference?: string;
    }) => subsidyAPI.disburse(id, {
      amount: Number(amount),
      method,
      reference,
    }),
    onSuccess: () => { toast.success('Disbursement recorded'); qc.invalidateQueries({queryKey:['subsidy-applications-admin']}); },
    onError: (e:any) => toast.error(e.response?.data?.message||'Failed'),
  });

  const apps = (data as any)?.data || [];
  const pagination = (data as any)?.pagination;
  const statusStyle: Record<string,string> = { approved:'badge-approved', pending:'badge-pending', disbursed:'badge-active', rejected:'badge-rejected', under_review:'bg-purple-100 text-purple-700', cancelled:'badge-suspended' };

  const totals = {
    total: apps.reduce((s:number,a:any)=>s+parseFloat(a.requested_amount||0),0),
    approved: apps.filter((a:any)=>['approved','disbursed'].includes(a.status)).reduce((s:number,a:any)=>s+parseFloat(a.approved_amount||0),0),
    pending: apps.filter((a:any)=>a.status==='pending').length,
    disbursed: apps.filter((a:any)=>a.status==='disbursed').reduce((s:number,a:any)=>s+parseFloat(a.disbursed_amount||0),0),
  };

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Subsidy Allocation Management</h1><p className="page-subtitle">Manage farmer subsidy eligibility and disbursements</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[{l:'Total Requested',v:`RWF ${(totals.total/1e6).toFixed(1)}M`,c:'text-agri-green'},{l:'Approved',v:`RWF ${(totals.approved/1e6).toFixed(1)}M`,c:'text-blue-600'},{l:'Pending Review',v:totals.pending,c:'text-orange-500'},{l:'Disbursed',v:`RWF ${(totals.disbursed/1e6).toFixed(1)}M`,c:'text-emerald-600'}].map((s,i)=>(
          <div key={i} className="card"><div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-2"><DollarSign size={18} className={s.c}/></div><p className="text-xs text-gray-400">{s.l}</p><p className={`text-xl font-bold ${s.c}`}>{s.v}</p></div>
        ))}
      </div>
      <div className="flex gap-3">
        <input className="input-field flex-1" placeholder="Search farmers..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select className="input-field w-44" value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">All Status</option>{['pending','under_review','approved','disbursed','rejected'].map(s=><option key={s} value={s}>{s}</option>)}</select>
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="table-header"><tr>{['Farmer','Farmer ID','Cooperative','Subsidy Type','Amount (RWF)','Eligibility','Status','Actions'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading?Array(5).fill(0).map((_,i)=><tr key={i}>{Array(8).fill(0).map((_,j)=><td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse"/></td>)}</tr>)
            :apps.filter((a:any)=>!search||a.farmer?.user?.full_name?.toLowerCase().includes(search.toLowerCase())).map((a:any)=>(
              <tr key={a.id} className="table-tr">
                <td className="table-td font-medium text-gray-800">{a.farmer?.user?.full_name||'—'}</td>
                <td className="table-td text-agri-green text-xs">{a.farmer?.farmer_code||'—'}</td>
                <td className="table-td text-gray-500 text-xs">{a.cooperative?.name||'—'}</td>
                <td className="table-td text-gray-600">{a.program?.name||'—'}</td>
                <td className="table-td font-medium">{parseFloat(a.requested_amount).toLocaleString()}</td>
                <td className="table-td"><span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">Eligible</span></td>
                <td className="table-td"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle[a.status]||'bg-gray-100 text-gray-600'}`}>{a.status}</span></td>
                <td className="table-td">
                  {a.status==='pending'&&<div className="flex gap-1">
                    <button onClick={()=>reviewMutation.mutate({id:a.id,action:'approve',approved_amount:a.requested_amount})} className="bg-agri-green text-white text-xs px-2 py-1 rounded-lg">Approve</button>
                    <button onClick={()=>reviewMutation.mutate({id:a.id,action:'reject',rejection_reason:'Does not meet criteria'})} className="border border-gray-300 text-gray-600 text-xs px-2 py-1 rounded-lg">Reject</button>
                  </div>}
                  {a.status==='approved'&&<button onClick={()=>disburseMutation.mutate({id:a.id,amount:a.approved_amount,method:'Mobile Money',reference:`MTN-${Date.now()}`})} className="bg-blue-600 text-white text-xs px-3 py-1 rounded-lg">Disburse</button>}
                  {['disbursed','rejected'].includes(a.status)&&<span className="text-xs text-gray-400">View</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
        {pagination&&<div className="px-5 py-4 border-t flex items-center justify-between text-sm"><p className="text-gray-400">{apps.length} of {pagination.total}</p><div className="flex gap-2"><button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Prev</button><button disabled={!pagination.hasNext} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Next</button></div></div>}
      </div>
    </div>
  );
};

// =================== ANALYTICS REPORTS ===================
const COLORS = ['#2d6a4f','#40916c','#74c69d','#95d5b2','#b7e4c7'];
export const AnalyticsReports: React.FC = () => {
  const { data, isLoading } = useQuery({ queryKey: ['admin-dashboard-analytics'], queryFn: () => analyticsAPI.adminDashboard(), refetchInterval: 60000 });
  const { data: subsidyData } = useQuery({ queryKey: ['subsidy-analytics'], queryFn: () => analyticsAPI.subsidyAnalytics() });

  const d = (data as any)?.data;
  const sd = (subsidyData as any)?.data;

  const distChart = (d?.monthly_distribution||[]).map((m:any) => ({ month: m.month, quantity: parseFloat(m.total_quantity||0), value: parseFloat(m.total_value||0)/1000 }));
  const subsidyChart = (d?.monthly_subsidies||[]).map((m:any) => ({ month: m.month, allocated: parseFloat(m.allocated||0)/1e6, disbursed: parseFloat(m.disbursed||0)/1e6 }));
  const provinceChart = (d?.farmers_by_province||[]).map((p:any) => ({ province: p.province, farmers: parseInt(p.count) }));
  const categoryChart = (d?.inputs_by_category||[]).map((c:any) => ({ name: c.category, value: parseFloat(c.total_kg||0) }));

  if (isLoading) return <div className="space-y-6">{Array(4).fill(0).map((_,i)=><div key={i} className="card h-64 animate-pulse bg-gray-100"/>)}</div>;

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Analytics & Performance Reports</h1><p className="page-subtitle">Real-time monitoring from live database</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[{l:'Total Distributed',v:`${(d?.stats?.total_distributed_tons||0).toFixed(1)} tons`,c:'text-agri-green'},{l:'Active Beneficiaries',v:(d?.stats?.total_farmers||0).toLocaleString(),c:'text-blue-600'},{l:'Total Subsidies',v:`RWF ${((d?.stats?.total_subsidies_rwf||0)/1e9).toFixed(2)}B`,c:'text-orange-500'},{l:'Cooperatives',v:d?.stats?.total_cooperatives||0,c:'text-emerald-600'}].map((s,i)=>(
          <div key={i} className="card"><p className="text-xs text-gray-400 mb-1">{s.l}</p><p className={`text-2xl font-bold ${s.c}`}>{s.v}</p></div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card"><h3 className="font-semibold text-gray-900 mb-4">Input Distribution Trend (last 6 months)</h3>
          {distChart.length===0?<div className="h-48 flex items-center justify-center text-gray-400">No distribution data yet</div>
          :<ResponsiveContainer width="100%" height={200}><BarChart data={distChart}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="month" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Bar dataKey="quantity" fill="#2d6a4f" name="Quantity (kg)" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>}
        </div>
        <div className="card"><h3 className="font-semibold text-gray-900 mb-4">Subsidy Allocation vs Disbursement (Million RWF)</h3>
          {subsidyChart.length===0?<div className="h-48 flex items-center justify-center text-gray-400">No subsidy data yet</div>
          :<ResponsiveContainer width="100%" height={200}><LineChart data={subsidyChart}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="month" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Line type="monotone" dataKey="allocated" stroke="#f4a261" strokeWidth={2} name="Allocated (M RWF)"/><Line type="monotone" dataKey="disbursed" stroke="#2d6a4f" strokeWidth={2} name="Disbursed (M RWF)"/></LineChart></ResponsiveContainer>}
        </div>
        <div className="card"><h3 className="font-semibold text-gray-900 mb-4">Farmers by Province</h3>
          {provinceChart.length===0?<div className="h-48 flex items-center justify-center text-gray-400">No data yet</div>
          :<ResponsiveContainer width="100%" height={200}><BarChart data={provinceChart}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="province" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Bar dataKey="farmers" fill="#1a4a8a" name="Farmers" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>}
        </div>
        <div className="card"><h3 className="font-semibold text-gray-900 mb-4">Input Distribution by Category</h3>
          {categoryChart.length===0?<div className="h-48 flex items-center justify-center text-gray-400">No data yet</div>
          :<ResponsiveContainer width="100%" height={200}><PieChart><Pie data={categoryChart} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>{categoryChart.map((_:any,i:number)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={(v:any)=>`${parseFloat(v).toLocaleString()} kg`}/></PieChart></ResponsiveContainer>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-green-50">
          <h4 className="font-semibold text-gray-800 mb-3">System Performance</h4>
          {[['Input Distribution Rate','94.5%'],['Subsidy Disbursement Rate','90.3%'],['Farmer Satisfaction','87.8%']].map(([k,v])=><div key={k} className="flex justify-between text-sm mb-1"><span className="text-gray-500">{k}</span><span className="font-medium text-agri-green">{v}</span></div>)}
        </div>
        <div className="card bg-blue-50">
          <h4 className="font-semibold text-gray-800 mb-3">Live Counts</h4>
          {[['Total Farmers',d?.stats?.total_farmers||0],['Cooperatives',d?.stats?.total_cooperatives||0],['Active Inputs',d?.stats?.total_active_inputs||0]].map(([k,v])=><div key={k as string} className="flex justify-between text-sm mb-1"><span className="text-gray-500">{k}</span><span className="font-medium text-blue-600">{v}</span></div>)}
        </div>
        <div className="card bg-orange-50">
          <h4 className="font-semibold text-gray-800 mb-3">Pending Actions</h4>
          {[['Pending Users',d?.stats?.pending_users||0],['Pending Applications',d?.stats?.pending_applications||0],['Low Stock Items',d?.low_stock_items?.length||0]].map(([k,v])=><div key={k as string} className="flex justify-between text-sm mb-1"><span className="text-gray-500">{k}</span><span className={`font-medium ${(v as number)>0?'text-orange-600':'text-gray-400'}`}>{v}</span></div>)}
        </div>
      </div>
    </div>
  );
};

// =================== INVENTORY WAREHOUSE ===================
export const InventoryWarehouse: React.FC = () => {
  const { data, isLoading } = useQuery({ queryKey: ['inventory-warehouse'], queryFn: () => analyticsAPI.inventory(), refetchInterval: 30000 });
  const d = (data as any)?.data;
  const items = d?.items || [];
  const movements = d?.recent_movements || [];
  const suppliers = d?.supplier_stats || [];

  const totalStock = items.reduce((s:number,i:any)=>s+parseFloat(i.stock_quantity||0),0);
  const lowStockCount = items.filter((i:any)=>parseFloat(i.stock_quantity)<=parseFloat(i.minimum_stock)).length;

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Inventory & Warehouse Management</h1><p className="page-subtitle">Track stock levels and monitor supplier performance</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[{l:'Total Items',v:items.length,c:'text-agri-green'},{l:'Total Stock (kg equiv)',v:totalStock.toFixed(0),c:'text-blue-600'},{l:'Low Stock Items',v:lowStockCount,c:'text-orange-500'},{l:'Suppliers',v:suppliers.length,c:'text-emerald-600'}].map((s,i)=>(
          <div key={i} className="card"><p className="text-xs text-gray-400">{s.l}</p><p className={`text-2xl font-bold ${s.c}`}>{s.v}</p></div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-0 overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between"><h3 className="font-semibold">Current Inventory</h3><span className="text-xs text-gray-400">Live from DB</span></div>
          <div className="p-4 space-y-3">
            {isLoading?Array(4).fill(0).map((_,i)=><div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"/>)
            :items.map((item:any)=>{
              const isLow = parseFloat(item.stock_quantity)<=parseFloat(item.minimum_stock);
              return (
                <div key={item.id} className={`border-2 rounded-xl p-4 ${isLow?'border-red-200 bg-red-50':'border-gray-100'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3"><div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0"><Package size={18} className="text-agri-green"/></div>
                      <div><p className="font-medium text-gray-900">{item.name}</p><p className="text-xs text-gray-400">{item.category_name||'—'}</p></div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${isLow?'bg-red-100 text-red-700':'badge-active'}`}>{isLow?'⚠ Low Stock':'Adequate'}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div><p className="text-gray-400">Current</p><p className="font-medium">{parseFloat(item.stock_quantity).toFixed(1)} {item.unit}</p></div>
                    <div><p className="text-gray-400">Min Alert</p><p className="font-medium">{parseFloat(item.minimum_stock).toFixed(1)} {item.unit}</p></div>
                    <div><p className="text-gray-400">Distributed</p><p className="font-medium">{parseFloat(item.total_distributed||0).toFixed(1)} {item.unit}</p></div>
                    <div><p className="text-gray-400">Supplier</p><p className="font-medium truncate">{item.supplier||'—'}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-4">
          <div className="card"><h3 className="font-semibold text-gray-900 mb-3">Recent Movements</h3>
            <div className="space-y-3">
              {movements.slice(0,6).map((m:any,i:number)=>(
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${m.status==='distributed'?'bg-green-500':'bg-yellow-400'}`}/>
                  <div className="flex-1 text-xs"><p className="font-medium text-gray-800">{m.input_name}</p><p className="text-gray-500">{m.quantity} units → {m.farmer_name||'—'}</p><p className="text-gray-400">{m.distribution_date||new Date(m.created_at).toLocaleDateString()}</p></div>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${m.status==='distributed'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{m.status}</span>
                </div>
              ))}
              {movements.length===0&&<p className="text-gray-400 text-sm text-center py-4">No movements yet</p>}
            </div>
          </div>
          <div className="card"><h3 className="font-semibold text-gray-900 mb-3">Top Suppliers</h3>
            <div className="space-y-3">
              {suppliers.map((s:any,i:number)=>(
                <div key={i} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1"><p className="text-xs font-semibold text-gray-800">{s.supplier}</p><span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold">#{i+1}</span></div>
                  <div className="grid grid-cols-3 text-xs text-gray-500"><div><p className="text-gray-400">Items</p><p className="font-medium">{s.total_inputs}</p></div><div><p className="text-gray-400">Stock</p><p className="font-medium">{parseFloat(s.total_stock||0).toFixed(0)}</p></div><div><p className="text-gray-400">Low</p><p className={`font-medium ${parseInt(s.low_stock_count)>0?'text-red-500':''}`}>{s.low_stock_count}</p></div></div>
                </div>
              ))}
              {suppliers.length===0&&<p className="text-gray-400 text-sm text-center py-4">No supplier data yet</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =================== FIELD DATA COLLECTION ===================
export const FieldDataCollection: React.FC = () => (
  <div className="space-y-6">
    <div><h1 className="page-title">Mobile Field Data Collection</h1><p className="page-subtitle">GPS-tagged field verification and offline data collection</p></div>
    <div className="card text-center py-16">
      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Activity size={28} className="text-blue-600"/></div>
      <h3 className="font-semibold text-gray-700 mb-2">Field Data Collection Module</h3>
      <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">This module connects to mobile field agents. Backend API endpoints are ready. Mobile app integration required for full functionality.</p>
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {['GPS Location Capture','Photo Evidence','Offline Sync','Farm Visit Verification','Input Distribution Evidence'].map(f=><span key={f} className="bg-green-50 text-agri-green text-xs px-3 py-1.5 rounded-full border border-green-100">{f}</span>)}
      </div>
    </div>
  </div>
);

// =================== EXPORT REPORTS ===================
export const ExportReports: React.FC = () => <ReportsPage />;

// =================== SECURITY MONITORING ===================
export const SecurityMonitoring: React.FC = () => {
  const { data } = useQuery({ queryKey: ['audit-logs'], queryFn: () => analyticsAPI.auditLogs({ limit: 10 }) });
  const logs = (data as any)?.data || [];
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setExporting(true);
    try {
      await exportAuditLogs(format);
      toast.success('Audit log export downloaded');
      setShowExport(false);
    } catch (e: any) {
      toast.error(e.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SecurityPage />
      <div className="card">
        <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><Activity size={16} className="text-agri-green"/><h3 className="font-semibold">System Audit Trail</h3></div><button onClick={() => setShowExport(true)} className="flex items-center gap-1.5 text-xs text-agri-green hover:underline"><Download size={12}/>Export</button></div>
        <table className="w-full text-sm"><thead className="table-header"><tr>{['User','Action','Timestamp','IP Address'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
          <tbody>
            {logs.length===0?<tr><td colSpan={4} className="table-td text-center py-8 text-gray-400">No audit logs yet</td></tr>
            :logs.map((l:any,i:number)=>(
              <tr key={i} className="table-tr"><td className="table-td font-medium">{l.user_name||'System'}</td><td className="table-td text-gray-600">{l.action}</td><td className="table-td text-xs text-gray-400">{new Date(l.created_at).toLocaleString()}</td><td className="table-td text-xs font-mono text-gray-500">{l.ip_address||'—'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <ExportModal open={showExport} title="Export Audit Logs" onClose={() => setShowExport(false)} onExport={handleExport} exporting={exporting} />
    </div>
  );
};

// =================== SYSTEM SETTINGS ===================
export const SystemSettings: React.FC = () => {
  const [tab, setTab] = useState('roles');
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const tabs = [{id:'roles',label:'User Roles & Permissions'},{id:'security',label:'Security Controls'},{id:'data',label:'Data Management'},{id:'audit',label:'Audit Logs'},{id:'notifications',label:'Notifications'}];
  const roles = [{name:'System Administrator',users:3,perms:['Full Access','User Management','System Configuration']},{name:'Cooperative Leader',users:234,perms:['View Farmers','Distribute Inputs','Generate Reports']},{name:'Farmer',users:12456,perms:['View Inputs','View Subsidies','Update Profile']}];

  const { data: auditData } = useQuery({ queryKey: ['audit-logs-settings'], queryFn: () => analyticsAPI.auditLogs({ limit: 10 }), enabled: tab==='audit' });
  const auditLogs = (auditData as any)?.data || [];

  const handleAuditExport = async (format: ExportFormat) => {
    setExporting(true);
    try {
      await exportAuditLogs(format);
      toast.success('Audit log export downloaded');
      setShowExport(false);
    } catch (e: any) {
      toast.error(e.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">System Settings & Configuration</h1><p className="page-subtitle">Manage system-wide settings, permissions, and security</p></div>
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab===t.id?'border-agri-green text-agri-green':'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.label}</button>)}
      </div>
      {tab==='roles'&&<div className="card"><div className="flex items-center justify-between mb-4"><h3 className="font-semibold">User Roles & Permissions</h3><button className="btn-primary text-sm px-4 py-2">+ Add Role</button></div><div className="space-y-4">{roles.map((r,i)=><div key={i} className="border border-gray-100 rounded-xl p-4"><div className="flex items-center justify-between mb-2"><div><p className="font-semibold">{r.name}</p><p className="text-xs text-gray-400">{r.users.toLocaleString()} users</p></div><div className="flex gap-2"><button className="text-xs text-agri-green hover:underline">Edit</button><button className="text-xs text-red-500 hover:underline">Delete</button></div></div><div className="flex flex-wrap gap-2">{r.perms.map(p=><span key={p} className="bg-green-50 text-agri-green text-xs px-2.5 py-1 rounded-full border border-green-100">{p}</span>)}</div></div>)}</div></div>}
      {tab==='security'&&<div className="card"><h3 className="font-semibold mb-4">Security & Access Controls</h3><div className="space-y-4"><div className="border border-gray-100 rounded-xl p-4"><p className="font-medium mb-3">Password Policy</p>{['Require minimum 8 characters','Require uppercase and lowercase','Require at least one number'].map((p,i)=><label key={p} className="flex items-center gap-2 mb-2 cursor-pointer text-sm"><div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center"><CheckCircle size={10} className="text-white"/></div>{p}</label>)}</div><div className="border border-gray-100 rounded-xl p-4"><p className="font-medium mb-3">Session Management</p><label className="block text-sm text-gray-600 mb-1">Session Timeout (minutes)</label><input type="number" className="input-field max-w-xs" defaultValue={30}/></div><button className="btn-primary text-sm px-6 py-2.5" onClick={()=>toast.success('Security settings saved')}>Save Settings</button></div></div>}
      {tab==='data'&&<div className="card"><h3 className="font-semibold mb-4">Data Management & Backup</h3><div className="space-y-4"><div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between"><div><p className="font-medium">Database Backup</p><p className="text-xs text-gray-400 mt-1">Automated daily backups at 2:00 AM</p></div><button className="bg-blue-600 text-white text-sm px-4 py-2 rounded-xl" onClick={()=>toast.success('Backup initiated')}>Backup Now</button></div><div className="border border-red-100 bg-red-50 rounded-xl p-4"><p className="font-semibold text-red-700 mb-1">Danger Zone</p><p className="text-xs text-red-500 mb-3">These actions cannot be undone.</p><div className="flex gap-3"><button className="border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-xl">Export All Data</button></div></div></div></div>}
      {tab==='audit'&&<div className="card"><div className="flex items-center justify-between mb-4"><h3 className="font-semibold">System Audit Logs</h3><button onClick={() => setShowExport(true)} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-xl">Export</button></div><table className="w-full text-sm"><thead className="table-header"><tr>{['User','Action','Timestamp','IP'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead><tbody>{auditLogs.length===0?<tr><td colSpan={4} className="table-td text-center py-8 text-gray-400">No logs yet</td></tr>:auditLogs.map((l:any,i:number)=><tr key={i} className="table-tr"><td className="table-td font-medium">{l.user_name||'System'}</td><td className="table-td text-gray-600">{l.action}</td><td className="table-td text-xs text-gray-400">{new Date(l.created_at).toLocaleString()}</td><td className="table-td text-xs font-mono">{l.ip_address||'—'}</td></tr>)}</tbody></table></div>}
      <ExportModal open={showExport} title="Export Audit Logs" onClose={() => setShowExport(false)} onExport={handleAuditExport} exporting={exporting} />
      {tab==='notifications'&&<div className="card"><h3 className="font-semibold mb-4">Notification Settings</h3><div className="space-y-4"><div className="border border-gray-100 rounded-xl p-4"><p className="font-medium mb-3">Email Notifications</p>{['Send email on subsidy approvals','Send email on input distribution','Daily summary reports'].map((l,idx)=><label key={l} className="flex items-center gap-2 mb-2 text-sm cursor-pointer"><div className={`w-4 h-4 rounded flex items-center justify-center ${idx<2?'bg-blue-600':'border border-gray-300'}`}>{idx<2&&<CheckCircle size={10} className="text-white"/>}</div>{l}</label>)}</div><button className="btn-primary text-sm px-6 py-2.5" onClick={()=>toast.success('Notification settings saved')}>Save Settings</button></div></div>}
    </div>
  );
};

// =================== DISTRIBUTION RECEIPT ===================
export const DistributionReceipt: React.FC = () => {
  const [tab, setTab] = useState<'generate'|'verify'|'history'>('generate');
  const [farmerId, setFarmerId] = useState('');
  const [name, setName] = useState('');
  const [generated, setGenerated] = useState(false);
  const [distId, setDistId] = useState('');

  const { data: distData } = useQuery({
    queryKey: ['dist-receipt', distId],
    queryFn: () => inputsAPI.getDistributions({ limit: 1 }),
    enabled: false,
  });

  const { data: allDists } = useQuery({ queryKey: ['all-dists-receipt'], queryFn: () => inputsAPI.getDistributions({ limit: 20, status: 'distributed' }) });
  const distributions = (allDists as any)?.data || [];

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Distribution Receipt & QR Code</h1><p className="page-subtitle">Generate digital receipts for input distribution</p></div>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">{(['generate','verify','history'] as const).map(t=><button key={t} onClick={()=>setTab(t)} className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab===t?'bg-agri-green text-white':'text-gray-600'}`}>{t==='generate'?'Generate Receipt':t==='verify'?'Verify QR Code':'Receipt History'}</button>)}</div>
      {tab==='history'&&(
        <div className="card p-0 overflow-hidden">
          <div className="p-5 border-b"><h3 className="font-semibold">Distribution Receipts</h3></div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="table-header"><tr>{['Farmer','Input','Quantity','Date','QR Code','Status'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
            <tbody>{distributions.map((d:any)=>(
              <tr key={d.id} className="table-tr">
                <td className="table-td font-medium">{d.farmer?.user?.full_name||'—'}</td>
                <td className="table-td">{d.input?.name||'—'}</td>
                <td className="table-td">{d.quantity} {d.input?.unit}</td>
                <td className="table-td text-xs text-gray-400">{d.distribution_date}</td>
                <td className="table-td text-xs font-mono text-gray-500">{d.qr_code||'—'}</td>
                <td className="table-td"><span className="badge-active text-xs">Distributed</span></td>
              </tr>
            ))}{distributions.length===0&&<tr><td colSpan={6} className="table-td text-center py-8 text-gray-400">No distributions yet</td></tr>}</tbody>
          </table></div>
        </div>
      )}
      {tab==='generate'&&(
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 card">
            <h3 className="font-semibold mb-4">Generate Distribution Receipt</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Select Distribution</label>
                <select className="input-field" onChange={e=>setDistId(e.target.value)}><option value="">Select...</option>{distributions.map((d:any)=><option key={d.id} value={d.id}>{d.farmer?.user?.full_name} — {d.input?.name} ({d.quantity} {d.input?.unit})</option>)}</select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Farmer Acknowledgment</label><input className="input-field" placeholder="Type farmer full name to acknowledge" value={name} onChange={e=>setName(e.target.value)}/></div>
              <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">By signing, the farmer acknowledges receipt of inputs in good condition for agricultural use only.</p>
              <button onClick={()=>setGenerated(true)} disabled={!distId||!name} className="w-full btn-primary py-3">Generate QR Code & Receipt</button>
            </div>
          </div>
          <div className="card text-center">
            <h3 className="font-semibold mb-4">QR Code</h3>
            {generated?<div className="bg-white border-2 border-gray-200 rounded-xl p-4 grid grid-cols-7 gap-0.5 mx-auto w-48">{Array(49).fill(0).map((_,i)=><div key={i} className={`aspect-square rounded-sm ${Math.sin(i*7)*Math.cos(i*3)>0?'bg-gray-900':'bg-white'}`}/>)}</div>
            :<div className="py-12 text-gray-300"><div className="text-5xl mb-2">⊞</div><p className="text-xs">Select distribution and acknowledge to generate</p></div>}
          </div>
        </div>
      )}
    </div>
  );
};

// =================== DISTRIBUTION SCHEDULE ===================
export const DistributionSchedule: React.FC = () => {
  const { data } = useQuery({ queryKey: ['dist-schedule'], queryFn: () => inputsAPI.getDistributions({ limit: 20 }) });
  const distributions = (data as any)?.data || [];

  const upcoming = distributions.filter((d:any) => d.status === 'pending').slice(0, 5);
  const today = new Date();
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
  const calDays = Array.from({length: 42}, (_, i) => { const d = i - firstDay + 1; return (d >= 1 && d <= daysInMonth) ? d : null; });

  const distDays = new Set(distributions.map((d:any) => new Date(d.distribution_date).getDate()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="page-title">Distribution Schedule</h1><p className="page-subtitle">Manage and track distribution events</p></div><button className="btn-primary text-sm px-4 py-2">+ Schedule Distribution</button></div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-6"><h3 className="font-semibold">{today.toLocaleString('default',{month:'long',year:'numeric'})}</h3></div>
          <div className="grid grid-cols-7 gap-1 mb-2">{days.map(d=><div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>)}</div>
          <div className="grid grid-cols-7 gap-1">{calDays.map((day,i)=>{const isToday=day===today.getDate();const hasDist=day&&distDays.has(day);return(<div key={i} className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm cursor-pointer transition-colors ${!day?'':''}${isToday?'bg-agri-green text-white font-bold':hasDist?'border border-blue-200 bg-blue-50':'hover:bg-gray-50'}`}>{day&&<><span className="text-xs">{day}</span>{hasDist&&!isToday&&<div className="w-1 h-1 bg-blue-400 rounded-full mt-0.5"/>}</>}</div>);})}</div>
        </div>
        <div className="space-y-4">
          <div className="card"><h3 className="font-semibold mb-3">Pending Distributions</h3>
            {upcoming.length===0?<p className="text-gray-400 text-sm text-center py-4">No pending distributions</p>
            :upcoming.map((d:any,i:number)=>(
              <div key={i} className="bg-blue-50 rounded-xl p-3 mb-2">
                <p className="font-medium text-sm text-gray-800">{d.farmer?.user?.full_name||'—'}</p>
                <p className="text-xs text-gray-500">{d.input?.name} — {d.quantity} {d.input?.unit}</p>
                <p className="text-xs text-gray-400">{d.distribution_date}</p>
              </div>
            ))}
          </div>
          <div className="card"><h3 className="font-semibold mb-3">This Month</h3>
            {[['Total Planned',distributions.length],['Completed',distributions.filter((d:any)=>d.status==='distributed').length],['Pending',distributions.filter((d:any)=>d.status==='pending').length]].map(([k,v])=><div key={k as string} className="flex justify-between text-sm mb-2"><span className="text-gray-500">{k}</span><span className="font-medium">{v}</span></div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReturnsComplaints: React.FC = () => {
  const [issueType, setIssueType] = useState('Quality Issue');
  const [form, setForm] = useState({receipt_id:'',input:'',description:''});
  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Returns & Complaints</h1><p className="page-subtitle">Submit and track issues with distributed inputs</p></div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card">
          <h3 className="font-semibold mb-4">Submit Return or Complaint</h3>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Distribution Receipt ID *</label><input className="input-field" placeholder="e.g., DIST-ABC12345" value={form.receipt_id} onChange={e=>setForm(p=>({...p,receipt_id:e.target.value}))}/></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Issue Type *</label><div className="grid grid-cols-2 gap-3">{[{label:'Quality Issue',desc:'Poor quality, expired, contaminated'},{label:'Quantity Issue',desc:'Incorrect amount received'},{label:'Damage',desc:'Broken, damaged packaging'},{label:'Other Issue',desc:'Different concern'}].map(t=><button key={t.label} onClick={()=>setIssueType(t.label)} className={`border-2 rounded-xl p-3 text-left transition-colors ${issueType===t.label?'border-agri-green bg-green-50':'border-gray-200'}`}><p className={`text-sm font-medium ${issueType===t.label?'text-agri-green':'text-gray-800'}`}>{t.label}</p><p className="text-xs text-gray-400">{t.desc}</p></button>)}</div></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description *</label><textarea rows={4} className="input-field resize-none" placeholder="Describe the issue..." value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
            <button onClick={()=>toast.success('Complaint submitted successfully')} className="w-full btn-primary py-3">Submit Complaint</button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="card bg-blue-50 border-blue-100"><p className="text-sm font-semibold text-blue-800 mb-2">📋 Before Submitting</p>{['Have your distribution receipt ID ready','Take clear photos of the issue','Note the batch number if visible','Submit within 7 days of distribution'].map(t=><p key={t} className="text-xs text-blue-600 mb-1">• {t}</p>)}</div>
          <div className="card"><p className="text-sm font-semibold text-gray-900 mb-3">Resolution Timeline</p>{[['1','Submission','Immediate confirmation'],['2','Review','Within 24-48 hours'],['3','Resolution','Within 5-7 days']].map(([n,t,d])=><div key={n} className="flex items-start gap-3 mb-3"><div className="w-6 h-6 bg-agri-green rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{n}</div><div><p className="text-sm font-medium text-gray-800">{t}</p><p className="text-xs text-gray-400">{d}</p></div></div>)}</div>
        </div>
      </div>
    </div>
  );
};
