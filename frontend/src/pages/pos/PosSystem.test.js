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
