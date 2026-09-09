import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PortalCheckout from './PortalCheckout';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../services/api';

jest.mock('react-router-dom', () => { const navigate = jest.fn(); return { useNavigate: () => navigate }; }, { virtual: true });
jest.mock('../../components/portal/PortalHeader', () => () => <header className="portal-header" />);
jest.mock('../../components/portal/PortalFooter', () => () => null);
jest.mock('../../context/AuthContext', () => {
  const auth = { isAuthenticated: true, user: {
    id: 'customer-1', firstName: 'Test', lastName: 'Customer', phone: '09123456789',
    email: 'test@example.com', addresses: [{ _id: 'address-1', label: 'Home', street: '1 Main Street', city: 'Manila', postal: '1000', isDefault: true }]
  } };
  return { useAuth: () => auth };
});
jest.mock('../../services/api', () => ({ API_URL: '/api', ordersAPI: { create: jest.fn() } }));

beforeEach(() => {
  global.ResizeObserver = class { observe() {} disconnect() {} };
  localStorage.clear();
  sessionStorage.clear();
  useAuth().isAuthenticated = true;
  localStorage.setItem('portalCart', JSON.stringify([{
    id: 'food-1', menuItemId: 'food-1', name: 'CHICKEN WINGS', basePrice: 260,
    itemPrice: 310, quantity: 1, modifiers: [], addons: [{ name: 'Extra sauce', price: 50 }]
  }]));
  ordersAPI.create.mockReset();
});

test('includes customization prices when quantities change', () => {
  render(<PortalCheckout />);
  expect(screen.getByRole('button', { name: /Place order.*360.00/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Increase CHICKEN WINGS quantity' }));
  expect(screen.getByRole('button', { name: /Place order.*670.00/ })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('portalCart'))[0].quantity).toBe(2);
});

test('keeps contact editable and reveals manual address fields on request', () => {
  render(<PortalCheckout />);
  expect(screen.getByLabelText('Contact number *')).toHaveValue('09123456789');
  expect(screen.queryByLabelText('Complete address *')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Saved address'), { target: { value: '' } });
  expect(screen.getByLabelText('Complete address *')).toBeRequired();
  expect(screen.getByLabelText('Complete address *')).toHaveValue('');
});

test('summary button submits the associated form with customization totals', async () => {
  ordersAPI.create.mockResolvedValue({ success: false, message: 'Mock submission only' });
  render(<PortalCheckout />);
  const button = screen.getByRole('button', { name: /Place order.*360.00/ });
  expect(button.form.id).toBe('checkout-details');
  fireEvent.click(button);
  await waitFor(() => expect(ordersAPI.create).toHaveBeenCalledWith(expect.objectContaining({
    subtotal: 310, deliveryFee: 50, totalAmount: 360,
    customerAddress: '1 Main Street, Manila 1000',
    items: [expect.objectContaining({ itemTotal: 310 })]
  })));
});


test('ignores legacy fake guest identities and submits a guest without userId', async () => {
  useAuth().isAuthenticated = false;
  localStorage.setItem('portalUser', JSON.stringify({ id: 123456, name: 'Guest', email: 'guest_123@alimento.local', type: 'guest' }));
  ordersAPI.create.mockResolvedValue({ success: false, message: 'Mock submission only' });
  render(<PortalCheckout />);
  expect(screen.getByLabelText('Full name *')).toHaveValue('');
  expect(screen.getByLabelText(/Email/)).toHaveValue('');
  fireEvent.change(screen.getByLabelText('Full name *'), { target: { value: 'Guest Customer' } });
  fireEvent.change(screen.getByLabelText('Contact number *'), { target: { value: '09171234567' } });
  fireEvent.change(screen.getByLabelText('Complete address *'), { target: { value: '123 Main Street' } });
  fireEvent.click(screen.getByRole('button', { name: /Place order/ }));
  await waitFor(() => expect(ordersAPI.create).toHaveBeenCalled());
  expect(ordersAPI.create.mock.calls[0][0].deliveryType).toBe('guest');
  expect(ordersAPI.create.mock.calls[0][0]).not.toHaveProperty('userId');
});

test('preserves guest details and cart through login while using saved details for blank fields', () => {
  useAuth().isAuthenticated = false;
  const { unmount } = render(<PortalCheckout />);
  fireEvent.change(screen.getByLabelText('Full name *'), { target: { value: 'Delivery Recipient' } });
  fireEvent.change(screen.getByLabelText('Complete address *'), { target: { value: 'Different delivery address' } });
  fireEvent.click(screen.getByRole('button', { name: 'Log in to use saved details' }));
  expect(useNavigate()).toHaveBeenCalledWith('/portal/login', { state: { returnTo: '/portal/checkout' } });
  unmount();
  useAuth().isAuthenticated = true;
  render(<PortalCheckout />);
  expect(screen.getByLabelText('Full name *')).toHaveValue('Delivery Recipient');
  expect(screen.getByLabelText('Complete address *')).toHaveValue('Different delivery address');
  expect(screen.getByLabelText('Contact number *')).toHaveValue('09123456789');
  expect(JSON.parse(localStorage.getItem('portalCart'))).toHaveLength(1);
});
