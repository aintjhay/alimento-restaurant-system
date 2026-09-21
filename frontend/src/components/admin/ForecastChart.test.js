import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import ForecastChart from './ForecastChart';

jest.mock('axios', () => ({ get: jest.fn() }));
const response = (overrides = {}) => ({
  status: 'success', generatedAt: '2026-09-17T06:10:00Z',
  modelMetadata: { algorithmUsed: 'Prophet (Facebook)', historicalDataPoints: 5, dataStatistics: { avgOrdersPerDay: 4 } },
  forecast: Array.from({ length: 7 }, (_, index) => ({ ds: `2026-09-${18 + index}`, yhat: 2, yhat_lower: -1, yhat_upper: 5, trend: 1.6 })),
  ...overrides,
});
beforeEach(() => axios.get.mockReset());

test('shows all days, nonnegative ranges, totals and tied peaks without expanding a section', async () => {
  axios.get.mockResolvedValue({ data: response() });
  render(<ForecastChart />);
  expect(await screen.findByText(/Limited data/)).toHaveTextContent('5 days of history');
  expect(screen.getByRole('img', { name: /Daily order estimates/ })).toBeInTheDocument();
  const summary = screen.getByLabelText('Forecast summary');
  expect(within(summary).getByText(/14/)).toHaveTextContent('14 orders');
  expect(within(summary).getByText('Similar demand')).toBeInTheDocument();
  expect(screen.getByLabelText('Daily forecast values').children).toHaveLength(7);
  expect(screen.getAllByText('0–5 orders')).toHaveLength(7);
  expect(screen.queryByText('1.6%')).not.toBeInTheDocument();
  expect(screen.getByText(/50.0% below/)).toHaveTextContent('historical daily average of 4.0 orders');
  expect(screen.getByText(/Consider lighter prep/)).toHaveTextContent('check confirmed orders');
});

test('keeps simulated estimates clearly marked and omits operational advice', async () => {
  axios.get.mockResolvedValue({ data: response({ modelMetadata: { algorithmUsed: 'Mock Forecast', historicalDataPoints: 5 } }) });
  render(<ForecastChart />);
  expect(await screen.findByText(/These simulated values/)).toBeInTheDocument();
  expect(screen.queryByText(/Consider lighter prep/)).not.toBeInTheDocument();
});

test('handles empty predictions and refreshes to a partial forecast with unavailable ranges', async () => {
  axios.get.mockResolvedValueOnce({ data: response({ forecast: [] }) }).mockResolvedValueOnce({ data: response({ forecast: [{ ds: '2026-09-18', yhat: 0 }] }) });
  render(<ForecastChart />);
  expect(await screen.findByText(/No daily predictions/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(await screen.findByText('Partial forecast · 1 days available')).toBeInTheDocument();
  expect(screen.getByText('Range unavailable')).toBeInTheDocument();
  expect(screen.getByLabelText('Forecast summary')).toHaveTextContent('0 orders');
});
