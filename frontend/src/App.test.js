import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedAdminRoute } from './App';
import { useAuth } from './context/AuthContext';
jest.mock('./context/AuthContext', () => ({ useAuth: jest.fn(), AuthProvider: ({ children }) => children }));

test.each([null, { role: 'customer' }, { role: 'kitchen' }])('management route rejects %j', user => {
  useAuth.mockReturnValue({ user, loading: false, isAuthenticated: Boolean(user) });
  render(<MemoryRouter initialEntries={['/management']}><Routes><Route path="/management" element={<ProtectedAdminRoute>Management</ProtectedAdminRoute>} /><Route path="/admin/login" element={<div>Sign in required</div>} /></Routes></MemoryRouter>);
  expect(screen.getByText('Sign in required')).toBeInTheDocument();
});
test('kitchen role can access preparation route', () => {
  useAuth.mockReturnValue({ user: { role: 'kitchen' }, loading: false, isAuthenticated: true });
  render(<MemoryRouter><ProtectedAdminRoute roles={['admin', 'kitchen']}>Preparation</ProtectedAdminRoute></MemoryRouter>);
  expect(screen.getByText('Preparation')).toBeInTheDocument();
});
