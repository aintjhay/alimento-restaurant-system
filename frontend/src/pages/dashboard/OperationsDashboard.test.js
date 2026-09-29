import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OperationsDashboard, { active, unpaid, sale, dayKey, nextStep } from './OperationsDashboard';

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
  fireEvent.click(screen.getByRole('button', { name: 'Close payment review' }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Start prep' })[0]);
  await waitFor(() => expect(screen.getByLabelText('Status for ORD-0')).toHaveTextContent('Preparing'));
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/orders/0/status'), expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'preparing' }) }));
  fireEvent.click(screen.getByRole('button', { name: /^All / }));
  expect(screen.getByText('No orders to show.')).toBeInTheDocument();
});

const paymentOrder = overrides => ({ _id: 'pay', orderNumber: 'ORD-PAY', createdAt: '2020-01-01T00:00:00Z', status: 'preparing', paymentStatus: 'payment_pending_verification', paymentMethod: 'gcash', totalAmount: 230, items: [], ...overrides });
const mockPayment = (order, result) => {
  global.fetch = jest.fn(async (url, options) => ({ ok: true, json: async () => options?.method === 'PATCH' ? result : url.includes('inventory') ? { success: true, items: [] } : { success: true, orders: [order] } }));
};
test.each([undefined, 'data:image/png;base64,receipt'])('confirms payment independently with proof %s', async paymentProof => {
  const order = paymentOrder({ paymentProof });
  mockPayment(order, { success: true, order: { ...order, paymentStatus: 'payment_verified' } });
  render(<OperationsDashboard />);
  fireEvent.click(await screen.findByRole('button', { name: 'Review payment' }));
  expect(global.fetch.mock.calls.filter(([, options]) => options?.method === 'PATCH')).toHaveLength(0);
  expect(screen.getByText(/Order total:/)).toHaveTextContent('230.00');
  if (paymentProof) expect(screen.getByAltText('Customer payment receipt')).toHaveAttribute('src', paymentProof);
  else expect(screen.getByText('No payment receipt attached.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm payment received' }));
  await screen.findAllByText('Payment verified');
  expect(screen.getByLabelText('Status for ORD-PAY')).toHaveTextContent('Preparing');
  expect(screen.getByRole('button', { name: /^Unpaid / })).toHaveTextContent('Unpaid 0');
  expect(screen.queryByRole('button', { name: 'Review payment' })).not.toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/orders/pay/status'), expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ paymentStatus: 'payment_verified' }) }));
});
test('failed confirmation keeps payment pending and allows retry', async () => {
  mockPayment(paymentOrder(), { success: false, message: 'Payment update failed' });
  render(<OperationsDashboard />);
  fireEvent.click(await screen.findByRole('button', { name: 'Review payment' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm payment received' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Payment update failed');
  expect(screen.getAllByText('Payment pending verification')).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'Confirm payment received' })).toBeEnabled();
});
test.each([{ paymentStatus: 'paid' }, { paymentStatus: 'payment_verified' }, { paymentStatus: 'refunded' }, { paymentMethod: 'qrph' }])('hides manual confirmation for %j', async overrides => {
  mockPayment(paymentOrder(overrides));
  render(<OperationsDashboard />);
  fireEvent.click(await screen.findByRole('button', { name: 'ORD-PAY' }));
  expect(screen.queryByRole('button', { name: 'Review payment' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Confirm payment received' })).not.toBeInTheDocument();
});

test.each([
  ['pending', 'Delivery', 'preparing', 'Start prep'],
  ['preparing', 'Delivery', 'ready', 'Mark ready'],
  ['ready', 'Delivery', 'out_for_delivery', 'Dispatch order'],
  ['out_for_delivery', 'Delivery', 'completed', 'Mark delivered'],
  ['ready', 'Takeaway', 'completed', 'Mark collected'],
  ['ready', 'Dine-in', 'served', 'Mark served'],
  ['served', 'Dine-in', 'completed', 'Complete order']
])('offers next step for %s %s', (status, orderType, next, title) => {
  expect(nextStep({ status, orderType })).toEqual([next, title]);
});
test('terminal orders have no next step', () => {
  expect(nextStep({ status: 'completed' })).toBeNull();
  expect(nextStep({ status: 'cancelled' })).toBeNull();
});
test('opens payment drawer, enlarges receipt, and closes without changing payment', async () => {
  mockPayment(paymentOrder({ paymentProof: 'data:image/png;base64,receipt' }));
  render(<OperationsDashboard />);
  const trigger = await screen.findByRole('button', { name: 'Review payment' });
  trigger.focus();
  fireEvent.click(trigger);
  expect(screen.getByRole('dialog', { name: 'Order and payment review' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Enlarge receipt' }));
  expect(screen.getByRole('button', { name: 'Shrink receipt' })).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Close payment review' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(global.fetch.mock.calls.filter(([, options]) => options?.method === 'PATCH')).toHaveLength(0);
});


test('searches orders on the server and shows a useful empty state', async () => {
  global.fetch = jest.fn(async url => ({ ok: true, json: async () =>
    url.includes('/summary') ? { summary: { collected: 450 }, delayedCount: 0 } :
    url.includes('inventory') ? { success: true, items: [] } :
    { success: true, orders: [], pagination: { total: 0 } }
  }));
  render(<OperationsDashboard />);
  expect(await screen.findByText('All caught up')).toBeInTheDocument();
  expect(screen.getByText('No active orders. New orders will appear here automatically.')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Find an order' }), { target: { value: 'Table 12' } });
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('search=Table%2012'), expect.anything()));
  expect(await screen.findByText('No matching orders. Try another order number or table.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  await screen.findByText('No active orders. New orders will appear here automatically.');
});
