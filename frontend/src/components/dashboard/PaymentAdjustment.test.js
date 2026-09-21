import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentAdjustment from './PaymentAdjustment';
test('records a cumulative partial payment and reports the saved order', async () => {
  const order = { _id: 'order', paymentMethod: 'cash', paymentStatus: 'unpaid', totalAmount: 100 };
  const onSaved = jest.fn();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ order: { ...order, amountPaid: 30 } }) });
  render(<PaymentAdjustment order={order} onSaved={onSaved} />);
  fireEvent.change(screen.getByLabelText(/Total received/), { target: { value: '30' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save payment record' }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ amountPaid: 30 })));
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ amountPaid: 30 });
});
