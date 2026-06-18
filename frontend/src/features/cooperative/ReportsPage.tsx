import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsAPI, inputsAPI, subsidyAPI } from '../../api/client';
import { QueryErrorBanner } from '../../components/common';
import ExportModal from '../../components/common/ExportModal';
import { exportTableData, ExportColumn, ExportFormat } from '../../utils/exportData';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
  { label: 'Input Distribution', desc: 'Seeds, fertilizers, and equipment' },
  { label: 'Subsidy Allocation', desc: 'Subsidy payments and approvals' },
  { label: 'Beneficiary Database', desc: 'Farmer records and registration' },
  { label: 'Performance Analytics', desc: 'System metrics and trends' },
] as const;

export default function ReportsPage() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<string>('Input Distribution');
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const inRange = (dateStr?: string) => {
    if (!dateStr) return true;
    const d = dateStr.slice(0, 10);
    return d >= from && d <= to;
  };

  const fetchReportData = async (): Promise<{ columns: ExportColumn[]; rows: Record<string, unknown>[]; title: string }> => {
    if (reportType === 'Input Distribution') {
      const res = await inputsAPI.getDistributions({ limit: 5000, status: 'distributed' });
      const rows = ((res as any)?.data || [])
        .filter((d: any) => inRange(d.distribution_date))
        .map((d: any) => ({
          farmer: d.farmer?.user?.full_name || '—',
          input: d.input?.name || '—',
          quantity: `${d.quantity} ${d.input?.unit || ''}`,
          cooperative: d.cooperative?.name || '—',
          date: d.distribution_date || '—',
          value: parseFloat(String(d.total_amount || 0)),
          status: d.status,
        }));
      return {
        title: 'Input Distribution Report',
        columns: [
          { header: 'Farmer', key: 'farmer' },
          { header: 'Input', key: 'input' },
          { header: 'Quantity', key: 'quantity' },
          { header: 'Cooperative', key: 'cooperative' },
          { header: 'Date', key: 'date' },
          { header: 'Value (RWF)', key: 'value', format: v => String(v) },
          { header: 'Status', key: 'status' },
        ],
        rows,
      };
    }

    if (reportType === 'Subsidy Allocation') {
      const res = await subsidyAPI.getApplications({ limit: 5000 });
      const rows = ((res as any)?.data || [])
        .filter((a: any) => inRange(a.created_at?.slice(0, 10)))
        .map((a: any) => ({
          farmer: a.farmer?.user?.full_name || '—',
          program: a.program?.name || '—',
          requested: parseFloat(String(a.requested_amount || 0)),
          approved: parseFloat(String(a.approved_amount || 0)),
          disbursed: parseFloat(String(a.disbursed_amount || 0)),
          status: a.status,
          date: a.created_at?.slice(0, 10) || '—',
        }));
      return {
        title: 'Subsidy Allocation Report',
        columns: [
          { header: 'Farmer', key: 'farmer' },
          { header: 'Program', key: 'program' },
          { header: 'Requested (RWF)', key: 'requested', format: v => String(v) },
          { header: 'Approved (RWF)', key: 'approved', format: v => String(v) },
          { header: 'Disbursed (RWF)', key: 'disbursed', format: v => String(v) },
          { header: 'Status', key: 'status' },
          { header: 'Date', key: 'date' },
        ],
        rows,
      };
    }

    if (reportType === 'Beneficiary Database') {
      const res = await analyticsAPI.getBeneficiaries({ limit: 5000 });
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
      return {
        title: 'Beneficiary Database Report',
        columns: [
          { header: 'Farmer Name', key: 'full_name' },
          { header: 'Farmer ID', key: 'farmer_code' },
          { header: 'Phone', key: 'phone' },
          { header: 'Cooperative', key: 'cooperative_name' },
          { header: 'Location', key: 'district' },
          { header: 'Received Inputs', key: 'input_count', format: v => String(v) },
          { header: 'Subsidy (RWF)', key: 'subsidy_amount', format: v => String(v) },
          { header: 'Status', key: 'status' },
        ],
        rows,
      };
    }

    const res = user?.role === 'admin'
      ? await analyticsAPI.adminDashboard()
      : await analyticsAPI.cooperativeDashboard();
    const data = (res as any)?.data || {};
    const stats = data.stats || {};
    const rows = user?.role === 'admin'
      ? [
          { metric: 'Total Farmers', value: stats.total_farmers ?? 0 },
          { metric: 'Total Cooperatives', value: stats.total_cooperatives ?? 0 },
          { metric: 'Total Subsidy Disbursed (RWF)', value: stats.total_subsidy_disbursed ?? 0 },
          { metric: 'Total Inputs Distributed', value: stats.total_inputs_distributed ?? 0 },
          { metric: 'Pending Approvals', value: stats.pending_approvals ?? 0 },
        ]
      : [
          { metric: 'Total Farmers', value: stats.total_farmers ?? 0 },
          { metric: 'Total Distributed (kg)', value: stats.total_distributed_kg ?? 0 },
          { metric: 'Pending Distributions', value: stats.pending_distributions ?? 0 },
          { metric: 'Total Distributed Value (RWF)', value: stats.total_distributed_value ?? 0 },
        ];
    return {
      title: 'Performance Analytics Report',
      columns: [
        { header: 'Metric', key: 'metric' },
        { header: 'Value', key: 'value', format: v => String(v) },
      ],
      rows,
    };
  };

  const handleExport = async (format: ExportFormat) => {
    setExporting(true);
    try {
      const { title, columns, rows } = await fetchReportData();
      if (!rows.length) {
        toast.error('No data found for the selected report and date range');
        return;
      }
      exportTableData({
        title: `${title} (${from} to ${to})`,
        filename: `${reportType.replace(/\s+/g, '_').toLowerCase()}_${from}_${to}`,
        columns,
        rows,
        format,
      });
      toast.success('Report downloaded');
      setShowExport(false);
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Report Generation & Export</h1>
        <p className="page-subtitle">Generate custom reports with filters and export options</p>
      </div>

      {loadError && <QueryErrorBanner message="Some report data could not be loaded." onRetry={() => setLoadError(false)} />}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card">
          <div className="flex items-center gap-2 mb-5">
            <FileText size={18} className="text-agri-green" />
            <h3 className="font-semibold">Generate New Report</h3>
          </div>
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-3">Select Report Type</p>
            <div className="grid grid-cols-2 gap-3">
              {REPORT_TYPES.map(t => (
                <button
                  key={t.label}
                  onClick={() => setReportType(t.label)}
                  className={`border-2 rounded-xl p-4 text-left transition-colors ${
                    reportType === t.label ? 'border-agri-green bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className={`text-sm font-medium ${reportType === t.label ? 'text-agri-green' : 'text-gray-800'}`}>{t.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-2">Date Range</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">From</label>
                <input type="date" className="input-field" value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">To</label>
                <input type="date" className="input-field" value={to} onChange={e => setTo(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowExport(true)}
              className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
            >
              <Download size={18} /> Generate & Download Report
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Export Formats</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Excel Spreadsheet (.xlsx)</li>
            <li>• PDF Document (.pdf)</li>
            <li>• Word Document (.doc)</li>
          </ul>
          <p className="text-xs text-gray-400 mt-4">
            Click &quot;Generate & Download Report&quot; to choose your format and download the file.
          </p>
        </div>
      </div>

      <ExportModal
        open={showExport}
        title={`Export: ${reportType}`}
        onClose={() => setShowExport(false)}
        onExport={handleExport}
        exporting={exporting}
      />
    </div>
  );
}
