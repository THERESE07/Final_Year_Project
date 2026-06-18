import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download } from 'lucide-react';
import { inputsAPI, subsidyAPI } from '../../api/client';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('Input Distribution');
  const [format, setFormat] = useState('PDF Document');
  const [from, setFrom] = useState(new Date(Date.now()-30*24*3600*1000).toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);

  const { data: distData } = useQuery({ queryKey: ['report-distributions'], queryFn: () => inputsAPI.getDistributions({ limit: 5, status: 'distributed' }) });
  const { data: subData } = useQuery({ queryKey: ['report-subsidies'], queryFn: () => subsidyAPI.getApplications({ limit: 5 }) });

  const distributions = (distData as any)?.data || [];
  const applications = (subData as any)?.data || [];

  const handleGenerate = () => toast.success(`Generating ${reportType} report (${format})...`);

  const types = [
    {label:'Input Distribution',desc:'Seeds, fertilizers, and equipment'},
    {label:'Subsidy Allocation',desc:'Subsidy payments and approvals'},
    {label:'Beneficiary Database',desc:'Farmer records and registration'},
    {label:'Performance Analytics',desc:'System metrics and trends'},
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Report Generation & Export</h1><p className="page-subtitle">Generate custom reports with filters and export options</p></div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card">
          <div className="flex items-center gap-2 mb-5"><FileText size={18} className="text-agri-green"/><h3 className="font-semibold">Generate New Report</h3></div>
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-3">Select Report Type</p>
            <div className="grid grid-cols-2 gap-3">
              {types.map(t=><button key={t.label} onClick={()=>setReportType(t.label)} className={`border-2 rounded-xl p-4 text-left transition-colors ${reportType===t.label?'border-agri-green bg-green-50':'border-gray-200 hover:border-gray-300'}`}><p className={`text-sm font-medium ${reportType===t.label?'text-agri-green':'text-gray-800'}`}>{t.label}</p><p className="text-xs text-gray-400 mt-0.5">{t.desc}</p></button>)}
            </div>
          </div>
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-2">Date Range</p>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs text-gray-400 mb-1">From</label><input type="date" className="input-field" value={from} onChange={e=>setFrom(e.target.value)}/></div>
              <div><label className="block text-xs text-gray-400 mb-1">To</label><input type="date" className="input-field" value={to} onChange={e=>setTo(e.target.value)}/></div>
            </div>
          </div>
          <div className="mb-5">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Province</label><select className="input-field"><option>All Provinces</option>{['Kigali','Northern','Southern','Eastern','Western'].map(p=><option key={p}>{p}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Cooperative</label><select className="input-field"><option>All Cooperatives</option></select></div>
            </div>
          </div>
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-3">Export Format</p>
            <div className="flex gap-6">
              {['PDF Document','Excel Spreadsheet'].map(f=>(
                <label key={f} className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${format===f?'border-agri-green':'border-gray-300'}`}>{format===f&&<div className="w-2 h-2 bg-agri-green rounded-full"/>}</div>
                  <input type="radio" className="sr-only" checked={format===f} onChange={()=>setFormat(f)}/>
                  <span className="text-sm text-gray-700">{f}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleGenerate} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"><Download size={18}/>Generate & Download Report</button>
            <button className="px-6 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Preview</button>
          </div>
          <div className="mt-6 pt-5 border-t">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick Templates</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[{l:'Monthly Summary',d:'All activities for current month'},{l:'Quarterly Report',d:'Comprehensive quarterly analysis'},{l:'Cooperative Specific',d:'Individual cooperative report'},{l:'Custom Range',d:'Define your own parameters'}].map(t=>(
                <button key={t.l} onClick={()=>toast.success(`${t.l} template loaded`)} className="text-left border border-gray-200 rounded-xl p-3 hover:border-agri-green hover:bg-green-50 transition-colors"><p className="text-xs font-medium text-gray-800">{t.l}</p><p className="text-xs text-gray-400 mt-0.5">{t.d}</p></button>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Data Summary</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Recent Distributions</p>
              {distributions.slice(0,3).map((d:any,i:number)=>(
                <div key={i} className="border border-gray-100 rounded-xl p-3 mb-2">
                  <p className="text-xs font-medium text-gray-800">{d.farmer?.user?.full_name} — {d.input?.name}</p>
                  <p className="text-xs text-gray-400">{d.quantity} {d.input?.unit} · {d.distribution_date}</p>
                  <button className="flex items-center gap-1 text-xs text-agri-green mt-1 hover:underline"><Download size={10}/>Download</button>
                </div>
              ))}
              {distributions.length===0&&<p className="text-xs text-gray-400 py-2">No distributions yet</p>}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Recent Applications</p>
              {applications.slice(0,3).map((a:any,i:number)=>(
                <div key={i} className="border border-gray-100 rounded-xl p-3 mb-2">
                  <p className="text-xs font-medium text-gray-800">{a.farmer?.user?.full_name}</p>
                  <p className="text-xs text-gray-400">RWF {parseFloat(a.requested_amount).toLocaleString()} · {a.status}</p>
                  <button className="flex items-center gap-1 text-xs text-agri-green mt-1 hover:underline"><Download size={10}/>Download</button>
                </div>
              ))}
              {applications.length===0&&<p className="text-xs text-gray-400 py-2">No applications yet</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
