jest.mock('../../services/storeService', () => ({ getStore: async () => ({ isOpen: true, promotions: [] }), promoFor: () => undefined, quoteOrder: async () => ({ totalAmount: 100, discount: 0 }) }));
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PortalHome from './PortalHome';
import { menuAPI } from '../../services/api';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../../components/portal/PortalHeader', () => () => <header className="portal-header" />);
jest.mock('../../components/portal/PortalFooter', () => () => null);
jest.mock('../../services/api', () => ({ menuAPI: { getCategories: jest.fn(), getPage: jest.fn() } }));

beforeEach(() => {
  global.ResizeObserver = class { observe() {} disconnect() {} };
  localStorage.clear();
  menuAPI.getCategories.mockResolvedValue(['Coolers']);
  menuAPI.getPage.mockResolvedValue({
    items: [{ _id: 'cooler-1', name: 'ALIMENTO SUNRISE', price: 140, category: 'Coolers',
      modifiers: [{ name: 'Temperature', required: true, options: [
        { name: 'Hot', price: 75 }, { name: 'Cold', price: 140 }
      ] }], addons: [{ name: 'Extra syrup', price: 10 }] }],
    pagination: { page: 1, pageSize: 8, totalItems: 1, totalPages: 1 }
  });
});

test.each([['Cold', 140, 0], ['Hot', 75, -65]])('%s uses its full price in the cart and order adjustment', async (temperature, price, adjustment) => {
  render(<PortalHome />);
  fireEvent.click(await screen.findByRole('button', { name: /add to cart/i }));
  expect(screen.getByRole('radio', { name: /Cold/ })).toBeChecked();
  expect(screen.queryByText('+₱140')).not.toBeInTheDocument();
  expect(screen.queryByText('+₱75')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('radio', { name: new RegExp(temperature) }));
  fireEvent.click(screen.getAllByRole('button', { name: /add to cart/i }).slice(-1)[0]);
  await waitFor(() => {
    const [item] = JSON.parse(localStorage.getItem('portalCart'));
    expect(item.itemPrice).toBe(price);
    expect(item.modifiers[0].extraPrice).toBe(adjustment);
    expect(item.basePrice + item.modifiers[0].extraPrice).toBe(price);
  });
});

test('adds real add-ons to the selected temperature price', async () => {
  render(<PortalHome />);
  fireEvent.click(await screen.findByRole('button', { name: /add to cart/i }));
  fireEvent.click(screen.getByRole('radio', { name: /Hot/ }));
  fireEvent.click(screen.getByRole('checkbox', { name: /Extra syrup/ }));
  fireEvent.click(screen.getAllByRole('button', { name: /add to cart/i }).slice(-1)[0]);
  await waitFor(() => expect(JSON.parse(localStorage.getItem('portalCart'))[0].itemPrice).toBe(85));
});
