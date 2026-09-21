/**
 * Forecast Routes
 * API endpoints for demand forecasting
 */

const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
router.use(authMiddleware, requireRole('admin', 'staff', 'cashier'));
const cache = new Map();
const pending = new Map();
async function cachedForecast(days, historical) {
  const key = `${days}:${historical}`;
  const saved = cache.get(key);
  if (saved && saved.expires > Date.now()) return saved.result;
  if (pending.has(key)) return pending.get(key);
  if (pending.size) throw new Error('Forecast generation in progress; retry shortly.');
  const job = forecastService.generateForecast(days, historical).then(async result => {
    if (result.status === 'success') { await Forecast.create({ generatedAt: result.generatedAt, forecastDays: days, historicalDays: historical, algorithm: result.modelMetadata.algorithmUsed, dataPoints: result.modelMetadata.historicalDataPoints, predictions: result.forecast, insights: result.insights }); }
    if (cache.size >= 20) cache.delete(cache.keys().next().value);
    cache.set(key, { result, expires: Date.now() + 15 * 60000 }); return result;
  }).finally(() => pending.delete(key));
  pending.set(key, job); return job;
}

const forecastService = require('../services/forecastService');
const dataCollectionService = require('../services/dataCollectionService');
const Forecast = require('../models/Forecast');

/**
 * GET /api/forecast
 * Generate demand forecast
 * Query params:
 *   - days: number of days to forecast (default: 7)
 *   - historical: number of historical days to use (default: 90)
 */
router.get('/', async (req, res) => {
  try {
    const forecastDays = parseInt(req.query.days) || 7;
    const historicalDays = parseInt(req.query.historical) || 90;

    console.log(`[Route] GET /api/forecast - days=${forecastDays}, historical=${historicalDays}`);

    // Validate inputs
    if (forecastDays < 1 || forecastDays > 90) {
      return res.status(400).json({
        success: false,
        error: 'Forecast days must be between 1 and 90'
      });
    }

    if (historicalDays < 7 || historicalDays > 365) {
      return res.status(400).json({
        success: false,
        error: 'Historical days must be between 7 and 365'
      });
    }

    const forecast = await cachedForecast(forecastDays, historicalDays);

    res.json(forecast);

  } catch (error) {
    console.error('[Route] Error in forecast endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate forecast',
      message: error.message
    });
  }
});

/**
 * GET /api/forecast/data-stats
 * Get statistics about historical order data
 */
router.get('/data-stats', async (req, res) => {
  try {
    const historicalDays = parseInt(req.query.days) || 90;

    console.log(`[Route] GET /api/forecast/data-stats - days=${historicalDays}`);

    const data = await dataCollectionService.collectOrderData(historicalDays);
    const stats = dataCollectionService.getDataStatistics(data);

    res.json({
      success: true,
      statistics: stats,
      dataPreview: data.slice(-7) // Last 7 days
    });

  } catch (error) {
    console.error('[Route] Error getting data stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get data statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/forecast/history
 * Get recent forecast history
 * Query params:
 *   - limit: number of recent forecasts (default: 10)
 */
router.get('/history', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));

    console.log(`[Route] GET /api/forecast/history - limit=${limit}`);

    const forecasts = await Forecast.find()
      .sort({ generatedAt: -1 })
      .limit(limit)
      .select('generatedAt forecastDays historicalDays predictions insights')
      .lean();

    res.json({
      success: true,
      count: forecasts.length,
      forecasts
    });

  } catch (error) {
    console.error('[Route] Error getting forecast history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get forecast history',
      message: error.message
    });
  }
});

/**
 * POST /api/forecast/accuracy
 * Calculate accuracy of a previous forecast vs actual orders
 * Body:
 *   - forecastDate: date of forecast (YYYY-MM-DD)
 *   - actualOrders: actual number of orders that day
 */
router.post('/accuracy', async (req, res) => {
  try {
    const { forecastDate } = req.body;

    console.log(`[Route] POST /api/forecast/accuracy - date=${forecastDate}, actual=database`);

    if (!forecastDate) {
      return res.status(400).json({
        success: false,
        error: 'forecastDate is required'
      });
    }

    const accuracy = await forecastService.calculateAccuracy(forecastDate);

    res.json({
      success: true,
      accuracy
    });

  } catch (error) {
    console.error('[Route] Error calculating accuracy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate accuracy',
      message: error.message
    });
  }
});

/**
 * GET /api/forecast/health
 * Check if forecast service is operational
 */
router.get('/health', async (req, res) => {
  try {
    // Try to get a quick forecast to verify system works
    const testForecast = await cachedForecast(1, 14);

    res.json({
      success: testForecast.status === 'success',
      status: testForecast.status,
      message: testForecast.status === 'success' 
        ? 'Forecast service is operational'
        : `Service error: ${testForecast.error}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Route] Forecast health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'error',
      message: 'Forecast service is unavailable',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/forecast/export/pdf
 * Export latest forecast as PDF report
 */
router.get('/export/pdf', async (req, res) => {
  try {
    const forecast = await Forecast.findOne().sort({ generatedAt: -1 });
    
    if (!forecast) {
      return res.status(404).json({
        success: false,
        message: 'No forecast data available for export'
      });
    }

    const { exportForecastToPDF } = require('../utils/exportUtils');
    const pdfBuffer = exportForecastToPDF(forecast);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="forecast-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('❌ Forecast PDF export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export forecast to PDF',
      error: error.message
    });
  }
});

/**
 * GET /api/forecast/export/csv
 * Export forecast predictions as CSV
 */
router.get('/export/csv', async (req, res) => {
  try {
    const forecast = await Forecast.findOne().sort({ generatedAt: -1 });
    
    if (!forecast) {
      return res.status(404).json({
        success: false,
        message: 'No forecast data available for export'
      });
    }

    const { Parser } = require('json2csv');
    const parser = new Parser({
      fields: ['ds', 'yhat', 'yhat_lower', 'yhat_upper', 'trend', 'weekly', 'actual']
    });

    const csv = parser.parse(forecast.predictions);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="forecast-data-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('❌ Forecast CSV export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export forecast to CSV',
      error: error.message
    });
  }
});

module.exports = router;
