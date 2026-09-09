# PayMongo QR Ph setup

1. Copy `.env.example` values into the backend `.env` and provide the PayMongo secret and webhook signing secret.
2. Register one PayMongo webhook pointing to `https://YOUR_BACKEND/api/payments/paymongo/webhook`.
3. Enable the checkout payment event in PayMongo and make sure QR Ph is activated for the account.
4. Use test keys first. Never place a secret key in the React environment or repository.

The customer checkout creates a PayMongo Checkout Session. Only the signed webhook marks an order as paid; returning to the success URL alone does not confirm payment.
