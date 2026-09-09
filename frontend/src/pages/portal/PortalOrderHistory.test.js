import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import PortalOrderHistory from './PortalOrderHistory';
import realtimeService from '../../services/realtimeService';

jest.mock('react-router-dom', () => { const navigate = jest.fn(); return { useNavigate: () => navigate }; }, { virtual: true });
jest.mock('../../components/portal/PortalHeader', () => () => null);
jest.mock('../../components/portal/PortalFooter', () => () => null);
jest.mock('../../components/portal/PortalOrderCard', () => () => null);
jest.mock('../../components/portal/OrderStatusNotification', () => () => null);
jest.mock('../../services/realtimeService', () => ({ startPolling: jest.fn(), stopPolling: jest.fn(), stopAllPolling: jest.fn(), on: jest.fn(), notify: jest.fn(), getStatusText: value => value }));

test('order responses do not restart polling; completed orders stop polling', async () => {
  const order = { _id: 'order-1', orderNumber: 'ORD-1', status: 'pending', items: [] };
  localStorage.setItem('portalUser', JSON.stringify({ id: 'customer-1' }));
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, orders: [order] }) });
  render(<PortalOrderHistory />);
  await waitFor(() => expect(realtimeService.startPolling).toHaveBeenCalledTimes(1));
  const update = realtimeService.startPolling.mock.calls[0][1];
  act(() => update({ ...order }));
  act(() => update({ ...order, status: 'preparing' }));
  expect(realtimeService.startPolling).toHaveBeenCalledTimes(1);
  act(() => update({ data: { ...order, status: 'completed' } }));
  expect(realtimeService.stopPolling).toHaveBeenCalledWith('order-1');
});
