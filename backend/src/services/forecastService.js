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
 * Generate forecast using Prophet (with Mock fallback)
 * @param {number} forecastDays - Number of days to forecast (default: 7)
 * @param {number} historicalDays - Number of days of history to use (default: 90)
 * @returns {Promise<Object>} Forecast data with predictions
 */
async function generateForecast(forecastDays = 7, historicalDays = 90) {
  try {
    console.log(`[Forecast] Starting forecast generation: ${forecastDays} days ahead using ${historicalDays} days of history`);

    // Step 1: Collect order data
    const historicalData = await dataCollectionService.collectOrderData(historicalDays);
    const dataStats = dataCollectionService.getDataStatistics(historicalData);
    
    console.log(`[Forecast] Data statistics:`, dataStats);

    // Step 2: Try to run Prophet via Python, fallback to mock if unavailable
    let forecast = null;
    let modelUsed = 'Prophet (Facebook)';
    
    try {
      forecast = await runProphetForecast(historicalData, forecastDays);
    } catch (pythonError) {
      console.warn('[Forecast] Python Prophet unavailable, using mock forecast:', pythonError.message);
      modelUsed = 'Mock Forecast (Python Unavailable)';
      forecast = generateMockForecast(historicalData, forecastDays, dataStats);
    }

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
          weekly: true,
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
        pythonExecutable = isWindows 
          ? path.join(venvPath, 'Scripts', 'python.exe')
          : path.join(venvPath, 'bin', 'python');
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
 * Generate mock forecast when Python Prophet is unavailable
 * Creates a simple trend-based forecast based on historical data
 */
function generateMockForecast(historicalData, forecastDays, dataStats) {
  try {
    console.log('[Forecast] Generating mock forecast as fallback');
    
    const avgOrders = parseFloat(dataStats.avgOrdersPerDay) || 10;
    const stdDev = parseFloat(dataStats.stdDeviation) || avgOrders * 0.3;
    const forecast = [];
    
    // Simple trend: slightly increase from average with some variance
    for (let i = 0; i < forecastDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      
      // Add some realistic variance
      const variance = (Math.random() - 0.5) * stdDev * 2;
      const trend = i * 0.5; // Slight upward trend
      const predicted = Math.max(0, avgOrders + variance + trend);
      
      forecast.push({
        ds: date.toISOString().split('T')[0],
        yhat: predicted,
        yhat_lower: Math.max(0, predicted - stdDev),
        yhat_upper: predicted + stdDev
      });
    }
    
    return forecast;
  } catch (error) {
    console.error('[Forecast] Error generating mock forecast:', error);
    // Return minimal forecast
    return Array.from({ length: forecastDays }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      return {
        ds: date.toISOString().split('T')[0],
        yhat: 10,
        yhat_lower: 5,
        yhat_upper: 15
      };
    });
  }
}

/**
  try {
    if (!forecast || !Array.isArray(forecast)) {
      return [];
    }

    const insights = [];
    const avgHistorical = parseFloat(dataStats.avgOrdersPerDay);
    const tomorrow = forecast[0];
    
    if (!tomorrow) return insights;

    const tomorrowForecast = tomorrow.yhat || 0;
    const percentChange = ((tomorrowForecast - avgHistorical) / avgHistorical * 100).toFixed(1);

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
async function calculateAccuracy(forecastDate, actualOrders) {
  try {
    // Get last forecast before that date
    const forecast = await getForecastArchive(forecastDate);
    
    if (!forecast) {
      return { error: 'No forecast found for that date' };
    }

    const predicted = forecast.yhat;
    const mape = Math.abs((actualOrders - predicted) / actualOrders) * 100;

    return {
      forecastDate,
      predicted: Math.round(predicted),
      actual: actualOrders,
      error: Math.round(actualOrders - predicted),
      mapePercent: mape.toFixed(2)
    };

  } catch (error) {
    console.error('[Forecast] Error calculating accuracy:', error);
    return { error: error.message };
  }
}

/**
 * Get archived forecast (placeholder - would fetch from DB)
 */
function getForecastArchive(date) {
  // TODO: Implement getting forecast from database
  return null;
}

module.exports = {
  generateForecast,
  calculateAccuracy,
  runProphetForecast
};
