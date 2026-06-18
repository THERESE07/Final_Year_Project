import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import { EXPORT_FORMATS, ExportFormat } from '../../utils/exportData';

interface ExportModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  onExport: (format: ExportFormat) => void | Promise<void>;
  exporting?: boolean;
}

export default function ExportModal({
  open,
  title = 'Export Data',
  onClose,
  onExport,
  exporting = false,
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('excel');

  if (!open) return null;

  const handleExport = async () => {
    await onExport(format);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-lg">{title}</h2>
          <button onClick={onClose} disabled={exporting}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-500">Choose a file format for your download.</p>
          <div className="space-y-2">
            {EXPORT_FORMATS.map(f => (
              <label
                key={f.id}
                className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer transition-colors ${
                  format === f.id ? 'border-agri-green bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="export-format"
                  className="sr-only"
                  checked={format === f.id}
                  onChange={() => setFormat(f.id)}
                />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  format === f.id ? 'border-agri-green' : 'border-gray-300'
                }`}>
                  {format === f.id && <div className="w-2 h-2 bg-agri-green rounded-full" />}
                </div>
                <span className="text-sm text-gray-800">{f.label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} disabled={exporting} className="btn-secondary flex-1 py-2.5">Cancel</button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download size={16} />
              {exporting ? 'Exporting...' : 'Download'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
