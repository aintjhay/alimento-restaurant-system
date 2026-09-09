import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProductManagement from './ProductManagement';
import { prepareMenuImage } from '../../utils/menuImage';

jest.mock('../../utils/menuImage', () => ({ prepareMenuImage: jest.fn() }));
jest.mock('../../components/admin/AdminNav', () => ({ children }) => <div>{children}</div>);
jest.mock('react-router-dom', () => ({ Link: ({ children }) => <span>{children}</span> }), { virtual: true });
jest.mock('../../services/api', () => ({ API_URL: '/api', authHeaders: () => ({}) }));

const photo = 'data:image/jpeg;base64,YWJj';
beforeEach(() => {
  global.fetch = jest.fn(async (url, options) => ({ ok: true, json: async () => {
    if (options?.method) return { success: true };
    if (url.includes('categories')) return { data: [{ _id: 'cat', name: 'Coffee' }] };
    return { data: [{ _id: '1', name: 'Latte', price: 100, category: 'Coffee', image: photo, isAvailable: true }],
      pagination: { page: 1, totalPages: 1, totalItems: 1 } };
  } }));
});
afterEach(() => jest.clearAllMocks());

test('existing photo is editable and removal is persisted', async () => {
  render(<ProductManagement />);
  fireEvent.click(await screen.findByRole('button', { name: 'Edit Latte' }));
  expect(screen.getByAltText('Menu item preview').getAttribute('src')).toBe(photo);
  fireEvent.click(screen.getByRole('button', { name: 'Remove photo' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(fetch.mock.calls.some(([, options]) => options.method === 'PUT' && JSON.parse(options.body).image === '')).toBe(true));
});

test('selected photo is previewed and included when saving', async () => {
  prepareMenuImage.mockResolvedValue(photo);
  render(<ProductManagement />);
  fireEvent.click(await screen.findByRole('button', { name: 'Edit Latte' }));
  await act(async () => {
    fireEvent.change(screen.getByLabelText(/Item photo/), { target: { files: [new File(['photo'], 'latte.jpg', { type: 'image/jpeg' })] } });
  });
  await waitFor(() => expect(screen.queryByText('Preparing photo…')).toBeNull());
  fireEvent.submit(screen.getByRole('button', { name: 'Save changes' }).closest('form'));
  await waitFor(() => expect(fetch.mock.calls.some(([, options]) => options.method === 'PUT' && JSON.parse(options.body).image === photo)).toBe(true));
});
