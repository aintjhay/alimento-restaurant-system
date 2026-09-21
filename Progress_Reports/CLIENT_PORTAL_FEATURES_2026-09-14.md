# Client portal features

Implemented in the working tree; not deployed.

## Setup

Open **Admin → Portal & promotions** (`/admin/store`).

1. Upload the original store payment QR under **GCash payment QR**, inspect its preview, then save. The chat attachment was not available as a local file, so no QR has been preloaded. Checkout stays unavailable until a QR is configured.
2. Set the portal title, subtitle, cover photo and announcement. Uploads accept PNG, JPEG and WebP up to 3 MB.
3. Confirm store hours. Defaults preserve the existing 11 AM opening and Sunday closure, with the requested new 8 PM closing. Hours use Asia/Manila. Closed days and temporary closure are editable; the server also blocks portal orders while closed.
4. Add **20% website launch promo** or **50% cocktail promo**, or create a custom promotion. Enable and save when ready. Presets start disabled, so deployment alone does not activate a promotion.

Promotions can target a category, a product, or all items; apply to portal, POS, or both; and have optional start/end dates. Date inputs use the administrator's local browser time, labeled in the form, and store UTC timestamps. When multiple promotions match, only the largest percentage applies. The discount covers selected options and add-ons, excluding delivery fees. Original amounts, discount amounts and promotion names are saved on orders. The backend calculates prices from the menu and rejects stale checkout totals.

## Customer and staff flow

- Clicking a menu photo opens a larger image and item details.
- Portal checkout accepts GCash only. Customers can download the original QR, pay the displayed total, then upload a receipt or successful-payment screenshot. Uploading the store QR is not the intended proof.
- Receipt uploads do not mark payments paid. In the dashboard, expand an order to inspect its receipt and choose **Verify payment received** after checking the payment.
- The combined kitchen/bar display shows Received, Preparing and Ready. Once all delivery items are handed over, the order becomes **Out for delivery**. Staff use **Mark delivered** to complete it. Portal tracking and order history display the delivery stage.
- Completed orders show a 1–5 star rating prompt on tracking and order history. Customers choose their rating; five stars are not forced. The backend restricts ratings to completed, unrated orders belonging to the account or matching the private tracking link.
- Postal code is optional, including when saving an address from checkout.
- Menu selling prices are used consistently in POS and portal; the old order-save hook no longer adds another 12% on top of the displayed checkout total.

Email confirmation and domain setup remain deferred as requested. Actual payment settlement is manual; a real GCash transaction and visual check of the uploaded QR are still needed before launch.

## Validation

Backend regression tests cover authoritative discounts, channels/schedules, 8 PM closure, image validation, required receipts, forged payment status, delivery handover and ratings. Frontend checks cover admin presets and upload previews, checkout, menu, tracking, receipts/history, POS, kitchen and dashboard. Production build succeeds with existing lint warnings.
