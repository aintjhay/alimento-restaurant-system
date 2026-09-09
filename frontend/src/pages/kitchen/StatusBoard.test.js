import React from 'react';
import { render, screen, within } from '@testing-library/react';
import StatusBoard, { getStationStatus } from './StatusBoard';

test('station items determine readiness independently of the other station', () => {
  expect(getStationStatus({ status: 'ready' }, [{ itemStatus: 'pending' }])).toBe('pending');
  expect(getStationStatus({ status: 'preparing' }, [{ itemStatus: 'ready' }])).toBe('ready');
  expect(getStationStatus({ status: 'pending' }, [{ itemStatus: 'ready' }, { itemStatus: 'preparing' }])).toBe('preparing');
  expect(getStationStatus({ status: 'ready' }, [{ itemStatus: 'served' }])).toBe('served');
  expect(getStationStatus({ status: 'cancelled' }, [{ itemStatus: 'pending' }])).toBe('cancelled');
  expect(getStationStatus({ status: 'completed' }, [{ itemStatus: 'pending' }])).toBe('completed');
});

test('active board retains empty lanes, orders oldest first, and excludes served tickets', () => {
  const orders = [
    { _id: 'new', status: 'pending', createdAt: '2026-09-08T02:00:00Z' },
    { _id: 'old', status: 'pending', createdAt: '2026-09-08T01:00:00Z' },
    { _id: 'served', status: 'served', createdAt: '2026-09-08T00:00:00Z' }
  ];
  render(<StatusBoard orders={orders} filter="active" preparingLabel="Cooking">
    {order => <article key={order._id}>{order._id}</article>}
  </StatusBoard>);
  expect(within(screen.getByRole('region', { name: 'Pending' })).getAllByRole('article').map(el => el.textContent)).toEqual(['old', 'new']);
  expect(screen.getByText('No cooking orders')).toBeTruthy();
  expect(screen.getByText('No ready orders')).toBeTruthy();
  expect(screen.queryByText('served')).toBeNull();
});

test('updated tickets move between columns and served history remains accessible', () => {
  const ticket = { _id: 'drink', status: 'pending', createdAt: '2026-09-08T01:00:00Z' };
  const board = (status, filter = 'active') => (
    <StatusBoard orders={[{ ...ticket, status }]} filter={filter} preparingLabel="Making">
      {order => <article key={order._id}>{order._id}</article>}
    </StatusBoard>
  );
  const { rerender } = render(board('pending'));
  rerender(board('preparing'));
  expect(within(screen.getByRole('region', { name: 'Making' })).getByText('drink')).toBeTruthy();
  expect(screen.getByText('No pending orders')).toBeTruthy();
  rerender(board('ready'));
  expect(within(screen.getByRole('region', { name: 'Ready' })).getByText('drink')).toBeTruthy();
  rerender(board('served', 'served'));
  expect(within(screen.getByRole('region', { name: 'Served' })).getByText('drink')).toBeTruthy();
});
