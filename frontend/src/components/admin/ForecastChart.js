/**
 * ForecastChart Component
 * Displays demand forecast predictions and insights
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { authHeaders } from '../../services/api';
import API_BASE_URL from '../../config/api';
import {
  ChartIcon,
  RefreshIcon,
  AlertIcon,
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

  const fetchForecast = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000);

      const response = await axios.get(`${API_BASE_URL}/api/forecast`, {
        headers: authHeaders(),
        params: {
          days,
          historical: 90
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Forecast data received:', response.data);
      setForecast({ ...response.data, forecast: (response.data.forecast || []).map(day => ({ ...day, trend: Number(day.trend) || 0, weekly: Number(day.weekly) || 0 })) });
    } catch (err) {
      console.error('Error fetching forecast:', err);
      if (err.name === 'AbortError') {
        setError('Forecast request timed out. The backend may be starting up. Please refresh to retry.');
      } else {
        setError('Forecast temporarily unavailable. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [days]);
  useEffect(() => { fetchForecast(); }, [fetchForecast]);

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

  if (forecast?.status === 'insufficient_data') {
    return <div className="forecast-container">
      <h2><ChartIcon size={24} color="#00796b" />Demand Forecast</h2>
      <p className="forecast-empty">Forecasts will appear after completed orders are recorded on at least two days.</p>
      <button onClick={handleRefresh} className="btn-refresh"><RefreshIcon size={16} color="currentColor" />Refresh</button>
    </div>;
  }

  if (!forecast || forecast.status !== 'success') {
    return (
      <div className="forecast-container">
        <div className="forecast-error">
          <AlertIcon size={28} color="#ff9800" />
          <h3>Forecast temporarily unavailable</h3>
          <p>Please try again in a moment.</p>
          <button onClick={handleRefresh} className="btn-retry">Retry</button>
        </div>
      </div>
    );
  }

  const metadata = forecast.modelMetadata || {};
  const historyDays = Number(metadata.historicalDataPoints) || 0;
  const simulated = metadata.algorithmUsed?.includes('Mock');
  const baseline = metadata.algorithmUsed?.includes('baseline');
  const limited = historyDays < 14;
  const count = value => value != null && Number.isFinite(Number(value)) ? Math.max(0, Math.round(Number(value))) : null;
  const dateLabel = (value, options) => new Date(value).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', ...options });
  const predictions = forecast.forecast.filter(day => day.yhat != null && Number.isFinite(Number(day.yhat)) && !Number.isNaN(new Date(day.ds).getTime())).slice(0, days).map(day => {
    const predicted = count(day.yhat);
    const lower = count(day.yhat_lower);
    const upper = count(day.yhat_upper);
    return { ...day, predicted, lower: lower == null ? null : Math.min(lower, predicted), upper: upper == null ? null : Math.max(upper, predicted) };
  }).sort((a, b) => new Date(a.ds) - new Date(b.ds));
  const first = predictions[0];
  const total = predictions.reduce((sum, day) => sum + day.predicted, 0);
  const peak = predictions.length ? Math.max(...predictions.map(day => day.predicted)) : 0;
  const peakDays = predictions.filter(day => day.predicted === peak);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = first && dateLabel(first.ds) === dateLabel(tomorrow);
  const firstLabel = isTomorrow ? 'Tomorrow' : first ? dateLabel(first.ds, { month: 'short', day: 'numeric' }) : 'Next day';
  const average = Number(metadata.dataStatistics?.avgOrdersPerDay);
  const change = first && average > 0 ? ((Math.max(0, Number(first.yhat)) - average) / average) * 100 : null;
  const quieter = change != null && change < -15;
  const busier = change != null && change > 15;
  const range = day => day.lower == null || day.upper == null ? 'Range unavailable' : `${day.lower}–${day.upper} orders`;
  const max = Math.max(1, ...predictions.map(day => Math.max(day.predicted, day.upper || 0)));
  const ceiling = Math.ceil(max / 4) * 4;
  const chartWidth = Math.max(560, predictions.length * 78 + 60);
  const plotWidth = chartWidth - 60;
  const y = value => 190 - value / ceiling * 160;
  const updated = new Date(forecast.generatedAt);

  return (
    <div className="forecast-container">
      <div className="forecast-header">
        <div>
          <div className="forecast-title-row">
            <h2><ChartIcon size={24} color="#00796b" />Demand Forecast</h2>
            <span className={`forecast-data-badge ${limited || simulated ? 'limited' : ''}`}>
              {baseline ? 'Baseline estimate' : simulated ? 'Preview estimates' : limited ? 'Limited data' : 'Historical data'} · {historyDays} days of history
            </span>
          </div>
          <p className="forecast-subtitle">
            <span className="forecast-period"><CalendarIcon size={14} color="currentColor" />Next {days} days</span>
            {!Number.isNaN(updated.getTime()) && <span className="forecast-updated">Updated {updated.toLocaleString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} (PH)</span>}
          </p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="btn-refresh"><RefreshIcon size={16} color="currentColor" />{refreshing ? 'Refreshing...' : 'Refresh'}</button>
      </div>
      {simulated && <p className="forecast-preview">Preview estimates: the forecasting model is unavailable. These simulated values should not be used for purchasing or staffing decisions.</p>}
      {baseline && <p className="forecast-preview">Using historical weekday averages while Prophet is unavailable. The displayed range reflects historical variation, not a calibrated confidence interval.</p>}
      {!first ? <p className="forecast-empty">No daily predictions are available. Refresh to try again.</p> : <>
        <div className="forecast-summary" aria-label="Forecast summary">
          <div><span>{firstLabel}</span><strong>{first.predicted} <small>orders</small></strong><p>Expected: {range(first)}</p></div>
          <div><span>Next {days} days</span><strong>{total} <small>orders</small></strong><p>{predictions.length < days ? `Partial forecast · ${predictions.length} days available` : 'Estimated total'}</p></div>
          <div><span>Busiest day</span><strong className="forecast-peak">{peakDays.length === predictions.length && peakDays.length > 1 ? 'Similar demand' : dateLabel(peakDays[0].ds, { weekday: 'short', month: 'short', day: 'numeric' })}</strong><p>{peak} orders{peakDays.length > 1 ? ` · tied across ${peakDays.length} days` : ' estimated'}</p></div>
        </div>
        <figure className="forecast-figure">
          <figcaption><div><h3>Daily demand</h3><p>Estimated orders and expected range</p></div><div className="forecast-legend"><span><i className="estimate-key" />Estimated orders</span><span><i className="range-key" />Expected range</span></div></figcaption>
          <div className="forecast-plot-scroll" tabIndex={0} role="region" aria-label="Daily demand chart; scroll horizontally on small screens">
            <svg className="forecast-plot" viewBox={`0 0 ${chartWidth} 254`} role="img" aria-label="Daily order estimates with shaded expected ranges. Exact values are listed below.">
              {[0, 1, 2, 3, 4].map(tick => <g key={tick}><line x1="44" x2={chartWidth - 16} y1={y(tick * ceiling / 4)} y2={y(tick * ceiling / 4)} stroke="#e5ece9" /><text x="34" y={y(tick * ceiling / 4) + 4} textAnchor="end">{tick * ceiling / 4}</text></g>)}
              {predictions.map((day, index) => {
                const x = 44 + (index + 0.5) * plotWidth / predictions.length;
                return <g key={day.ds}>
                  <title>{dateLabel(day.ds, { weekday: 'long', month: 'short', day: 'numeric' })}: {day.predicted} orders; {range(day)}</title>
                  {day.lower != null && day.upper != null && <rect x={x - 25} y={y(day.upper)} width="50" height={Math.max(2, y(day.lower) - y(day.upper))} rx="4" fill="#d7e9e3" />}
                  <rect x={x - 11} y={y(day.predicted)} width="22" height={Math.max(2, 190 - y(day.predicted))} rx="3" fill="#008575" />
                  <text x={x} y={y(Math.max(day.predicted, day.upper || 0)) - 8} textAnchor="middle" className="forecast-bar-value">{day.predicted}</text>
                  <text x={x} y="216" textAnchor="middle">{dateLabel(day.ds, { weekday: 'short' })}</text>
                  <text x={x} y="236" textAnchor="middle">{dateLabel(day.ds, { month: 'short', day: 'numeric' })}</text>
                </g>;
              })}
            </svg>
          </div>
          <div className="forecast-day-values" aria-label="Daily forecast values">
            {predictions.map(day => <div key={day.ds}><strong>{dateLabel(day.ds, { weekday: 'short', month: 'short', day: 'numeric' })}</strong><span>{day.predicted} orders</span><small>{range(day)}</small></div>)}
          </div>
        </figure>
        {!simulated && <div className="forecast-guidance"><InfoIcon size={20} color="currentColor" /><div>
          <strong>{firstLabel} {quieter ? 'may be quieter than usual.' : busier ? 'may be busier than usual.' : change == null ? 'demand is an early estimate.' : 'looks close to usual demand.'}</strong>
          {change != null && <p>{Math.abs(change).toFixed(1)}% {change < 0 ? 'below' : 'above'} the historical daily average of {average.toFixed(1)} orders.</p>}
          <p>{quieter ? 'Consider lighter prep; check confirmed orders before adjusting staffing.' : busier ? 'Review ingredient availability and confirmed orders before adding prep or staffing.' : 'Use your usual prep as a starting point and check confirmed orders.'}</p>
          {limited && <p className="forecast-caution">Only {historyDays} days of history are available. Treat these estimates as early guidance.</p>}
        </div></div>}
      </>}
      <details className="forecast-method">
        <summary>How this forecast is calculated</summary>
        <p>Daily estimates use historical order counts. Expected ranges show model uncertainty, not guaranteed minimums or maximums. Displayed counts are rounded and cannot be negative.</p>
        <p>Fewer than 14 days of history is marked as limited data because the forecasting model needs at least two weeks to enable weekly patterns. More history can help, but does not guarantee accuracy.</p>
        <dl><div><dt>Algorithm</dt><dd>{metadata.algorithmUsed || 'Unavailable'}</dd></div><div><dt>Historical data</dt><dd>{historyDays} days</dd></div><div><dt>Average orders per day</dt><dd>{Number.isFinite(average) ? average.toFixed(1) : 'Unavailable'}</dd></div></dl>
      </details>
    </div>
  );
};

export default ForecastChart;
