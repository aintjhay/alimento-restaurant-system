import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SalesReport from './SalesReport';
jest.mock('../../components/admin/AdminNav', () => ({ children }) => <main>{children}</main>);
jest.mock('react-chartjs-2', () => ({ Line: () => <div>Sales chart</div> }));
jest.mock('../../services/api', () => ({ API_URL: '/api', authHeaders: () => ({}) }));
const report = { data: [{ _id: '1', orderNumber: 'ORD-1', createdAt: '2026-09-07T02:00:00Z', paymentStatus: 'paid', paymentMethod: 'cash', totalAmount: 179.2, items: [{ name: 'Coffee', quantity: 2, itemTotal: 160 }], subtotal: 160 }], summary: { totalSales: 179.2, paidOrderCount: 1, unpaidTotal: 0, averageOrderValue: 179.2, orderCount: 1, itemsSold: 2 }, range: { start: null, end: '2026-09-07T02:00:00Z' }, trend: [], topItems: [], comparison: null };
test('opens order details and sends payment filters', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => report });
  render(<SalesReport />);
  fireEvent.click(await screen.findByRole('button', { name: 'ORD-1' }));
  expect(screen.getByRole('region', { name: 'Order details' })).toHaveTextContent('Coffee');
  fireEvent.change(screen.getByLabelText('Payment status'), { target: { value: 'unpaid' } });
  await waitFor(() => expect(global.fetch).toHaveBeenLastCalledWith(expect.stringContaining('paymentStatus=unpaid'), expect.anything()));
});
test('failed report displays error without misleading zero totals', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ message: 'Unable to load report' }) });
  render(<SalesReport />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load report');
  expect(screen.queryByText('Average paid order')).not.toBeInTheDocument();
});
