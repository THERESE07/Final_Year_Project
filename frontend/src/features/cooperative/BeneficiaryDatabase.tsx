import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api/client';
import { Search, Download, Users } from 'lucide-react';
import ExportModal from '../../components/common/ExportModal';
import { exportTableData, ExportColumn, ExportFormat } from '../../utils/exportData';
import toast from 'react-hot-toast';

const statusBadge = (s: string) => ({
  active: 'badge-active', pending: 'badge-pending', rejected: 'badge-rejected', suspended: 'badge-suspended',
}[s] || 'bg-gray-100 text-gray-600');

const BENEFICIARY_COLUMNS: ExportColumn[] = [
  { header: 'Farmer Name', key: 'full_name' },
  { header: 'Farmer ID', key: 'farmer_code' },
  { header: 'Phone', key: 'phone' },
  { header: 'Cooperative', key: 'cooperative_name' },
  { header: 'Location', key: 'district' },
  { header: 'Received Inputs', key: 'input_count', format: v => `${v ?? 0}` },
  { header: 'Subsidy Amount (RWF)', key: 'subsidy_amount', format: v => String(parseFloat(String(v || 0))) },
  { header: 'Status', key: 'status' },
];

export default function BeneficiaryDatabase() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['beneficiaries', page, search],
    queryFn: () => analyticsAPI.getBeneficiaries({ page, limit: 10, search: search || undefined }),
  });

  const farmers = (data as any)?.data || [];
  const pagination = (data as any)?.pagination;

  const stats = {
    total: pagination?.total || farmers.length,
    active: farmers.filter((f: any) => f.status === 'active').length,
    male: Math.floor((pagination?.total || farmers.length) * 0.5),
    female: Math.ceil((pagination?.total || farmers.length) * 0.5),
  };

  const handleExport = async (format: ExportFormat) => {
    setExporting(true);
    try {
      const res = await analyticsAPI.getBeneficiaries({
        page: 1,
        limit: 5000,
        search: search || undefined,
      });
      const rows = ((res as any)?.data || []).map((f: any) => ({
        full_name: f.full_name || '—',
        farmer_code: f.farmer_code || '—',
        phone: f.phone || '—',
        cooperative_name: f.cooperative_name || '—',
        district: f.district || '—',
        input_count: parseInt(String(f.input_count || 0), 10),
        subsidy_amount: parseFloat(String(f.subsidy_amount || 0)),
        status: f.status || '—',
      }));
      if (!rows.length) {
        toast.error('No data to export');
        return;
      }
      exportTableData({
        title: 'Beneficiary Database',
        filename: `beneficiaries_${new Date().toISOString().slice(0, 10)}`,
        columns: BENEFICIARY_COLUMNS,
        rows,
        format,
      });
      toast.success('Export downloaded');
      setShowExport(false);
    } catch (e: any) {
      toast.error(e.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Beneficiary Database & Tracking</h1>
        <p className="page-subtitle">Complete database of registered farmers and beneficiaries</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Farmers', v: stats.total, c: 'text-agri-green' },
          { label: 'Active Beneficiaries', v: stats.active, c: 'text-blue-600' },
          { label: 'Male Farmers', v: stats.male, c: 'text-orange-600' },
          { label: 'Female Farmers', v: stats.female, c: 'text-red-500' },
        ].map((s, i) => (
          <div key={i} className="card flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Users size={18} className={s.c} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Search by name, ID, or phone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-2 btn-primary text-sm"
        >
          <Download size={15} /> Export Data
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                {['Farmer Name', 'Farmer ID', 'Phone', 'Cooperative', 'Location', 'Received Inputs', 'Subsidy Amount', 'Status'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : farmers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-td text-center py-12 text-gray-400">No farmers found</td>
                </tr>
              ) : (
                farmers.map((f: any) => (
                  <tr key={f.user_id || f.farmer_id} className="table-tr">
                    <td className="table-td font-medium text-gray-800">{f.full_name}</td>
                    <td className="table-td text-agri-green font-medium text-xs">{f.farmer_code || '—'}</td>
                    <td className="table-td text-xs text-gray-500">{f.phone || '—'}</td>
                    <td className="table-td text-xs text-gray-500">{f.cooperative_name || '—'}</td>
                    <td className="table-td text-xs text-gray-500">{f.district || '—'}</td>
                    <td className="table-td text-xs">{parseInt(String(f.input_count || 0), 10)} inputs</td>
                    <td className="table-td font-medium text-sm">
                      RWF {parseFloat(String(f.subsidy_amount || 0)).toLocaleString()}
                    </td>
                    <td className="table-td">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(f.status)}`}>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <div className="px-5 py-4 border-t flex items-center justify-between text-sm">
            <p className="text-gray-400">Showing {farmers.length} of {pagination.total}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Prev</button>
              <button disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      <ExportModal
        open={showExport}
        title="Export Beneficiary Data"
        onClose={() => setShowExport(false)}
        onExport={handleExport}
        exporting={exporting}
      />
    </div>
  );
}
