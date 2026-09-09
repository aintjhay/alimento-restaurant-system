import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useParams } from 'react-router-dom';
import PortalTracking from './PortalTracking';

jest.mock('react-router-dom', () => { const navigate = jest.fn(); return { useNavigate: () => navigate, useParams: jest.fn() }; }, { virtual: true });
jest.mock('../../components/portal/PortalHeader', () => () => null);
jest.mock('../../components/portal/PortalFooter', () => () => null);
jest.mock('../../services/api', () => ({ API_URL: '/api' }));

beforeEach(() => {
  localStorage.clear();
  useParams.mockReturnValue({ token: 'private-token' });
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ order: { orderNumber: 'ORD-42', status: 'preparing', paymentStatus: 'unpaid', paymentMethod: 'cash' } }) });
});

test('opens a private link without an account or local receipt and allows copying it', async () => {
  const writeText = jest.fn().mockResolvedValue();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  render(<PortalTracking />);
  expect(await screen.findByText('Preparing your order')).toBeInTheDocument();
  expect(screen.getByText('Pay on delivery')).toBeInTheDocument();
  expect(screen.getByText('Preparing').closest('li')).toHaveAttribute('aria-current', 'step');
  expect(fetch).toHaveBeenCalledWith('/api/orders/track/private-token', expect.any(Object));
  fireEvent.click(screen.getByRole('button', { name: 'Copy tracking link' }));
  expect(await screen.findByText('Tracking link copied.')).toBeInTheDocument();
});

test('explains an invalid link without sending the guest to login', async () => {
  fetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
  render(<PortalTracking />);
  expect(await screen.findByRole('alert')).toHaveTextContent('This tracking link is invalid');
});

test('completed orders show a finished timeline', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ order: { orderNumber: 'ORD-42', status: 'completed', paymentStatus: 'paid' } }) });
  render(<PortalTracking />);
  expect(await screen.findByText('Order completed')).toBeInTheDocument();
  expect(screen.getAllByText('Done')).toHaveLength(4);
  expect(screen.queryByText('In progress')).not.toBeInTheDocument();
});

test('cancelled orders do not show an active fulfillment timeline', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ order: { orderNumber: 'ORD-42', status: 'cancelled', paymentStatus: 'refunded' } }) });
  render(<PortalTracking />);
  expect(await screen.findByText('Order cancelled')).toBeInTheDocument();
  expect(screen.queryByRole('list', { name: 'Order progress' })).not.toBeInTheDocument();
  expect(screen.getByText('Refunded')).toBeInTheDocument();
});
