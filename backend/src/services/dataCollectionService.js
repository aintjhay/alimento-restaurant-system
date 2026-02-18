/**
 * Data Collection Service for Demand Forecasting
 * Aggregates order data from MongoDB for Prophet analysis
 */

const Order = require('../models/Order');

/**
 * Collects historical order data and aggregates by date
 * Returns data in format Prophet expects: {ds, y}
 * ds = date (YYYY-MM-DD)
 * y = total orders for that day
 */
async function collectOrderData(daysBack = 90) {
  try {
    // Calculate date range (default: last 90 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    console.log(`[DataCollection] Fetching orders from ${startDate.toDateString()} to ${endDate.toDateString()}`);

    // Fetch orders that were completed
    const orders = await Order.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      },
      status: { $in: ['completed', 'delivered', 'ready'] } // Only completed orders
    }).select('createdAt items quantity').lean();

    console.log(`[DataCollection] Found ${orders.length} orders in date range`);

    // Use sample data if we don't have enough real data (minimum 7 days)
    if (orders.length === 0 || orders.length < 7) {
      console.warn(`[DataCollection] Insufficient order data (${orders.length} orders). Using sample data for demo.`);
      return generateSampleData();
    }

    // Aggregate orders by date
    const dailyOrderCounts = {};
    const dailyQuantities = {};

    orders.forEach(order => {
      // Normalize date to YYYY-MM-DD
      const date = new Date(order.createdAt);
      const dateKey = date.toISOString().split('T')[0];

      if (!dailyOrderCounts[dateKey]) {
        dailyOrderCounts[dateKey] = 0;
        dailyQuantities[dateKey] = 0;
      }
      
      dailyOrderCounts[dateKey]++;
      
      // Sum total items/quantity ordered
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          dailyQuantities[dateKey] += item.quantity || 1;
        });
      } else if (order.quantity) {
        dailyQuantities[dateKey] += order.quantity;
      }
    });

    // Convert to Prophet format: {ds, y, y_quantity}
    const prophetData = Object.entries(dailyOrderCounts)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, count]) => ({
        ds: date,
        y: count, // Number of orders per day
        y_quantity: dailyQuantities[date] // Total items per day
      }));

    console.log(`[DataCollection] Aggregated into ${prophetData.length} days of data`);
    console.log(`[DataCollection] Date range: ${prophetData[0].ds} to ${prophetData[prophetData.length - 1].ds}`);

    return prophetData;

  } catch (error) {
    console.error('[DataCollection] Error collecting order data:', error);
    console.warn('[DataCollection] Falling back to sample data');
    return generateSampleData();
  }
}

/**
 * Generates sample/demo data for development and testing
 * Creates 60 days of realistic restaurant order patterns
 */
function generateSampleData() {
  const data = [];
  const today = new Date();

  // Generate 60 days of data with realistic patterns
  for (let i = 60; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = date.getDay();

    // Weekday (Mon-Fri) patterns: base 30-40 orders
    // Weekend (Sat-Sun) patterns: base 40-50 orders
    let baseOrders = dayOfWeek >= 1 && dayOfWeek <= 5 ? 35 : 45;
    
    // Add some randomness (±20%)
    const randomVariation = Math.random() * 0.4 - 0.2; // -20% to +20%
    const orders = Math.round(baseOrders * (1 + randomVariation));

    data.push({
      ds: dateStr,
      y: Math.max(20, orders), // Ensure minimum 20 orders
      y_quantity: Math.round(orders * 2.5) // ~2.5 items per order
    });
  }

  console.log(`[DataCollection] Generated ${data.length} days of sample data`);
  return data;
}

/**
 * Exports data to CSV format (for debugging/export)
 */
function convertToCSV(data) {
  const headers = ['ds', 'y', 'y_quantity'];
  const rows = data.map(row => [row.ds, row.y, row.y_quantity]);
  
  const csv = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
  
  return csv;
}

/**
 * Get data statistics for validation
 */
function getDataStatistics(data) {
  if (!data || data.length === 0) {
    return { error: 'No data provided' };
  }

  const yValues = data.map(d => d.y);
  const mean = yValues.reduce((a, b) => a + b, 0) / yValues.length;
  const min = Math.min(...yValues);
  const max = Math.max(...yValues);
  const variance = yValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / yValues.length;
  const stdDev = Math.sqrt(variance);

  return {
    dataPoints: data.length,
    dateRange: `${data[0].ds} to ${data[data.length - 1].ds}`,
    avgOrdersPerDay: mean.toFixed(2),
    minOrders: min,
    maxOrders: max,
    standardDeviation: stdDev.toFixed(2),
    totalOrders: yValues.reduce((a, b) => a + b, 0)
  };
}

module.exports = {
  collectOrderData,
  generateSampleData,
  convertToCSV,
  getDataStatistics
};
