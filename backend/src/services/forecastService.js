/**
 * Forecast Service using Prophet
 * Runs Prophet model to generate demand forecasts
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dataCollectionService = require('./dataCollectionService');

const PYTHON_SCRIPT_PATH = path.join(__dirname, 'prophet_forecast.py');

/**
 * Generate forecast using Prophet (with seasonal baseline fallback)
 * @param {number} forecastDays - Number of days to forecast (default: 7)
 * @param {number} historicalDays - Number of days of history to use (default: 90)
 * @returns {Promise<Object>} Forecast data with predictions
 */
async function generateForecast(forecastDays = 7, historicalDays = 90) {
  try {
    console.log(`[Forecast] Starting forecast generation: ${forecastDays} days ahead using ${historicalDays} days of history`);

    // Step 1: Collect order data
    const historicalData = await dataCollectionService.collectOrderData(historicalDays);
    if (historicalData.length < 2) {
      return {
        status: 'insufficient_data',
        generatedAt: new Date().toISOString(),
        forecast: [],
        insights: [],
        modelMetadata: { historicalDataPoints: historicalData.length },
        message: 'Forecasts require at least two completed business days of history.'
      };
    }
    const dataStats = dataCollectionService.getDataStatistics(historicalData);
    
    console.log(`[Forecast] Data statistics:`, dataStats);

    // Step 2: Try to run Prophet via Python, fallback to mock if unavailable
    let forecast = null;
    let modelUsed = 'Prophet (Facebook)';
    
    try {
      forecast = await runProphetForecast(historicalData, forecastDays);
    } catch (pythonError) {
      console.warn('[Forecast] Python Prophet unavailable, using seasonal baseline:', pythonError.message);
      modelUsed = 'Seasonal average baseline (Python unavailable)';
      forecast = generateBaselineForecast(historicalData, forecastDays, dataStats);
    }

    const settings = await require('../models/StoreSettings').current();
    forecast = forecast.map(day => (settings.closedDays || []).includes(new Date(`${day.ds}T12:00:00Z`).getUTCDay())
      ? { ...day, yhat: 0, yhat_lower: 0, yhat_upper: 0, scheduledClosed: true } : day);
    // Step 3: Enhance forecast with metadata
    const enhancedForecast = {
      status: 'success',
      generatedAt: new Date().toISOString(),
      modelMetadata: {
        algorithmUsed: modelUsed,
        historicalDataPoints: historicalData.length,
        forecastDays,
        dataStatistics: dataStats,
        seasonalityEnabled: {
          yearly: false,
          weekly: historicalData.length >= 14,
          daily: false
        }
      },
      forecast,
      insights: generateInsights(forecast, dataStats)
    };

    console.log(`[Forecast] Forecast generated successfully`);
    return enhancedForecast;

  } catch (error) {
    console.error('[Forecast] Error generating forecast:', error);
    return {
      status: 'error',
      error: error.message,
      generatedAt: new Date().toISOString()
    };
  }
}

/**
 * Execute Python Prophet script
 */
function runProphetForecast(historicalData, forecastDays) {
  return new Promise((resolve, reject) => {
    try {
      // Get Python executable from environment or construct path to venv
      let pythonExecutable = process.env.PYTHON_EXE;
      
      if (!pythonExecutable) {
        // Use Python from virtual environment if PYTHON_EXE not set
        const isWindows = process.platform === 'win32';
        const venvPath = path.join(__dirname, '../../../.venv');
        const venvExecutable = isWindows 
          ? path.join(venvPath, 'Scripts', 'python.exe')
          : path.join(venvPath, 'bin', 'python');
        pythonExecutable = fs.existsSync(venvExecutable)
          ? venvExecutable
          : (isWindows ? 'python' : 'python3');
      }

      // Spawn Python process
      const pythonProcess = spawn(pythonExecutable, [PYTHON_SCRIPT_PATH]);

      let stdoutData = '';
      let stderrData = '';
      let timeout;

      // Set timeout (30 seconds)
      timeout = setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Python Prophet forecast timed out after 30 seconds'));
      }, 30000);

      // Spawn failures arrive asynchronously and are not caught by try/catch.
      pythonProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to launch Python (${pythonExecutable}): ${error.message}`));
      });

      pythonProcess.stdin.on('error', (error) => {
        clearTimeout(timeout);
        pythonProcess.kill();
        reject(new Error(`Failed to send forecast data to Python: ${error.message}`));
      });

      // Handle stdout
      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      // Handle stderr
      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
        console.error('[Forecast] Python stderr:', data.toString());
      });

      // Handle process exit
      pythonProcess.on('close', (code) => {
        clearTimeout(timeout);

        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}: ${stderrData}`));
          return;
        }

        try {
          // Parse JSON output from Python script
          const result = JSON.parse(stdoutData);
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse Prophet output: ${parseError.message}. Output: ${stdoutData}`));
        }
      });

      // Send data to Python process via stdin
      const inputData = JSON.stringify({
        historicalData,
        forecastDays
      });

      pythonProcess.stdin.write(inputData);
      pythonProcess.stdin.end();

    } catch (error) {
      reject(new Error(`Failed to spawn Python process: ${error.message}`));
    }
  });
}

/**
 * Generate seasonal baseline when Python Prophet is unavailable
 * Creates a simple trend-based forecast based on historical data
 */
function generateBaselineForecast(historicalData, forecastDays, dataStats) {
  const avg = Number(dataStats.avgOrdersPerDay) || 0;
  const spread = Number(dataStats.standardDeviation) || 0;
  const today = new Date(new Date().getTime() + 8 * 3600000).toISOString().slice(0, 10);
  return Array.from({ length: forecastDays }, (_, i) => {
    const date = new Date(`${today}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + i + 1);
    const matching = historicalData.filter(d => new Date(`${d.ds}T00:00:00Z`).getUTCDay() === date.getUTCDay());
    const predicted = matching.length >= 2 ? matching.reduce((sum, d) => sum + d.y, 0) / matching.length : avg;
    return { ds: date.toISOString().slice(0, 10), yhat: predicted, yhat_lower: Math.max(0, predicted - spread), yhat_upper: predicted + spread };
  });
}

