import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrdersPanel from './OrdersPanel';

const order = { _id: '1', orderNumber: 'ORD-123', createdAt: '2026-09-28T05:00:00Z', status: 'completed', paymentStatus: 'paid', totalAmount: 100, subtotal: 100, paymentMethod: 'cash', items: [{ name: 'Rice', quantity: 1, itemTotal: 100 }] };
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ orders: [order], pagination: { total: 16 } }) });
});
afterEach(() => jest.restoreAllMocks());

test('status menu supports keyboard navigation and resets pagination when filtering', async () => {
  render(<OrdersPanel onClose={() => {}} />);
  await screen.findByText('ORD-123');
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  fireEvent.keyDown(screen.getByRole('button', { name: 'Status All history' }), { key: 'ArrowDown' });
  expect(screen.getByRole('option', { name: 'All history' })).toHaveFocus();
  fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' });
  expect(screen.getByRole('option', { name: 'Completed' })).toHaveFocus();
  fireEvent.click(document.activeElement);
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Status Completed' })).toHaveFocus();
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
  const params = new URL(global.fetch.mock.calls[2][0]).searchParams;
  expect(params.get('status')).toBe('completed');
  expect(params.get('page')).toBe('1');
});

test('Escape and outside clicks dismiss the status menu without closing Orders', async () => {
  const onClose = jest.fn();
  render(<OrdersPanel onClose={onClose} />);
  await screen.findByText('ORD-123');
  const trigger = screen.getByRole('button', { name: 'Status All history' });
  fireEvent.click(trigger);
  fireEvent.keyDown(document.activeElement, { key: 'Escape' });
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(trigger).toHaveFocus();
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.click(trigger);
  fireEvent.pointerDown(screen.getByRole('heading', { name: 'Orders' }));
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});

test('filters history on the server, paginates, and shows active orders without a date limit', async () => {
  render(<OrdersPanel onClose={() => {}} />);
  await screen.findByText('ORD-123');
  let params = new URL(global.fetch.mock.calls[0][0]).searchParams;
  expect(params.get('status')).toBe('history');
  expect(params.get('startDate')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  expect(new URL(global.fetch.mock.calls[1][0]).searchParams.get('page')).toBe('2');
  fireEvent.click(screen.getByRole('button', { name: 'Active orders' }));
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
  params = new URL(global.fetch.mock.calls[2][0]).searchParams;
  expect(params.get('status')).toBe('active');
  expect(params.get('page')).toBe('1');
  expect(params.has('startDate')).toBe(false);
});

test('shows saved items and handles a blocked receipt popup', async () => {
  jest.spyOn(window, 'open').mockReturnValue(null);
  render(<OrdersPanel onClose={() => {}} />);
  fireEvent.click(await screen.findByText('ORD-123'));
  expect(screen.getByText('1 × Rice')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Reprint receipt' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Allow pop-ups');
});

test('retries failed requests', async () => {
  global.fetch.mockRejectedValueOnce(new Error('Connection lost'));
  render(<OrdersPanel onClose={() => {}} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Connection lost');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByText('ORD-123');
});

test('opens a focused detail view and returns to the selected order', async () => {
  render(<OrdersPanel onClose={() => {}} />);
  const row = (await screen.findByText('ORD-123')).closest('button');
  fireEvent.click(row);
  expect(screen.getByRole('heading', { name: 'ORD-123 details' })).toHaveFocus();
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Reprint receipt' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /Back to orders/ }));
  expect(screen.queryByRole('region', { name: 'Order details' })).not.toBeInTheDocument();
  expect(screen.getByRole('searchbox')).toBeVisible();
  await waitFor(() => expect(row).toHaveFocus());
});
