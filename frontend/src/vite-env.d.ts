/// <reference types="vite/client" />

declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';
  function autoTable(doc: jsPDF, options: Record<string, unknown>): void;
  export default autoTable;
}
