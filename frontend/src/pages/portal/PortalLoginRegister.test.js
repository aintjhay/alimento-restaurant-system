import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PortalLoginRegister from './PortalLoginRegister';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

jest.mock('react-router-dom', () => ({ useNavigate: jest.fn(), useLocation: jest.fn() }), { virtual: true });
jest.mock('../../components/portal/PortalHeader', () => () => null);
jest.mock('../../components/portal/PortalFooter', () => () => null);
jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));

const register = jest.fn();
beforeEach(() => {
  localStorage.clear();
  useNavigate.mockReturnValue(jest.fn());
  useLocation.mockReturnValue({ search: '' });
  register.mockReset().mockResolvedValue({ success: false, message: 'Test response' });
  useAuth.mockReturnValue({ register, login: jest.fn() });
});

function fillAccount() {
  render(<PortalLoginRegister />);
  fireEvent.click(screen.getAllByRole('button', { name: 'Create account' }).slice(-1)[0]);
  for (const [label, value] of [['Phone Number *', '09171234567'], ['First Name', 'Test'], ['Last Name', 'Customer'], ['Email Address', 'test@example.com'], ['Password', 'secret123'], ['Confirm Password', 'secret123']]) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
}

test('registration remains available without an address', async () => {
  fillAccount();
  expect(screen.queryByLabelText('Address *')).not.toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button', { name: 'Create account' }).slice(-1)[0]);
  await waitFor(() => expect(register).toHaveBeenCalledWith('Test', 'Customer', 'test@example.com', 'secret123', undefined, '09171234567'));
});

test('blocks an incomplete phone number before registration', () => {
  fillAccount();
  expect(screen.queryByText('11 digits required.')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Phone Number *'), { target: { value: '0917' } });
  fireEvent.click(screen.getAllByRole('button', { name: 'Create account' }).slice(-1)[0]);
  expect(register).not.toHaveBeenCalled();
  expect(screen.getByText('11 digits required.')).toBeInTheDocument();
  expect(screen.getByLabelText('Phone Number *')).toHaveAttribute('aria-invalid', 'true');
  fireEvent.change(screen.getByLabelText('Phone Number *'), { target: { value: '09171234567' } });
  expect(screen.getByLabelText('Phone Number *')).toHaveAttribute('aria-invalid', 'false');
  expect(screen.queryByText('11 digits required.')).not.toBeInTheDocument();
});

test('opens account creation from the header registration URL', () => {
  useLocation.mockReturnValue({ search: '?mode=register' });
  render(<PortalLoginRegister />);
  expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
  expect(screen.getByLabelText('First Name')).toBeInTheDocument();
});


test('guest continuation removes legacy identity and returns to checkout', () => {
  useLocation.mockReturnValue({ search: '', state: { returnTo: '/portal/checkout' } });
  localStorage.setItem('portalUser', JSON.stringify({ type: 'guest', id: 123 }));
  render(<PortalLoginRegister />);
  fireEvent.click(screen.getByRole('button', { name: 'Continue as guest' }));
  expect(localStorage.getItem('portalUser')).toBeNull();
  expect(localStorage.getItem('portalCheckoutType')).toBe('guest');
  expect(useNavigate()).toHaveBeenCalledWith('/portal/checkout');
});

test('successful login returns to checkout', async () => {
  useLocation.mockReturnValue({ search: '', state: { returnTo: '/portal/checkout' } });
  useAuth.mockReturnValue({ register, login: jest.fn().mockResolvedValue({ success: true }) });
  render(<PortalLoginRegister />);
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } });
  fireEvent.click(screen.getAllByRole('button', { name: 'Log in' }).slice(-1)[0]);
  await waitFor(() => expect(useNavigate()).toHaveBeenCalledWith('/portal/checkout'), { timeout: 2000 });
});
