import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportFormat = 'excel' | 'pdf' | 'word';

export interface ExportColumn {
  header: string;
  key: string;
  format?: (value: unknown, row: Record<string, unknown>) => string;
}

function cellValue(col: ExportColumn, row: Record<string, unknown>): string {
  const raw = row[col.key];
  if (col.format) return col.format(raw, row);
  if (raw == null || raw === '') return '—';
  return String(raw);
}

function buildRows(columns: ExportColumn[], rows: Record<string, unknown>[]) {
  return rows.map(row => columns.map(col => cellValue(col, row)));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportExcel(filename: string, columns: ExportColumn[], rows: Record<string, unknown>[]) {
  const data = rows.map(row => {
    const obj: Record<string, string> = {};
    columns.forEach(col => { obj[col.header] = cellValue(col, row); });
    return obj;
  });
  const sheet = XLSX.utils.json_to_sheet(data);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Report');
  XLSX.writeFile(book, `${filename}.xlsx`);
}

function exportPdf(title: string, filename: string, columns: ExportColumn[], rows: Record<string, unknown>[]) {
  const doc = new jsPDF({ orientation: rows.length > 8 ? 'landscape' : 'portrait' });
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
  autoTable(doc, {
    head: [columns.map(c => c.header)],
    body: buildRows(columns, rows),
    startY: 28,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [34, 139, 34] },
  });
  doc.save(`${filename}.pdf`);
}

function exportWord(title: string, filename: string, columns: ExportColumn[], rows: Record<string, unknown>[]) {
  const headerCells = columns.map(c => `<th style="border:1px solid #ccc;padding:6px;background:#228B22;color:#fff;">${c.header}</th>`).join('');
  const bodyRows = buildRows(columns, rows).map(cells =>
    `<tr>${cells.map(c => `<td style="border:1px solid #ccc;padding:6px;">${c.replace(/</g, '&lt;')}</td>`).join('')}</tr>`
  ).join('');

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>${title}</title></head>
<body>
  <h2>${title}</h2>
  <p style="font-size:12px;color:#666;">Generated: ${new Date().toLocaleString()}</p>
  <table style="border-collapse:collapse;width:100%;font-size:12px;">
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body></html>`;

  downloadBlob(new Blob(['\ufeff', html], { type: 'application/msword' }), `${filename}.doc`);
}

export function exportTableData(options: {
  title: string;
  filename: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  format: ExportFormat;
}) {
  const { title, filename, columns, rows, format } = options;
  if (!rows.length) throw new Error('No data to export');

  const safeName = filename.replace(/[^\w\-]+/g, '_').slice(0, 80);

  if (format === 'excel') exportExcel(safeName, columns, rows);
  else if (format === 'pdf') exportPdf(title, safeName, columns, rows);
  else exportWord(title, safeName, columns, rows);
}

export const EXPORT_FORMATS: { id: ExportFormat; label: string }[] = [
  { id: 'excel', label: 'Excel Spreadsheet (.xlsx)' },
  { id: 'pdf', label: 'PDF Document (.pdf)' },
  { id: 'word', label: 'Word Document (.doc)' },
];
