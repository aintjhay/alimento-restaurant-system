import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InventoryManagement from './InventoryManagement';

jest.mock('../../components/admin/AdminNav', () => ({ children }) => <div>{children}</div>);
jest.mock('../../services/api', () => ({ authHeaders: () => ({}) }));

afterEach(() => jest.restoreAllMocks());

function mockInventory(items) {
  jest.spyOn(global, 'fetch').mockImplementation(async url => ({
    ok: true,
    json: async () => url.includes('product-options') ? { data: [] } : { success: true, items }
  }));
}

test('empty inventory spans every table column without shared empty-state styles', async () => {
  mockInventory([]);
  render(<InventoryManagement />);
  const heading = await screen.findByText('Add your first ingredient');
  expect(heading.closest('td').colSpan).toBe(screen.getAllByRole('columnheader').length);
  expect(heading.closest('td').className).toBe('inventory-empty-cell');
});

test('expiration dates are visible and expired filter selects affected stock', async () => {
  mockInventory([
    { _id: '1', name: 'Milk', category: 'Fresh', currentStock: 2, minimumThreshold: 1, unit: 'L', batches: [{ _id: 'b1', quantity: 2, expiryDate: '2026-09-01T00:00:00.000Z' }], expirationAlerts: [{ batchId: 'b1', quantity: 2, expiryDate: '2026-09-01', status: 'expired' }] },
    { _id: '2', name: 'Rice', category: 'Carbs', currentStock: 5, minimumThreshold: 1, unit: 'KG', expirationAlerts: [] }
  ]);
  render(<InventoryManagement />);
  await screen.findByText('Milk');
  expect(screen.getByRole('columnheader', { name: 'Expiration' })).toBeTruthy();
  expect(screen.getByText(/Expired: Batch/).textContent).toContain('2026-09-01');
  fireEvent.change(screen.getByLabelText('Expiration'), { target: { value: 'expired' } });
  expect(screen.queryByText('Rice')).toBeNull();
  expect(screen.getByText('Milk')).toBeTruthy();
});
