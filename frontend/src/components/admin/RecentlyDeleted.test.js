import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RecentlyDeleted from './RecentlyDeleted';

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = jest.fn();
  HTMLDialogElement.prototype.close = jest.fn();
  localStorage.setItem('adminToken', 'test-token');
});
afterEach(() => { jest.restoreAllMocks(); localStorage.clear(); });

test.each([['products', 'data'], ['inventory', 'items']])('loads and restores deleted %s', async (resource, key) => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, [key]: [{ _id: '1', name: 'Coffee' }] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
  const onRestore = jest.fn();
  render(<RecentlyDeleted resource={resource} onRestore={onRestore} />);
  fireEvent.click(screen.getByRole('button', { name: 'Recently Deleted' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Restore Coffee', hidden: true }));
  await waitFor(() => expect(onRestore).toHaveBeenCalledTimes(1));
  expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining(`/admin/${resource}/1/restore`), {
    method: 'PATCH', headers: { Authorization: 'Bearer test-token' }
  });
  expect(screen.queryByRole('button', { name: 'Restore Coffee', hidden: true })).toBeNull();
});

test('keeps an item available to retry when restoration fails', async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, items: [{ _id: '1', name: 'Coffee' }] }) })
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Restore failed' }) });
  const onRestore = jest.fn();
  render(<RecentlyDeleted resource="inventory" onRestore={onRestore} />);
  fireEvent.click(screen.getByRole('button', { name: 'Recently Deleted' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Restore Coffee', hidden: true }));
  await screen.findByText('Restore failed');
  expect(screen.getByRole('button', { name: 'Restore Coffee', hidden: true }).disabled).toBe(false);
  expect(onRestore).not.toHaveBeenCalled();
});
