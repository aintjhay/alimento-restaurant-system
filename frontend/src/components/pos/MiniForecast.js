/**
 * MiniForecast Component
 * Compact demand forecast widget for POS system
 * Shows today's prediction, demand trend, and quick insights
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import {
  TrendUpIcon,
  TrendDownIcon,
  TrendNeutralIcon,
  RefreshIcon,
  LoadingSpinner,
  AlertIcon,
  CheckIcon,
  CalendarIcon,
  OrdersIcon,
  InfoIcon
} from '../icons/ForecastIcons';
import './MiniForecast.css';

const MiniForecast = () => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/forecast`, {
        params: { days: 7, historical: 90 }
      });

      if (response.data.status === 'success') {
        setForecast(response.data);
      } else {
        setError('Failed to load forecast');
      }
    } catch (err) {
      console.error('Forecast error:', err);
      setError('Forecast unavailable');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchForecast();
    setRefreshing(false);
  };

  const getTodaysForecast = () => {
    if (!forecast || forecast.forecast.length === 0) return null;
    return forecast.forecast[0];
  };

  const getTrendInsight = () => {
    const today = getTodaysForecast();
    if (!today) return null;

    if (today.trend > 0) {
      return {
        icon: <TrendUpIcon size={16} color="#4caf50" />,
        text: `Demand increasing by ${Math.abs(today.trend).toFixed(1)}%`,
        type: 'positive'
      };
    } else if (today.trend < 0) {
      return {
        icon: <TrendDownIcon size={16} color="#f44336" />,
        text: `Demand decreasing by ${Math.abs(today.trend).toFixed(1)}%`,
        type: 'negative'
      };
    }
    return {
      icon: <TrendNeutralIcon size={16} color="#9e9e9e" />,
      text: 'Demand stable',
      type: 'neutral'
    };
  };

  const getPrimaryInsight = () => {
    if (!forecast || !forecast.insights || forecast.insights.length === 0) {
      return null;
    }
    return forecast.insights[0];
  };

  if (loading) {
    return (
      <div className="mini-forecast-card">
        <div className="mini-forecast-loading">
          <LoadingSpinner size={20} color="#00796b" />
          <span>Loading forecast...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mini-forecast-card mini-forecast-error">
        <div className="error-header">
          <AlertIcon size={18} color="#ff9800" />
          <span className="error-text">Forecast unavailable</span>
        </div>
      </div>
    );
  }

  const today = getTodaysForecast();
  const trend = getTrendInsight();
  const insight = getPrimaryInsight();

  if (!today) return null;

  const predicted = Math.round(today.yhat);
  const lower = Math.round(today.yhat_lower);
  const upper = Math.round(today.yhat_upper);

  return (
    <div className={`mini-forecast-card ${expanded ? 'expanded' : ''}`}>
      {/* Header / Collapsed View */}
      <div className="mini-forecast-header" onClick={() => setExpanded(!expanded)}>
        <div className="forecast-title-section">
          <div className="forecast-icon-circle">
            <OrdersIcon size={18} color="#fff" />
          </div>
          <div className="forecast-title-content">
            <div className="forecast-title">Today's Demand</div>
            <div className="forecast-predicted">
              {predicted} <span className="forecast-unit">orders</span>
            </div>
          </div>
        </div>

        <div className="mini-forecast-controls">
          {trend && (
            <div className={`trend-badge ${trend.type}`}>
              {trend.icon}
            </div>
          )}
          <button
            className="btn-mini-refresh"
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            disabled={refreshing}
            title="Refresh forecast"
          >
            <RefreshIcon size={16} color="#00796b" style={{
              opacity: refreshing ? 0.6 : 1,
              transform: refreshing ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 1s linear'
            }} />
          </button>
          <div className="expand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d={expanded ? "M18 15L12 9L6 15" : "M6 9L12 15L18 9"} stroke="#00796b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded View */}
      {expanded && (
        <div className="mini-forecast-expanded">
          {/* Quick Stats */}
          <div className="forecast-quick-stats">
            <div className="stat-box">
              <div className="stat-label">Confidence Range</div>
              <div className="stat-value">{lower} - {upper}</div>
              <div className="stat-bar">
                <div className="stat-bar-fill" style={{
                  width: `${((predicted - lower) / (upper - lower)) * 100}%`
                }}></div>
              </div>
            </div>

            {trend && (
              <div className="stat-box">
                <div className="stat-label">Trend</div>
                <div className={`stat-value trend-${trend.type}`}>
                  {trend.icon}
                  <span>{Math.abs(today.trend).toFixed(1)}%</span>
                </div>
              </div>
            )}

            {today.weekly !== undefined && (
              <div className="stat-box">
                <div className="stat-label">Weekly Pattern</div>
                <div className={`stat-value ${today.weekly > 0 ? 'positive' : 'negative'}`}>
                  {today.weekly > 0 ? '+' : ''}{today.weekly.toFixed(1)}%
                </div>
              </div>
            )}
          </div>

          {/* Insight */}
          {insight && (
            <div className={`forecast-quick-insight insight-${insight.type}`}>
              <div className="insight-icon">
                <InfoIcon size={16} color="currentColor" />
              </div>
              <div className="insight-content">
                <div className="insight-message">{insight.message}</div>
              </div>
            </div>
          )}

          {/* Mini Table - Next 3 Days */}
          <div className="forecast-mini-table">
            <div className="table-title">Next 3 Days</div>
            <div className="mini-table-rows">
              {forecast.forecast.slice(0, 3).map((pred, idx) => {
                const date = new Date(pred.ds);
                const dayName = date.toLocaleString('en-US', { weekday: 'short' });
                const dayDate = date.toLocaleString('en-US', { month: 'short', day: 'numeric' });
                const predValue = Math.round(pred.yhat);

                return (
                  <div key={idx} className="mini-table-row">
                    <div className="row-date">
                      <div className="row-day">{dayName}</div>
                      <div className="row-date-val">{dayDate}</div>
                    </div>
                    <div className="row-prediction">
                      <div className="prediction-main">{predValue}</div>
                    </div>
                    <div className="row-indicator">
                      {pred.trend > 0 && <TrendUpIcon size={14} color="#4caf50" />}
                      {pred.trend < 0 && <TrendDownIcon size={14} color="#f44336" />}
                      {pred.trend === 0 && <TrendNeutralIcon size={14} color="#9e9e9e" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Info */}
          <div className="forecast-mini-footer">
            <CheckIcon size={14} color="#4caf50" />
            <span>Updated: {new Date(forecast.generatedAt).toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniForecast;
