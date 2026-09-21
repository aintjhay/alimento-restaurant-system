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
  const auth = { isAuthenticated: true, token: 'test-token', fetchCurrentUser: jest.fn(), user: {
    id: 'customer-1', firstName: 'Test', lastName: 'Customer', phone: '09123456789',
    email: 'test@example.com', addresses: [{ _id: 'address-1', label: 'Home', street: '1 Main Street', city: 'Manila', postal: '1000', isDefault: true }]
  } };
  return { useAuth: () => auth };
});
jest.mock('../../services/storeService', () => ({
  getStore: async () => ({ isOpen: true, gcashQr: 'data:image/png;base64,test', openingTime: '10:00', closingTime: '20:00' }),
  quoteOrder: async items => { const subtotal = items.reduce((sum, item) => sum + item.itemPrice * item.quantity, 0); return { subtotal, discount: 0, deliveryFee: 50, totalAmount: subtotal + 50 }; },
  readImage: async () => 'data:image/png;base64,receipt'
}));
const continueToPayment = async () => {
  const button = screen.getByRole('button', { name: /Continue to payment/ });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  await screen.findByRole('heading', { name: 'Payment' });
};
const uploadReceipt = async () => {
  if (screen.queryByRole('button', { name: /Continue to payment/ })) await continueToPayment();
  fireEvent.change(screen.getByLabelText('Payment receipt *'), { target: { files: [new File(['receipt'], 'receipt.png', { type: 'image/png' })] } });
  await screen.findByAltText('Your payment receipt');
  await waitFor(() => expect(screen.getByRole('button', { name: /Place order/ })).toBeEnabled());
};
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
  global.fetch = jest.fn();
});

test('includes customization prices when quantities change', () => {
  render(<PortalCheckout />);
  expect(screen.getByText('\u20b1360.00')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Increase CHICKEN WINGS quantity' }));
  expect(screen.getByText('\u20b1670.00')).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('portalCart'))[0].quantity).toBe(2);
});

test('GCash replaces cash and QR Ph and receipt is required', async () => {
  render(<PortalCheckout />);
  await continueToPayment();
  expect(await screen.findByRole('link', { name: 'Download QR' })).toHaveAttribute('download');
  expect(screen.queryByRole('img', { name: 'Store GCash payment QR' })).not.toBeInTheDocument();
  const qrToggle = screen.getByRole('button', { name: 'Show QR code' });
  expect(qrToggle).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(qrToggle);
  expect(screen.getByRole('img', { name: 'Store GCash payment QR' })).toBeVisible();
  expect(qrToggle).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Hide QR code' }));
  expect(screen.queryByRole('img', { name: 'Store GCash payment QR' })).not.toBeInTheDocument();
  expect(ordersAPI.create).not.toHaveBeenCalled();
  expect(screen.queryByText('Cash on delivery')).not.toBeInTheDocument();
  expect(screen.queryByText('QR Ph')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Payment receipt *')).toBeRequired();
  await waitFor(() => expect(screen.getByRole('button', { name: /Place order/ })).toBeEnabled());
  fireEvent.submit(screen.getByRole('button', { name: /Place order/ }).form);
  expect(await screen.findByRole('alert')).toHaveTextContent('Upload your payment receipt');
  expect(ordersAPI.create).not.toHaveBeenCalled();
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
  const button = screen.getByRole('button', { name: 'Continue to payment' });
  expect(button.form.id).toBe('checkout-details');
  await uploadReceipt();
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
  expect(screen.queryByLabelText('Use this as default address')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Full name *')).toHaveValue('');
  expect(screen.getByLabelText(/Email/)).toHaveValue('');
  fireEvent.change(screen.getByLabelText('Full name *'), { target: { value: 'Guest Customer' } });
  fireEvent.change(screen.getByLabelText('Contact number *'), { target: { value: '09171234567' } });
  fireEvent.change(screen.getByLabelText('Complete address *'), { target: { value: '123 Main Street' } });
  await uploadReceipt();
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

test('saves a new default address to the account before placing an order', async () => {
  const address = { _id: 'new-address', label: 'Home', street: '22 New Street', city: 'Pasig', isDefault: true };
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, addresses: [address] }) });
  ordersAPI.create.mockResolvedValue({ success: true, order: { _id: 'order-1' } });
  render(<PortalCheckout />);
  fireEvent.change(screen.getByLabelText('Saved address'), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText('Complete address *'), { target: { value: '22 New Street' } });
  fireEvent.click(screen.getByLabelText('Use this as default address'));
  fireEvent.change(screen.getByLabelText('City *'), { target: { value: 'Pasig' } });
  expect(screen.queryByLabelText(/Postal code/)).not.toBeInTheDocument();
  await uploadReceipt();
  fireEvent.click(screen.getByRole('button', { name: /Place order/ }));
  await waitFor(() => expect(ordersAPI.create).toHaveBeenCalled());
  expect(global.fetch).toHaveBeenCalledWith('/api/users/customer-1/addresses', expect.objectContaining({
    method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer test-token' })
  }));
  expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual(expect.objectContaining({
    street: '22 New Street', city: 'Pasig', phone: '09123456789', isDefault: true
  }));
  expect(JSON.parse(localStorage.getItem('portalUser')).addresses).toEqual([address]);
  expect(useAuth().fetchCurrentUser).toHaveBeenCalled();
});

test('updates a selected saved address and stops checkout if saving fails', async () => {
  global.fetch.mockResolvedValue({ ok: false, json: async () => ({ success: false, message: 'Unable to save address' }) });
  render(<PortalCheckout />);
  fireEvent.click(screen.getByLabelText('Use this as default address'));
  expect(screen.queryByLabelText('City *')).not.toBeInTheDocument();
  await uploadReceipt();
  fireEvent.click(screen.getByRole('button', { name: /Place order/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to save address');
  expect(global.fetch).toHaveBeenCalledWith('/api/users/customer-1/addresses/address-1', expect.objectContaining({ method: 'PUT' }));
  expect(ordersAPI.create).not.toHaveBeenCalled();
  expect(JSON.parse(localStorage.getItem('portalCart'))).toHaveLength(1);
});

 test('payment is a separate step and back preserves delivery details', async () => {
  render(<PortalCheckout />);
  expect(screen.queryByRole('button', { name: 'Show QR code' })).not.toBeInTheDocument();
  await continueToPayment();
  expect(ordersAPI.create).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Increase CHICKEN WINGS quantity' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Back to details' }));
  expect(screen.getByLabelText('Full name *')).toHaveValue('Test Customer');
  expect(screen.getByRole('button', { name: /Continue to payment/ })).toBeVisible();
});
