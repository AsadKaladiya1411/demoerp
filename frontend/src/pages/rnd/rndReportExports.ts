import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export type ReportColumn<T extends Record<string, unknown>> = {
  header: string;
  accessor: keyof T;
  format?: (value: T[keyof T], row: T) => string;
};

const fileSafe = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const exportReportToExcel = <T extends Record<string, unknown>>(title: string, columns: ReportColumn<T>[], rows: T[]) => {
  const sheetRows = [
    columns.map(column => column.header),
    ...rows.map(row => columns.map(column => {
      const value = row[column.accessor];
      return column.format ? column.format(value, row) : String(value ?? '');
    })),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  XLSX.writeFile(workbook, `${fileSafe(title)}.xlsx`);
};

export const exportReportToPdf = <T extends Record<string, unknown>>(title: string, columns: ReportColumn<T>[], rows: T[]) => {
  const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait' });
  doc.setFontSize(16);
  doc.text(title, 14, 16);
  autoTable(doc, {
    startY: 22,
    head: [columns.map(column => column.header)],
    body: rows.map(row => columns.map(column => {
      const value = row[column.accessor];
      return column.format ? column.format(value, row) : String(value ?? '');
    })),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 118, 110] },
  });
  doc.save(`${fileSafe(title)}.pdf`);
};

export const printReport = <T extends Record<string, unknown>>(title: string, columns: ReportColumn<T>[], rows: T[]) => {
  const printWindow = window.open('', '_blank', 'width=1200,height=800');
  if (!printWindow) return;

  const tableHeader = columns.map(column => `<th style="border:1px solid #d1d5db;padding:8px;text-align:left;background:#f3f4f6;">${column.header}</th>`).join('');
  const tableRows = rows.map(row => `<tr>${columns.map(column => {
    const value = row[column.accessor];
    const display = column.format ? column.format(value, row) : String(value ?? '');
    return `<td style="border:1px solid #d1d5db;padding:8px;">${display}</td>`;
  }).join('')}</tr>`).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          h1 { font-size: 20px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead><tr>${tableHeader}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
