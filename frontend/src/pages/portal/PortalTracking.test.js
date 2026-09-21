import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useParams } from 'react-router-dom';
import PortalTracking from './PortalTracking';

jest.mock('react-router-dom', () => { const navigate = jest.fn(); return { useNavigate: () => navigate, useParams: jest.fn() }; }, { virtual: true });
jest.mock('../../components/portal/PortalHeader', () => () => null);
jest.mock('../../components/portal/PortalFooter', () => () => null);
jest.mock('../../services/api', () => ({ API_URL: '/api' }));

beforeEach(() => {
  localStorage.clear();
  useParams.mockReturnValue({ token: 'private-token' });
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ order: { orderNumber: 'ORD-42', status: 'preparing', paymentStatus: 'unpaid', paymentMethod: 'cash' } }) });
});

test('opens a private link without an account or local receipt and allows copying it', async () => {
  const writeText = jest.fn().mockResolvedValue();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  render(<PortalTracking />);
  expect(await screen.findByText('Preparing your order')).toBeInTheDocument();
  expect(screen.getByText('Pay on delivery')).toBeInTheDocument();
  expect(screen.getByText('Preparing').closest('li')).toHaveAttribute('aria-current', 'step');
  expect(fetch).toHaveBeenCalledWith('/api/orders/track/private-token', expect.any(Object));
  fireEvent.click(screen.getByRole('button', { name: 'Copy tracking link' }));
  expect(await screen.findByText('Tracking link copied.')).toBeInTheDocument();
});

test('explains an invalid link without sending the guest to login', async () => {
  fetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
  render(<PortalTracking />);
  expect(await screen.findByRole('alert')).toHaveTextContent('This tracking link is invalid');
});

test('completed orders show a finished timeline', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ order: { orderNumber: 'ORD-42', status: 'completed', paymentStatus: 'paid' } }) });
  render(<PortalTracking />);
  expect(await screen.findByText('Order completed')).toBeInTheDocument();
  expect(screen.getAllByText('Done')).toHaveLength(5);
  expect(screen.queryByText('In progress')).not.toBeInTheDocument();
});

test('delivery remains in progress until delivered', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ order: { status: 'out_for_delivery', paymentMethod: 'gcash', paymentStatus: 'payment_verified' } }) });
  render(<PortalTracking />);
  expect(await screen.findByText('Your rider is on the way with your order.')).toBeInTheDocument();
  expect(screen.getByText('In progress')).toBeInTheDocument();
  expect(screen.queryByText('How was your order?')).not.toBeInTheDocument();
});

test('completed customer can choose one star and submit it', async () => {
  fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ order: { status: 'completed' } }) }).mockResolvedValueOnce({ ok: true, json: async () => ({ rating: 1 }) });
  render(<PortalTracking />);
  await screen.findByText('How was your order?');
  expect(screen.getByRole('button', { name: 'Submit rating' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: '1 star', exact: true }));
  expect(screen.getByRole('button', { name: '1 star', exact: true })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Submit rating' }));
  expect(await screen.findByText('Thank you for your rating!')).toBeInTheDocument();
  expect(fetch).toHaveBeenLastCalledWith('/api/orders/track/private-token/rating', expect.objectContaining({ body: JSON.stringify({ rating: 1 }) }));
  expect(fetch.mock.calls.at(-1)[1].headers).toEqual({ 'Content-Type': 'application/json' });
});

test('rating errors stay inside the rating card and preserve selection for retry', async () => {
  fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ order: { status: 'completed' } }) })
    .mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Unable to save rating. Please retry.' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ rating: 4 }) });
  render(<PortalTracking />);
  const card = await screen.findByRole('region', { name: 'Rate your order' });
  fireEvent.click(within(card).getByRole('button', { name: '4 stars' }));
  fireEvent.click(within(card).getByRole('button', { name: 'Submit rating' }));
  expect(await within(card).findByRole('alert')).toHaveTextContent('Unable to save rating');
  expect(screen.getByText('Automatic updates')).toBeInTheDocument();
  expect(within(card).getByRole('button', { name: '4 stars' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(within(card).getByRole('button', { name: 'Submit rating' }));
  expect(await within(card).findByRole('status', { name: '4 out of 5 stars' })).toBeInTheDocument();
  expect(within(card).queryByRole('button', { name: 'Submit rating' })).not.toBeInTheDocument();
});

test('previously rated orders show saved feedback instead of another form', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ order: { status: 'completed', rating: 5 } }) });
  render(<PortalTracking />);
  expect(await screen.findByRole('status', { name: '5 out of 5 stars' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Submit rating' })).not.toBeInTheDocument();
});

test('cancelled orders do not show an active fulfillment timeline', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ order: { orderNumber: 'ORD-42', status: 'cancelled', paymentStatus: 'refunded' } }) });
  render(<PortalTracking />);
  expect(await screen.findByText('Order cancelled')).toBeInTheDocument();
  expect(screen.queryByRole('list', { name: 'Order progress' })).not.toBeInTheDocument();
  expect(screen.getByText('Refunded')).toBeInTheDocument();
});