/** Generate operational insights from the forecast. */
function generateInsights(forecast, dataStats) {
  try {
    if (!forecast || !Array.isArray(forecast)) {
      return [];
    }

    const insights = [];
    const avgHistorical = parseFloat(dataStats.avgOrdersPerDay);
    const tomorrow = forecast[0];
    
    if (!tomorrow) return insights;

    const tomorrowForecast = tomorrow.yhat || 0;
    const percentChange = avgHistorical > 0 ? ((tomorrowForecast - avgHistorical) / avgHistorical * 100).toFixed(1) : 0;

    // Generate insight text
    if (percentChange > 15) {
      insights.push({
        type: 'high-demand',
        message: `📈 High demand expected tomorrow! Forecast: ${Math.round(tomorrowForecast)} orders (${percentChange}% above average)`,
        recommendation: 'Prepare extra ingredients, increase staff'
      });
    } else if (percentChange < -15) {
      insights.push({
        type: 'low-demand',
        message: `📉 Lower than average demand expected tomorrow. Forecast: ${Math.round(tomorrowForecast)} orders (${percentChange}% below average)`,
        recommendation: 'Reduce ingredient prep, minimal staff needed'
      });
    } else {
      insights.push({
        type: 'normal-demand',
        message: `📊 Normal demand expected tomorrow. Forecast: ${Math.round(tomorrowForecast)} orders`,
        recommendation: 'Standard operations recommended'
      });
    }

    // Peak day analysis
    const peak = forecast.reduce((max, day) => 
      (day.yhat || 0) > (max.yhat || 0) ? day : max, forecast[0]);
    
    if (peak) {
      insights.push({
        type: 'peak-day',
        message: `⭐ Peak day in forecast: ${peak.ds} with ~${Math.round(peak.yhat)} orders`,
        recommendation: 'Schedule additional staff 2 days before'
      });
    }

    // Confidence interval insight
    const avgConfidenceWidth = forecast.reduce((sum, day) => {
      const width = (day.yhat_upper || 0) - (day.yhat_lower || 0);
      return sum + width;
    }, 0) / forecast.length;

    if (avgConfidenceWidth > avgHistorical * 0.5) {
      insights.push({
        type: 'high-uncertainty',
        message: `⚠️ High forecast uncertainty detected - limited historical data`,
        recommendation: 'Use forecasts as guidance only, verify with experience'
      });
    }

    return insights;

  } catch (error) {
    console.error('[Forecast] Error generating insights:', error);
    return [];
  }
}

/**
 * Calculate forecast accuracy against actual data
 */
async function calculateAccuracy(forecastDate) {
  const { dayKey } = require('./dashboardService');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(forecastDate || '') || !Number.isFinite(Date.parse(forecastDate)) || dayKey(`${forecastDate}T00:00:00+08:00`) !== forecastDate || forecastDate >= dayKey(new Date())) throw new Error('Choose a completed business day.');
  const start = new Date(`${forecastDate}T00:00:00+08:00`);
  const record = await require('../models/Forecast').findOne({ generatedAt: { $lt: start }, 'predictions.ds': forecastDate }).sort({ generatedAt: -1 });
  if (!record) throw new Error('No forecast issued before that date was found.');
  const actual = await require('../models/Order').countDocuments({ status: 'completed', createdAt: { $gte: start, $lt: new Date(start.getTime() + 86400000) } });
  const prediction = record.predictions.find(p => p.ds === forecastDate);
  prediction.actual = actual;
  prediction.accuracy = actual === 0 ? null : Math.abs(actual - prediction.yhat) / actual * 100;
  await record.save();
  await record.calculatePerformance();
  return { forecastDate, predicted: prediction.yhat, actual, absoluteError: Math.abs(actual - prediction.yhat), mapePercent: prediction.accuracy };
}

module.exports = {
  generateForecast,
  calculateAccuracy,
  runProphetForecast
};
