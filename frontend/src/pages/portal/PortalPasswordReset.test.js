import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PortalPasswordReset from './PortalPasswordReset';
jest.mock('react-router-dom', () => ({ Link: ({ to, children }) => <a href={to}>{children}</a> }));
jest.mock('../../components/portal/PortalHeader', () => () => null);
jest.mock('../../components/portal/PortalFooter', () => () => null);
beforeEach(() => { window.history.replaceState({}, '', '/'); global.fetch = jest.fn(); });
afterEach(() => { jest.restoreAllMocks(); });
test('requests a link and shows the generic confirmation', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ message: 'If an account exists, we have sent a link.' }) });
  render(<PortalPasswordReset />);
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'customer@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
  expect(await screen.findByRole('status')).toHaveTextContent('If an account exists');
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ email: 'customer@example.com' });
});
test('rejects mismatched passwords, then submits the token and reports success', async () => {
  const token = 'a'.repeat(64);
  window.history.replaceState({}, '', `/portal/reset-password#token=${token}`);
  fetch.mockResolvedValue({ ok: true, json: async () => ({ message: 'Your password has been reset.' }) });
  render(<PortalPasswordReset reset />);
  expect(window.location.hash).toBe('');
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-password' } });
  fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'different-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match'); expect(fetch).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'new-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('has been reset'));
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ token, password: 'new-password' });
});
test('missing tokens cannot be submitted', () => {
  render(<PortalPasswordReset reset />);
  expect(screen.getByRole('alert')).toHaveTextContent('missing or invalid');
  expect(screen.queryByRole('button', { name: 'Reset password' })).not.toBeInTheDocument();
});
