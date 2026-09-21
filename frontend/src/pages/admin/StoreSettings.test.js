import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StoreSettings from './StoreSettings';
import PromotionManagement from './PromotionManagement';
import { saveStore } from '../../services/storeService';
jest.mock('../../components/admin/AdminNav', () => ({ children }) => <main>{children}</main>);
jest.mock('../../services/api', () => ({ API_URL: '/api', authHeaders: () => ({}), parseResponse: async response => response.json() }));
jest.mock('../../services/storeService', () => ({
  getStore: async () => ({ title: 'Alimento', subtitle: '', announcement: '', openingTime: '11:00', closingTime: '20:00', closedDays: [0], closed: false, promotions: [], coverImage: '', gcashQr: '' }),
  saveStore: jest.fn(), readImage: async () => 'data:image/png;base64,test'
}));
beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ data: [{ _id: 'cocktail', name: 'Mojito', category: 'Cocktails' }] }) });
  saveStore.mockImplementation(async data => data);
});

test('Sunday hours can be saved from portal settings without promotion controls', async () => {
  render(<StoreSettings />);
  await screen.findByLabelText('Sunday');
  expect(screen.queryByRole('button', { name: 'Add promotion' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Sunday'));
  expect(screen.getByLabelText('Sunday')).not.toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Save store hours' }));
  await waitFor(() => expect(saveStore).toHaveBeenCalledWith({ openingTime: '11:00', closingTime: '20:00', closedDays: [], closed: false }));

  expect(await screen.findByText('Store hours saved. The portal will use this schedule.')).toBeInTheDocument();
});
test('launch promotion remains disabled until enabled, and saves portal-only 20 percent', async () => {
  render(<PromotionManagement />);
  fireEvent.click(await screen.findByRole('button', { name: 'Add 20% website launch promo' }));
  expect(screen.getByLabelText('Enabled')).not.toBeChecked();
  fireEvent.click(screen.getByLabelText('Enabled'));
  fireEvent.click(screen.getByRole('button', { name: 'Apply changes' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(saveStore).toHaveBeenCalledWith({ promotions: [expect.objectContaining({ name: 'Website launch', percent: 20, channel: 'portal', enabled: true })] }));
});
test('cocktail preset targets both channels', async () => {
  render(<PromotionManagement />);
  fireEvent.click(await screen.findByRole('button', { name: 'Add 50% cocktail promo' }));
  expect(screen.getByLabelText('Where')).toHaveValue('both');
  expect(screen.getByLabelText('Category')).toHaveValue('Cocktails');
});
test('photos remain reviewable before saving', async () => {
  render(<StoreSettings />);
  await screen.findByLabelText('Payment QR image');
  fireEvent.change(screen.getByLabelText('Payment QR image'), { target: { files: [new File(['qr'], 'qr.png', { type: 'image/png' })] } });
  expect(await screen.findByAltText('GCash payment QR preview')).toHaveAttribute('src', 'data:image/png;base64,test');
  expect(saveStore).not.toHaveBeenCalled();
});

test('saving portal settings does not write promotions', async () => {
  render(<StoreSettings />);
  fireEvent.click(await screen.findByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(saveStore).toHaveBeenCalled());
  expect(saveStore.mock.calls[0][0]).not.toHaveProperty('promotions');
  expect(saveStore.mock.calls[0][0]).toHaveProperty('title', 'Alimento');
});


test('promotion drawer cancels drafts and restores focus', async () => {
  render(<PromotionManagement />);
  const template = await screen.findByRole('button', { name: 'Add 20% website launch promo' });
  template.focus();
  fireEvent.click(template);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Draft only' } });
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.queryByText('Draft only')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  expect(template).toHaveFocus();
});

test('applied promotions can be filtered, edited, discarded, and retried after save failure', async () => {
  render(<PromotionManagement />);
  fireEvent.click(await screen.findByRole('button', { name: 'Add 20% website launch promo' }));
  fireEvent.click(screen.getByRole('button', { name: 'Apply changes' }));
  fireEvent.click(screen.getByRole('button', { name: 'Enabled 0' }));
  expect(screen.getByText('No enabled promotions.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'All 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit Website launch' }));
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Weekend special' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply changes' }));
  saveStore.mockRejectedValueOnce(new Error('Unable to save'));
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Unable to save');
  expect(screen.getByRole('button', { name: 'Edit Weekend special' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
  expect(screen.queryByRole('button', { name: 'Edit Weekend special' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
});
