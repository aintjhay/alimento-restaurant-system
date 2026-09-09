import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PortalConfirmation from './PortalConfirmation';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import realtimeService from '../../services/realtimeService';

jest.mock('react-router-dom', () => { const navigate = jest.fn(); return { useNavigate: () => navigate }; }, { virtual: true });
jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../components/portal/PortalHeader', () => () => null);
jest.mock('../../components/portal/PortalFooter', () => () => null);
jest.mock('../../services/realtimeService', () => ({ startPolling: jest.fn(), stopPolling: jest.fn() }));

const order = { _id: 'order-1', orderNumber: 'ORD-00003', status: 'pending', paymentMethod: 'cash', paymentStatus: 'unpaid', totalAmount: 450, deliveryFee: 50, customerAddress: '1 Main Street', items: [{ name: 'PASTA', quantity: 2, itemTotal: 400 }] };
beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ isAuthenticated: true });
  localStorage.clear();
  localStorage.setItem('portalLastOrder', JSON.stringify(order));
});

test('shows receipt quantities and distinguishes receipt from restaurant confirmation', () => {
  render(<PortalConfirmation />);
  expect(screen.getByRole('heading', { name: 'Order received' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '2 items' })).toBeInTheDocument();
  expect(screen.getByText('Waiting for confirmation')).toBeInTheDocument();
  expect(screen.getByText('Pay on delivery')).toBeInTheDocument();
  expect(screen.getByText(/450.00/)).toBeInTheDocument();
});

test('uses updated status from API envelope and stops polling on unmount', () => {
  const { unmount } = render(<PortalConfirmation />);
  act(() => realtimeService.startPolling.mock.calls[0][1]({ data: { ...order, status: 'cancelled', paymentStatus: 'refunded' } }));
  expect(screen.getByRole('heading', { name: 'Order cancelled' })).toBeInTheDocument();
  expect(screen.getByText('Refunded')).toBeInTheDocument();
  unmount();
  expect(realtimeService.stopPolling).toHaveBeenCalledWith('order-1');
});

test('copies the displayed order number', async () => {
  const writeText = jest.fn().mockResolvedValue();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  render(<PortalConfirmation />);
  fireEvent.click(screen.getByRole('button', { name: 'Copy order number' }));
  expect(await screen.findByText('Order number copied.')).toBeInTheDocument();
  expect(writeText).toHaveBeenCalledWith('ORD-00003');
});


test('guest receipt opens private tracking and registration directly', () => {
  useAuth.mockReturnValue({ isAuthenticated: false });
  localStorage.setItem('portalLastOrder', JSON.stringify({ ...order, trackingToken: 'private-token' }));
  render(<PortalConfirmation />);
  fireEvent.click(screen.getByRole('button', { name: 'View order status' }));
  expect(useNavigate()).toHaveBeenCalledWith('/portal/track/private-token');
  fireEvent.click(screen.getByRole('button', { name: 'Create an account' }));
  expect(useNavigate()).toHaveBeenCalledWith('/portal/login?mode=register');
});
