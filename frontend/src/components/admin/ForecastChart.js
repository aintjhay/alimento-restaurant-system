/**
 * ForecastChart Component
 * Displays demand forecast predictions and insights
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ForecastChart.css';

const ForecastChart = ({ days = 7 }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchForecast();
  }, [days]);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('http://localhost:5000/api/forecast', {
        params: {
          days,
          historical: 90
        }
      });

      console.log('Forecast data received:', response.data);
      setForecast(response.data);
    } catch (err) {
      console.error('Error fetching forecast:', err);
      setError(err.response?.data?.error || 'Failed to load forecast');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchForecast();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="forecast-container">
        <div className="forecast-loading">
          <div className="spinner"></div>
          <p>Loading forecast data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="forecast-container">
        <div className="forecast-error">
          <h3>⚠️ Unable to Load Forecast</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!forecast || forecast.status !== 'success') {
    return (
      <div className="forecast-container">
        <div className="forecast-error">
          <h3>Error Generating Forecast</h3>
          <p>{forecast?.error || 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="forecast-container">
      {/* Header */}
      <div className="forecast-header">
        <div>
          <h2>📊 Demand Forecast</h2>
          <p className="forecast-subtitle">
            Next {days} days | Updated: {new Date(forecast.generatedAt).toLocaleString()}
          </p>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="btn-refresh"
        >
          {refreshing ? '⟳ Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Insights */}
      {forecast.insights && forecast.insights.length > 0 && (
        <div className="forecast-insights">
          <h3>💡 Key Insights</h3>
          <div className="insights-list">
            {forecast.insights.map((insight, idx) => (
              <div key={idx} className={`insight-card insight-${insight.type}`}>
                <div className="insight-message">{insight.message}</div>
                <div className="insight-recommendation">
                  👉 {insight.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forecast Table */}
      <div className="forecast-table-wrapper">
        <h3>Predictions</h3>
        <table className="forecast-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Predicted Orders</th>
              <th>Confidence Range</th>
              <th>Trend</th>
              <th>Weekly Pattern</th>
            </tr>
          </thead>
          <tbody>
            {forecast.forecast.map((prediction, idx) => {
              const date = new Date(prediction.ds);
              const dayName = date.toLocaleString('en-US', { weekday: 'short' });
              const lower = Math.round(prediction.yhat_lower);
              const upper = Math.round(prediction.yhat_upper);
              const predicted = Math.round(prediction.yhat);

              return (
                <tr key={idx} className="forecast-row">
                  <td className="date-cell">
                    <div className="date-info">
                      <div className="date-day">{dayName}</div>
                      <div className="date-value">{prediction.ds}</div>
                    </div>
                  </td>
                  <td className="prediction-cell">
                    <div className="prediction-badge">{predicted}</div>
                  </td>
                  <td className="range-cell">
                    <div className="range-info">
                      {lower} - {upper} orders
                    </div>
                    <div className="range-bar">
                      <div className="range-fill" style={{
                        width: `${((predicted - lower) / (upper - lower)) * 100}%`
                      }}></div>
                    </div>
                  </td>
                  <td className="trend-cell">
                    <div className={`trend-indicator ${prediction.trend > 0 ? 'up' : prediction.trend < 0 ? 'down' : 'neutral'}`}>
                      {prediction.trend > 0 ? '📈' : prediction.trend < 0 ? '📉' : '➡️'}
                      {Math.abs(prediction.trend).toFixed(1)}
                    </div>
                  </td>
                  <td className="weekly-cell">
                    <div className={`weekly-factor ${prediction.weekly > 0 ? 'positive' : 'negative'}`}>
                      {prediction.weekly > 0 ? '+' : ''}{prediction.weekly.toFixed(1)}%
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Model Metadata */}
      <div className="forecast-metadata">
        <h3>Model Information</h3>
        <div className="metadata-grid">
          <div className="metadata-item">
            <span className="label">Algorithm:</span>
            <span className="value">{forecast.modelMetadata.algorithmUsed}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Historical Data:</span>
            <span className="value">{forecast.modelMetadata.historicalDataPoints} days</span>
          </div>
          <div className="metadata-item">
            <span className="label">Avg Orders/Day:</span>
            <span className="value">{forecast.modelMetadata.dataStatistics.avgOrdersPerDay}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Data Range:</span>
            <span className="value" title={forecast.modelMetadata.dataStatistics.dateRange}>
              {forecast.modelMetadata.dataStatistics.dateRange.substring(0, 20)}...
            </span>
          </div>
          <div className="metadata-item">
            <span className="label">Seasonality:</span>
            <span className="value">
              Weekly: {forecast.modelMetadata.seasonalityEnabled.weekly ? '✓' : '✗'}
            </span>
          </div>
          <div className="metadata-item">
            <span className="label">Confidence:</span>
            <span className="value">95%</span>
          </div>
        </div>
      </div>

      {/* Data Info */}
      <div className="forecast-info">
        <p>
          <strong>ℹ️ How to use:</strong> These predictions are based on historical order patterns.
          Predictions improve as more data accumulates. Use confidence ranges to plan inventory and staffing.
        </p>
      </div>
    </div>
  );
};

export default ForecastChart;
