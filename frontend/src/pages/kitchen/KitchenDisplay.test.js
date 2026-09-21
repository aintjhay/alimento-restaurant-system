import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import KitchenDisplay from './KitchenDisplay';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../../services/api', () => ({ authHeaders: () => ({}) }));
jest.mock('./StationUpdates', () => ({
  ConnectionStatus: () => null,
  MixedOrderProgress: () => null,
  getNewOrderIds: () => [],
  useOrderSound: () => ({ soundReady: false })
}));

test('shows food and drinks together and updates the original drink index', async () => {
  const order = {
    _id: 'mixed', orderNumber: 'ORDER-1', status: 'pending',
    createdAt: new Date().toISOString(),
    items: [
      { name: 'Pasta', category: 'Pasta', quantity: 1, itemStatus: 'pending' },
      { name: 'Latte', category: 'Coffee', quantity: 1, itemStatus: 'pending' }
    ]
  };
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, orders: [order] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({
      success: true, order: { ...order, items: [order.items[0], { ...order.items[1], itemStatus: 'preparing' }] }
    }) });
  const { unmount } = render(<KitchenDisplay />);
  expect(await screen.findByText('Pasta')).toBeTruthy();
  const drink = screen.getByText('Latte').closest('.kds-item');
  expect(within(drink).getByText('Bar')).toBeTruthy();
  fireEvent.click(within(drink).getByRole('button', { name: /Start Preparing/ }));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({
    status: 'preparing', itemIndex: 1, changedBy: 'bartender'
  });
  await waitFor(() => expect(within(screen.getByText('Latte').closest('.kds-item')).queryByRole('button', { name: /Start Preparing/ })).toBeNull());
  expect(screen.getByText('Pasta')).toBeTruthy();
  unmount();
  delete global.fetch;
});


test('keeps three working lanes and exposes delivery and fetched history separately', async () => {
  const ticket = (id, status, minutes = 0) => ({
    _id: id, orderNumber: id, status, orderType: 'Delivery',
    createdAt: new Date(Date.now() - minutes * 60000).toISOString(),
    items: [{ name: `${id} item`, category: 'Pasta', quantity: 2, itemStatus: status }]
  });
  global.fetch = jest.fn(async url => ({ ok: true, json: async () => ({ success: true,
    orders: url.includes('status=completed') ? [ticket('DONE', 'completed')]
      : url.includes('status=cancelled') ? [ticket('VOID', 'cancelled')]
        : [ticket('WAITING', 'pending', 35), ticket('RIDER', 'out_for_delivery')]
  }) }));
  const { unmount } = render(<KitchenDisplay />);
  await screen.findByText('WAITING');
  expect(screen.getAllByRole('region')).toHaveLength(3);
  expect(screen.getByText('Overdue')).toBeInTheDocument();
  expect(screen.queryByText('RIDER')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Active Orders 1' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Out for Delivery 1' }));
  expect(screen.getByText('RIDER')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Mark delivered' })).toBeInTheDocument();
  expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'History' }));
  expect(await screen.findByText('DONE')).toBeInTheDocument();
  expect(screen.getByText('VOID')).toBeInTheDocument();
  expect(screen.queryByText('RIDER')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Start Preparing' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'All Orders 4' }));
  expect(screen.getByText('RIDER')).toBeInTheDocument();
  expect(screen.getByText('WAITING')).toBeInTheDocument();
  unmount();
  delete global.fetch;
});

test('history failures remain visible and Refresh retries the history request', async () => {
  let failHistory = true;
  global.fetch = jest.fn(async url => ({
    ok: !(url.includes('status=completed') && failHistory),
    json: async () => ({ success: true, orders: [] })
  }));
  const { unmount } = render(<KitchenDisplay />);
  fireEvent.click(await screen.findByRole('button', { name: 'History' }));
  expect(await screen.findByText('Unable to load history. Try Refresh.')).toBeInTheDocument();
  failHistory = false;
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('History includes served orders'));
  expect(fetch.mock.calls.filter(([url]) => url.includes('status=completed'))).toHaveLength(2);
  unmount();
  delete global.fetch;
});
