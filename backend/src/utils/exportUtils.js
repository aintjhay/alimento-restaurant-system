/**
 * Export Utilities - CSV and PDF Generation
 * Handles formatting and generation of various report formats
 */

const { Parser } = require('json2csv');
const jsPDF = require('jspdf');
const autoTable = require('jspdf-autotable');

/**
 * Export orders to CSV format
 */
const exportOrdersToCSV = (orders) => {
  try {
    // Flatten order structure for CSV
    const flattenedOrders = orders.map(order => ({
      'Order ID': order._id,
      'Order Number': order.orderNumber || 'N/A',
      'Customer': order.customerName || 'Anonymous',
      'Table': order.tableNumber,
      'Type': order.orderType,
      'Items': order.items.length,
      'Subtotal': order.subtotal.toFixed(2),
      'Tax': order.taxAmount.toFixed(2),
      'Total': order.totalAmount.toFixed(2),
      'Status': order.status,
      'Payment': order.paymentStatus,
      'Date': new Date(order.createdAt).toLocaleString()
    }));

    const parser = new Parser();
    const csv = parser.parse(flattenedOrders);
    return csv;
  } catch (error) {
    throw new Error(`CSV export failed: ${error.message}`);
  }
};

/**
 * Export orders to PDF format
 */
const exportOrdersToPDF = (orders) => {
  try {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Orders Report', 14, 10);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 20);
    
    // Prepare table data
    const tableData = orders.map(order => [
      order.orderNumber || 'N/A',
      order.customerName || 'Anonymous',
      order.tableNumber,
      order.orderType,
      order.items.length,
      `₱${order.totalAmount.toFixed(2)}`,
      order.status,
      new Date(order.createdAt).toLocaleDateString()
    ]);

    // Add table
    autoTable(doc, {
      head: [['Order #', 'Customer', 'Table', 'Type', 'Items', 'Total', 'Status', 'Date']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });

    // Add summary
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const avgOrder = totalRevenue / totalOrders;

    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(11);
    doc.text(`Total Orders: ${totalOrders}`, 14, finalY);
    doc.text(`Total Revenue: ₱${totalRevenue.toFixed(2)}`, 14, finalY + 7);
    doc.text(`Average Order: ₱${avgOrder.toFixed(2)}`, 14, finalY + 14);

    return doc.output('arraybuffer');
  } catch (error) {
    throw new Error(`PDF export failed: ${error.message}`);
  }
};

/**
 * Export forecast report to PDF
 */
const exportForecastToPDF = (forecast) => {
  try {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text('Demand Forecast Report', 14, 10);
    
    // Metadata
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date(forecast.generatedAt).toLocaleString()}`, 14, 20);
    doc.text(`Model: ${forecast.modelType}`, 14, 27);
    doc.text(`Accuracy: ${(forecast.accuracy * 100).toFixed(1)}%`, 14, 34);
    
    // Key Metrics
    doc.setFontSize(12);
    doc.text('Key Metrics:', 14, 45);

    const metricsData = [
      ['MAE', forecast.meanAbsoluteError.toFixed(2)],
      ['RMSE', forecast.rootMeanSquaredError.toFixed(2)],
      ['MAPE', `${(forecast.meanAbsolutePercentageError * 100).toFixed(1)}%`],
      ['Confidence', `${(forecast.confidence * 100).toFixed(1)}%`]
    ];

    autoTable(doc, {
      head: [['Metric', 'Value']],
      body: metricsData,
      startY: 50,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Day of week trends
    doc.setFontSize(12);
    doc.text('Demand by Day of Week:', 14, doc.lastAutoTable.finalY + 15);

    const trendData = Object.entries(forecast.dayOfWeekTrends).map(([day, value]) => [
      day,
      value
    ]);

    autoTable(doc, {
      head: [['Day', 'Predicted Orders']],
      body: trendData,
      startY: doc.lastAutoTable.finalY + 5,
      theme: 'striped'
    });

    // Category forecasts
    doc.setFontSize(12);
    doc.text('Category Forecasts:', 14, doc.lastAutoTable.finalY + 15);

    const categoryData = forecast.categoryForecasts.map(cat => [
      cat.category,
      cat.predictedOrders
    ]);

    autoTable(doc, {
      head: [['Category', 'Predicted Orders']],
      body: categoryData,
      startY: doc.lastAutoTable.finalY + 5,
      theme: 'striped'
    });

    // Insights
    doc.setFontSize(12);
    doc.text('Insights & Recommendations:', 14, doc.lastAutoTable.finalY + 15);

    forecast.insights.forEach((insight, idx) => {
      doc.setFontSize(10);
      doc.text(`${idx + 1}. [${insight.type.toUpperCase()}]`, 14, doc.lastAutoTable.finalY + 20 + (idx * 12));
      doc.setFont(undefined, 'normal');
      doc.text(`• ${insight.message}`, 18, doc.lastAutoTable.finalY + 25 + (idx * 12));
      doc.text(`• ${insight.recommendation}`, 18, doc.lastAutoTable.finalY + 30 + (idx * 12));
    });

    return doc.output('arraybuffer');
  } catch (error) {
    throw new Error(`Forecast PDF export failed: ${error.message}`);
  }
};

/**
 * Export sales summary to CSV
 */
const exportSummaryToCSV = (orders, period = 'day') => {
  try {
    const groupedData = {};

    orders.forEach(order => {
      let key;
      const date = new Date(order.createdAt);

      if (period === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'week') {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        key = startOfWeek.toISOString().split('T')[0];
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          'Period': key,
          'Orders': 0,
          'Revenue': 0,
          'Avg Order': 0
        };
      }

      groupedData[key]['Orders']++;
      groupedData[key]['Revenue'] += order.totalAmount;
    });

    // Calculate averages
    Object.keys(groupedData).forEach(key => {
      groupedData[key]['Avg Order'] = (groupedData[key]['Revenue'] / groupedData[key]['Orders']).toFixed(2);
      groupedData[key]['Revenue'] = groupedData[key]['Revenue'].toFixed(2);
    });

    const parser = new Parser();
    const csv = parser.parse(Object.values(groupedData));
    return csv;
  } catch (error) {
    throw new Error(`Summary export failed: ${error.message}`);
  }
};

module.exports = {
  exportOrdersToCSV,
  exportOrdersToPDF,
  exportForecastToPDF,
  exportSummaryToCSV
};
