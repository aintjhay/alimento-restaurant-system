/**
 * Export Utilities - Frontend
 * Handles exporting data to CSV and PDF formats
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Download data as CSV file
 */
export const downloadCSV = (filename, csvContent) => {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

/**
 * Download data as PDF file
 */
export const downloadPDF = (filename, doc) => {
  doc.save(filename);
};

/**
 * Generate CSV from array of objects
 */
export const generateCSV = (data, headers = null) => {
  if (!data || data.length === 0) return '';

  // Use provided headers or extract from first object keys
  const cols = headers || Object.keys(data[0]);
  const csvHeaders = cols.join(',');

  const csvRows = data.map(row =>
    cols.map(col => {
      const value = row[col];
      // Handle special values
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [csvHeaders, ...csvRows].join('\n');
};

/**
 * Create PDF with table
 */
export const createTablePDF = (title, headers, rows, filename) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  // Add date
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Add table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 35,
    theme: 'grid',
    headerStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      lineColor: [41, 128, 185],
      lineWidth: 0.5
    },
    bodyStyles: {
      textColor: [0, 0, 0],
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { top: 35 },
    didDrawPage: (data) => {
      // Footer
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.getHeight();
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${data.pageNumber} of ${data.pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  });

  downloadPDF(filename, doc);
};

/**
 * Export from API endpoint
 */
export const downloadFromAPI = async (endpoint, filename) => {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);

    return { success: true, message: 'Export successful' };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Export orders data to PDF with summary
 */
export const exportOrdersPDF = (orders, title = 'Orders Report') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(title, 14, 20);

  // Date and count
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
  doc.text(`Total Orders: ${orders.length}`, 14, 35);

  // Reset color
  doc.setTextColor(0, 0, 0);

  // Table data
  const tableHeaders = ['Order #', 'Customer', 'Items', 'Total', 'Status', 'Date'];
  const tableRows = orders.map(order => [
    order.orderNumber || 'N/A',
    order.customerName || 'Anonymous',
    order.items?.length || 0,
    `₱${(order.totalAmount || 0).toFixed(2)}`,
    order.status || 'Unknown',
    new Date(order.createdAt).toLocaleDateString()
  ]);

  autoTable(doc, {
    head: [tableHeaders],
    body: tableRows,
    startY: 42,
    theme: 'grid',
    headerStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });

  // Summary
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const avgOrder = totalRevenue / (orders.length || 1);

  const summaryY = doc.lastAutoTable.finalY + 15;
  doc.setFont(undefined, 'bold');
  doc.text('Summary:', 14, summaryY);
  doc.setFont(undefined, 'normal');
  doc.text(`Total Revenue: ₱${totalRevenue.toFixed(2)}`, 14, summaryY + 7);
  doc.text(`Average Order: ₱${avgOrder.toFixed(2)}`, 14, summaryY + 14);

  return doc;
};

/**
 * Export with loading state management
 */
export const handleExportWithLoader = async (exportFn, onSuccess, onError) => {
  try {
    const result = await exportFn();
    if (onSuccess) onSuccess(result);
    return result;
  } catch (error) {
    console.error('Export failed:', error);
    if (onError) onError(error);
    throw error;
  }
};
