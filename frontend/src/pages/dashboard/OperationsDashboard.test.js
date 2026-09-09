import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OperationsDashboard, { active, unpaid, sale, dayKey } from './OperationsDashboard';

jest.mock('react-router-dom', () => ({ Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a> }), { virtual: true });
jest.mock('../../components/admin/ForecastChart', () => () => <div>Forecast</div>);
jest.mock('../../services/api', () => ({ authHeaders: () => ({}) }));

test('classifies payments and operations independently and uses Philippines dates', () => {
  expect(active({ status: 'served' })).toBe(true);
  expect(active({ status: 'completed' })).toBe(false);
  expect(unpaid({ status: 'cancelled', paymentStatus: 'unpaid' })).toBe(false);
  expect(unpaid({ paymentStatus: 'payment_verified' })).toBe(false);
  expect(unpaid({ paymentStatus: 'partially_paid' })).toBe(true);
  expect(sale({ status: 'cancelled' })).toBe(false);
  expect(sale({ paymentStatus: 'refunded' })).toBe(false);
  expect(dayKey('2026-09-06T17:00:00Z')).toBe('2026-09-07');
});

test('keeps old active orders visible, paginates, expands details, and updates status', async () => {
  const orders = Array.from({ length: 12 }, (_, index) => ({ _id: String(index), orderNumber: `ORD-${index}`, createdAt: '2020-01-01T00:00:00Z', status: 'pending', paymentStatus: 'unpaid', totalAmount: 100, tableNumber: 1, items: [{ name: 'Chicken wings', quantity: 2 }] }));
  global.fetch = jest.fn(async (url, options) => {
    if (options?.method === 'PATCH') { orders[0].status = 'preparing'; return { ok: true, json: async () => ({ success: true }) }; }
    return { ok: true, json: async () => url.includes('inventory') ? { success: true, items: [] } : { success: true, orders: orders.map(order => ({ ...order })) } };
  });
  render(<OperationsDashboard />);
  await screen.findByRole('button', { name: 'ORD-0' });
  expect(screen.queryByRole('button', { name: 'ORD-11' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Show more/ }));
  expect(screen.getByRole('button', { name: 'ORD-11' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'ORD-0' }));
  expect(screen.getByText('2 × Chicken wings')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Status for ORD-0'), { target: { value: 'preparing' } });
  await waitFor(() => expect(screen.getByLabelText('Status for ORD-0')).toHaveValue('preparing'));
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/orders/0/status'), expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'preparing' }) }));
  fireEvent.click(screen.getByRole('button', { name: /^All / }));
  expect(screen.getByText('No orders to show.')).toBeInTheDocument();
});
