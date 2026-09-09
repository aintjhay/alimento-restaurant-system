import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from './AuthContext';

const user = { id: 'user-1', firstName: 'Test' };
function Session() {
  const auth = useAuth();
  return <><span>{auth.loading ? 'Loading' : auth.isAuthenticated ? 'Signed in' : 'Signed out'}</span><button onClick={auth.fetchCurrentUser}>Refresh</button><button onClick={auth.logout}>Logout</button><button onClick={() => auth.adminLogin("admin@example.com", "password")}>Admin login</button></>;
}
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('portalToken', 'saved-token');
  localStorage.setItem('portalUser', JSON.stringify(user));
  global.fetch = jest.fn();
});
test.each([429, 500])('retains a cached session after HTTP %s', async status => {
  fetch.mockResolvedValue({ ok: false, status });
  render(<AuthProvider><Session /></AuthProvider>);
  expect(await screen.findByText('Signed in')).toBeInTheDocument();
  expect(localStorage.getItem('portalToken')).toBe('saved-token');
});
test('clears credentials only when the server rejects authentication', async () => {
  fetch.mockResolvedValue({ ok: false, status: 401 });
  render(<AuthProvider><Session /></AuthProvider>);
  expect(await screen.findByText('Signed out')).toBeInTheDocument();
  expect(localStorage.getItem('portalToken')).toBeNull();
});
test('profile refresh network failure preserves the session', async () => {
  fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ user }) }).mockRejectedValueOnce(new Error('Offline'));
  render(<AuthProvider><Session /></AuthProvider>);
  await screen.findByText('Signed in');
  fireEvent.click(screen.getByText('Refresh'));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  expect(localStorage.getItem('portalToken')).toBe('saved-token');
});

const admin = { id: 'admin-1', role: 'admin', firstName: 'Administrator' };

test('moves an old administrator session out of the portal', async () => {
  localStorage.setItem('portalUser', JSON.stringify(admin));
  render(<AuthProvider><Session /></AuthProvider>);
  expect(await screen.findByText('Signed out')).toBeInTheDocument();
  expect(localStorage.getItem('portalToken')).toBeNull();
  expect(localStorage.getItem('portalUser')).toBeNull();
  expect(localStorage.getItem('adminToken')).toBe('saved-token');
  expect(fetch).not.toHaveBeenCalled();
});

test('moves legacy local administrator access out of the portal', async () => {
  localStorage.setItem('portalToken', 'local-admin-access');
  localStorage.removeItem('portalUser');
  render(<AuthProvider><Session /></AuthProvider>);
  expect(await screen.findByText('Signed out')).toBeInTheDocument();
  expect(localStorage.getItem('adminToken')).toBe('local-admin-access');
  expect(localStorage.getItem('portalToken')).toBeNull();
});

test('administrator login and logout leave the customer session intact', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ token: 'admin-token', user: admin }) });
  render(<AuthProvider scope="admin"><Session /></AuthProvider>);
  expect(await screen.findByText('Signed out')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Admin login'));
  await screen.findByText('Signed in');
  expect(localStorage.getItem('adminToken')).toBe('admin-token');
  expect(localStorage.getItem('portalToken')).toBe('saved-token');
  expect(JSON.parse(localStorage.getItem('portalUser'))).toEqual(user);
  fireEvent.click(screen.getByText('Logout'));
  expect(localStorage.getItem('adminToken')).toBeNull();
  expect(localStorage.getItem('portalToken')).toBe('saved-token');
});

test('switching from POS to portal restores the separate customer session', async () => {
  localStorage.setItem('adminToken', 'admin-token');
  localStorage.setItem('adminUser', JSON.stringify(admin));
  fetch.mockImplementation((url, options) => Promise.resolve({ ok: true, json: async () => ({
    user: options.headers.Authorization === 'Bearer admin-token' ? admin : user
  }) }));
  const { rerender } = render(<AuthProvider key="admin" scope="admin"><Session /></AuthProvider>);
  await screen.findByText('Signed in');
  expect(fetch).toHaveBeenLastCalledWith(expect.any(String), { headers: { Authorization: 'Bearer admin-token' } });
  rerender(<AuthProvider key="portal"><Session /></AuthProvider>);
  await screen.findByText('Signed in');
  expect(fetch).toHaveBeenLastCalledWith(expect.any(String), { headers: { Authorization: 'Bearer saved-token' } });
  fireEvent.click(screen.getByText('Logout'));
  expect(localStorage.getItem('portalToken')).toBeNull();
  expect(localStorage.getItem('adminToken')).toBe('admin-token');
});
