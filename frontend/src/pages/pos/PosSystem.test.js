jest.mock('../../services/storeService', () => ({ getStore: async () => ({ isOpen: true, promotions: [] }), promoFor: () => undefined, quoteOrder: async () => ({ totalAmount: 100, discount: 0 }) }));
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PosSystem from './PosSystem';

jest.mock('../../components/pos/ModifierModal', () => () => null);
jest.mock('../../utils/imageUtils', () => ({ getFoodImage: () => '', getItemColor: () => '#eee' }));

const response = (name) => ({ ok: true, json: async () => ({
  data: [{ id: name, name, price: 100, category: name, modifiers: [], addons: [] }],
  pagination: { page: 1, totalPages: 1 }
}) });

afterEach(() => jest.restoreAllMocks());

test('browsing orders preserves the current cart', async () => {
  global.fetch = jest.fn().mockResolvedValueOnce(response('Rice dish'))
    .mockResolvedValue({ ok: true, json: async () => ({ orders: [], pagination: { total: 0 } }) });
  render(<PosSystem />);
  fireEvent.click(await screen.findByRole('button', { name: /Add/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Orders', exact: true }));
  await screen.findByText('No orders found');
  fireEvent.click(screen.getByRole('button', { name: 'Close orders' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Place Order' })).toBeInTheDocument();
  expect(screen.queryByText('Your cart is empty')).not.toBeInTheDocument();
});

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});

test('confirms orders in the POS and prevents duplicate submissions', async () => {
  let resolveOrder;
  global.fetch = jest.fn().mockResolvedValueOnce(response('Rice dish'))
    .mockImplementationOnce(() => new Promise(resolve => { resolveOrder = resolve; }));
  render(<PosSystem />);
  fireEvent.click(await screen.findByRole('button', { name: /Add/ }));
  await waitFor(() => expect(screen.queryByText('Updating total...')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Place Order' }));
  expect(screen.getByRole('dialog', { name: 'Confirm this order?' })).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Place Order' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm order' }));
  expect(screen.getByRole('button', { name: 'Submitting order…' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Submitting order…' }));
  expect(global.fetch).toHaveBeenCalledTimes(2);
  await act(async () => resolveOrder({ ok: true, json: async () => ({ success: true, order: { orderNumber: 'ORD-123', totalAmount: 100 } }) }));
  expect(screen.getByRole('dialog', { name: 'Order placed!' })).toHaveTextContent('ORD-123');
  expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Start next order' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('shows submission errors in a dialog and keeps the cart', async () => {
  global.fetch = jest.fn().mockResolvedValueOnce(response('Rice dish')).mockRejectedValueOnce(new Error('Connection lost'));
  jest.spyOn(console, 'error').mockImplementation(() => {});
  render(<PosSystem />);
  fireEvent.click(await screen.findByRole('button', { name: /Add/ }));
  await waitFor(() => expect(screen.queryByText('Updating total...')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Place Order' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm order' }));
  expect(await screen.findByRole('dialog', { name: 'Order needs attention' })).toHaveTextContent('Connection lost');
  expect(screen.queryByText('Your cart is empty')).not.toBeInTheDocument();
});

test('reuses a recently loaded category without another request', async () => {
  global.fetch = jest.fn().mockResolvedValueOnce(response('Rice dish')).mockResolvedValueOnce(response('Pasta dish'));
  render(<PosSystem />);
  await screen.findByText('Rice dish');
  fireEvent.click(screen.getByRole('button', { name: 'Pasta', exact: true }));
  await screen.findByText('Pasta dish');
  fireEvent.click(screen.getByRole('button', { name: 'Rice Meals', exact: true }));
  await screen.findByText('Rice dish');
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

test('ignores a late response from a previously selected category', async () => {
  let resolveRice;
  global.fetch = jest.fn().mockImplementationOnce(() => new Promise(resolve => { resolveRice = resolve; }))
    .mockResolvedValueOnce(response('Pasta dish'));
  render(<PosSystem />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole('button', { name: 'Pasta', exact: true }));
  await screen.findByText('Pasta dish');
  await act(async () => resolveRice(response('Rice dish')));
  expect(screen.queryByText('Rice dish')).not.toBeInTheDocument();
  expect(screen.getByText('Pasta dish')).toBeInTheDocument();
  expect(global.fetch.mock.calls[0][1].signal.aborted).toBe(true);
});
