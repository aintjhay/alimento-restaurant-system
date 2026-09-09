import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PortalOrderCard from './PortalOrderCard';
import { mergeOrderUpdate, orderItemTotal } from '../../utils/orderUtils';

test('status updates retain receipt item names and prices', () => {
  const initial = { totalAmount: 733.2, items: [{ _id: 'item-1', name: 'Pasta', price: 610, quantity: 1, itemTotal: 610 }] };
  const updated = mergeOrderUpdate(initial, { status: 'preparing', items: [{ _id: 'item-1', itemStatus: 'preparing' }] });
  expect(updated.items[0]).toMatchObject({ name: 'Pasta', itemTotal: 610, itemStatus: 'preparing' });
  expect(updated.totalAmount).toBe(733.2);
});

test('expanded receipt explains tax and separates cash payment from order status', () => {
  render(<PortalOrderCard order={{ orderNumber: 'ORD-3', status: 'pending', paymentMethod: 'cash', paymentStatus: 'unpaid', subtotal: 610, taxAmount: 73.2, deliveryFee: 50, totalAmount: 733.2, items: [{ name: 'PASTA', itemTotal: 610, quantity: 1 }] }} />);
  expect(screen.getByText('Awaiting confirmation')).toBeInTheDocument();
  expect(screen.getByText('Pay on delivery')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'View details' }));
  expect(screen.getByText('Tax')).toBeInTheDocument();
  expect(screen.getByText(/73.20/)).toBeInTheDocument();
  expect(screen.getByText(/Pasta/, { selector: 'strong' })).toBeInTheDocument();
});

test('missing historical prices stay unavailable and free items remain zero', () => {
  expect(orderItemTotal({ quantity: 1 })).toBeNull();
  expect(orderItemTotal({ itemTotal: 0, quantity: 1, price: 100 })).toBe(0);
  expect(orderItemTotal({ price: 100, quantity: 2, modifiers: [{ extraPrice: 10 }], addons: [{ price: 20 }] })).toBe(260);
});
