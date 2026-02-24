/**
 * ForecastChart Component
 * Displays demand forecast predictions and insights
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TrendUpIcon,
  TrendDownIcon,
  TrendNeutralIcon,
  ChartIcon,
  RefreshIcon,
  AlertIcon,
  CheckIcon,
  CalendarIcon,
  InfoIcon,
  LoadingSpinner
} from '../icons/ForecastIcons';
import './ForecastChart.css';

const ForecastChart = ({ days = 7 }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    insights: false,
    fullPredictions: false,
    metadata: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
          <LoadingSpinner size={40} color="#00796b" />
          <p>Loading forecast data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="forecast-container">
        <div className="forecast-error">
          <AlertIcon size={28} color="#ff9800" />
          <h3>Unable to Load Forecast</h3>
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
          <AlertIcon size={28} color="#ff9800" />
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
          <h2>
            <ChartIcon size={24} color="#00796b" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Demand Forecast
          </h2>
          <p className="forecast-subtitle">
            <CalendarIcon size={12} color="#757575" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Next {days} days | Updated: {new Date(forecast.generatedAt).toLocaleString()}
          </p>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="btn-refresh"
        >
          <RefreshIcon size={16} color="#00796b" style={{
            transform: refreshing ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 1s linear'
          }} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Top Insight Card */}
      {forecast.insights && forecast.insights.length > 0 && (
        <div className="forecast-section">
          <div className="section-content">
            <div className={`insight-card-featured insight-${forecast.insights[0].type}`}>
              <div className="insight-icon">
                <InfoIcon size={20} color="currentColor" />
              </div>
              <div className="insight-details">
                <div className="insight-message">{forecast.insights[0].message}</div>
                <div className="insight-recommendation">{forecast.insights[0].recommendation}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next 3 Days Summary Cards */}
      <div className="forecast-section">
        <div className="section-title">
          <h3>Next 3 Days</h3>
        </div>
        <div className="prediction-cards-grid">
          {forecast.forecast.slice(0, 3).map((prediction, idx) => {
            const date = new Date(prediction.ds);
            const dayName = date.toLocaleString('en-US', { weekday: 'long' });
            const dayDate = date.toLocaleString('en-US', { month: 'short', day: 'numeric' });
            const predicted = Math.round(prediction.yhat);
            const lower = Math.round(prediction.yhat_lower);
            const upper = Math.round(prediction.yhat_upper);

            return (
              <div key={idx} className="prediction-card">
                <div className="card-date">
                  <div className="card-day">{dayName}</div>
                  <div className="card-datevalue">{dayDate}</div>
                </div>
                <div className="card-content">
                  <div className="card-predicted">
                    <span className="predicted-value">{predicted}</span>
                    <span className="predicted-label">orders</span>
                  </div>
                  <div className="card-confidence">
                    <span className="confidence-label">Range:</span>
                    <span className="confidence-value">{lower}–{upper}</span>
                  </div>
                  <div className="card-trend">
                    {prediction.trend > 0 && <TrendUpIcon size={14} color="#4caf50" />}
                    {prediction.trend < 0 && <TrendDownIcon size={14} color="#f44336" />}
                    {prediction.trend === 0 && <TrendNeutralIcon size={14} color="#9e9e9e" />}
                    <span>{Math.abs(prediction.trend).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Insights - Collapsible */}
      {forecast.insights && forecast.insights.length > 1 && (
        <div className="forecast-section">
          <button 
            className="section-toggle"
            onClick={() => toggleSection('insights')}
          >
            <span>More Insights ({forecast.insights.length - 1})</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d={expandedSections.insights ? "M18 15L12 9L6 15" : "M6 9L12 15L18 9"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {expandedSections.insights && (
            <div className="section-content">
              <div className="insights-list">
                {forecast.insights.slice(1).map((insight, idx) => (
                  <div key={idx} className={`insight-card insight-${insight.type}`}>
                    <div className="insight-message">{insight.message}</div>
                    <div className="insight-recommendation">{insight.recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Predictions Table - Collapsible */}
      <div className="forecast-section">
        <button 
          className="section-toggle"
          onClick={() => toggleSection('fullPredictions')}
        >
          <span>Full {days}-Day Forecast</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d={expandedSections.fullPredictions ? "M18 15L12 9L6 15" : "M6 9L12 15L18 9"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {expandedSections.fullPredictions && (
          <div className="section-content">
            <div className="forecast-table-wrapper">
              <table className="forecast-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Predicted</th>
                    <th>Range</th>
                    <th>Trend</th>
                    <th>Weekly</th>
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
                          <div className="range-info">{lower}–{upper}</div>
                        </td>
                        <td className="trend-cell">
                          <div className={`trend-indicator ${prediction.trend > 0 ? 'up' : prediction.trend < 0 ? 'down' : 'neutral'}`}>
                            {prediction.trend > 0 && <TrendUpIcon size={14} color="#4caf50" />}
                            {prediction.trend < 0 && <TrendDownIcon size={14} color="#f44336" />}
                            {prediction.trend === 0 && <TrendNeutralIcon size={14} color="#9e9e9e" />}
                            <span>{Math.abs(prediction.trend).toFixed(1)}%</span>
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
          </div>
        )}
      </div>

      {/* Model Metadata - Collapsible */}
      <div className="forecast-section">
        <button 
          className="section-toggle"
          onClick={() => toggleSection('metadata')}
        >
          <span>Model Details</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d={expandedSections.metadata ? "M18 15L12 9L6 15" : "M6 9L12 15L18 9"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {expandedSections.metadata && (
          <div className="section-content">
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
                <span className="label">Seasonality:</span>
                <span className="value">
                  {forecast.modelMetadata.seasonalityEnabled.weekly ? '✓ Weekly' : '✗ None'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="forecast-info">
        <CheckIcon size={14} color="#4caf50" style={{ marginRight: '6px', verticalAlign: 'middle' }} />
        <span>
          <strong>Based on {forecast.modelMetadata.historicalDataPoints} days</strong> of historical patterns. Predictions become more accurate as data accumulates.
        </span>
      </div>
    </div>
  );
};

export default ForecastChart;
