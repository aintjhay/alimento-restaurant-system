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
    if (!Number.isInteger(daysBack) || daysBack < 1 || daysBack > 365) throw new Error('History must be 1 to 365 days');
    // Calculate date range (default: last 90 days)
    const endDate = new Date(`${new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)}T00:00:00+08:00`);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    console.log(`[DataCollection] Fetching orders from ${startDate.toDateString()} to ${endDate.toDateString()}`);

    // Fetch orders that were completed
    const orders = await Order.find({
      createdAt: {
        $gte: startDate,
        $lt: endDate
      },
      status: 'completed' // Only completed orders
    }).select('createdAt items quantity').lean();

    console.log(`[DataCollection] Found ${orders.length} orders in date range`);

    if (orders.length === 0) return [];

    // Aggregate orders by date
    const dailyOrderCounts = {};
    const dailyQuantities = {};

    orders.forEach(order => {
      // Normalize date to YYYY-MM-DD
      const date = new Date(order.createdAt);
      const dateKey = new Date(date.getTime() + 8 * 3600000).toISOString().split('T')[0];

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

    // Complete calendar from the first observed sale; do not invent pre-opening history.
    const first = Object.keys(dailyOrderCounts).sort()[0];
    const cursor = new Date(`${first}T00:00:00+08:00`);
    while (cursor < endDate) {
      const key = new Date(cursor.getTime() + 8 * 3600000).toISOString().slice(0, 10);
      dailyOrderCounts[key] ??= 0; dailyQuantities[key] ??= 0;
      cursor.setTime(cursor.getTime() + 86400000);
    }
    const settings = await require('../models/StoreSettings').findOne({ key: 'store' }).select('+scheduleHistory').lean();
    const history = settings?.scheduleHistory || [];
    // Classify only whole days covered by an actual recorded schedule; earlier days remain unknown.
    const businessDay = date => {
      const start = new Date(`${date}T00:00:00+08:00`);
      const end = new Date(start.getTime() + 86400000);
      const schedule = [...history].reverse().find(s => new Date(s.effectiveAt) <= start);
      if (!schedule || history.some(s => new Date(s.effectiveAt) > start && new Date(s.effectiveAt) < end)) return 'unknown';
      const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
      return schedule.closed || schedule.closedDays.includes(weekday) ? 'closed' : 'open';
    };
    // Convert to Prophet format: {ds, y, y_quantity}
    const prophetData = Object.entries(dailyOrderCounts)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, count]) => ({
        ds: date,
        y: count, // Number of orders per day
        y_quantity: dailyQuantities[date], // Total items per day
        businessDay: businessDay(date)
      }));

    console.log(`[DataCollection] Aggregated into ${prophetData.length} days of data`);
    console.log(`[DataCollection] Date range: ${prophetData[0].ds} to ${prophetData[prophetData.length - 1].ds}`);

    return prophetData;

  } catch (error) {
    console.error('[DataCollection] Error collecting order data:', error);

    throw error;
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
    const dateStr = new Date(date.getTime() + 8 * 3600000).toISOString().split('T')[0];

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = date.getDay();

    // Weekday (Mon-Fri) patterns: base 30-40 orders
    // Weekend (Sat-Sun) patterns: base 40-50 orders
    let baseOrders = dayOfWeek >= 1 && dayOfWeek <= 5 ? 35 : 45;
    
    // Add some randomness (Â±20%)
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
    knownClosedDays: data.filter(d => d.businessDay === 'closed').length,
    unknownScheduleDays: data.filter(d => d.businessDay === 'unknown').length,
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
