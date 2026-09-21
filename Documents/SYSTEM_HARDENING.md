# System hardening and operation

## What changed

- Removed HTTP seed, force-reseed, debug, migration and legacy profile-creation access. The old `backend/index.js` now starts the same secured server.
- Required a private JWT secret; removed fake administrator login. Customer profiles, addresses, order history and reviews enforce ownership. Password hashes are excluded. Logout and role changes revoke sessions.
- Added cashier and kitchen roles. Management stays administrator-only. Kitchen receives preparation data and cannot record payments, cancel orders, access reports, or manage products.
- Order retries use an `Idempotency-Key`; the portal and POS preserve it across failed requests. New orders use atomic `ORD-V2-00000001` numbers. Existing numbers remain intact.
- Order creation, stock deduction, batch details and movement records commit together. Status changes follow a shared transition service. Pending cancellation restores original batches once; prepared cancellation records waste without returning food to saleable stock. Bulk stock adjustments also commit together.
- Payments store amounts received/refunded and an actor/timestamp history. The dashboard supports recording cumulative manual amounts. Recording a refund does not transfer funds.
- QR Ph sessions use the final discounted total. A unique checkout attempt prevents repeated creation. Signed webhook processing validates mode, amount and currency and commits payment/order updates together. An uncertain provider response is retained for reconciliation, never blindly retried as a new charge.
- Dashboard polling fetches bounded pages without receipt images. Summaries and trend/top-item aggregation run on the server. Receipt images load only when opened. Order value, collections, refunds and remaining balances have separate labels.
- Forecasting uses completed orders and Manila dates, fills missing observed days with zero, and excludes today's incomplete data. The fallback is a deterministic weekday-average baseline. Forecast requests are cached for 15 minutes with one in-flight generation per process. Archives retain the algorithm; accuracy uses actual database counts and excludes zero denominators from MAPE.
- Fixed order/forecast PDF exports to match the stored schemas. CSV exports escape spreadsheet formulas and use Philippine business dates.
- Added HTTP/database integration tests, backup/restore verification and a GitHub Actions workflow.

## Local setup

Use Node.js 22. Run `npm ci` in both `backend` and `frontend`.

Copy the settings you need from `backend/.env.example` into your private `backend/.env`. Do not overwrite existing credentials. `JWT_SECRET` must be a random secret at least 32 characters long. It can be generated locally with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Persist that value privately; changing it invalidates sessions. Tracking links are independent of the session secret and continue to work.

For a persistent database, use MongoDB Atlas or a replica set. Standalone MongoDB is intentionally rejected at startup because it cannot guarantee atomic orders and payments. The server does not seed or replace production data on startup. Use reviewed maintenance scripts explicitly if initial menu data is needed.

For a disposable local database, set `DEV_ADMIN_EMAIL` and `DEV_ADMIN_PASSWORD` privately, then run:

```powershell
cd backend
npm run dev:memory
```

This starts a local replica set, loads the sample menu, and creates the optional development administrator. It generates a temporary session secret and loses all data on shutdown. The first run downloads MongoDB 7.0.14; cached binaries are ignored by Git. It refuses to run in production mode.

Run `npm start` in `frontend`. Use `npm run dev` in `backend` for a persistent database.

## Roles and sessions

| Role | Allowed work |
| --- | --- |
| customer | Own profile, addresses, delivery orders and verified purchase reviews |
| cashier / staff | POS, operational dashboard, preparation, payment recording and order reports |
| kitchen | Preparation and item handoff only |
| admin | All management and operational functions |

Register an account first. To assign a role through trusted maintenance access, run from `backend`:

```powershell
node scripts/setRole.js person@example.com cashier
```

This updates only the named account and revokes its previous sessions. There is no default production password. Logout revokes sessions for that account; when a device is offline, local logout cannot immediately notify the server, so the token remains subject to its expiry until revocation reaches the server.

Alternatively, configure `ADMIN_EMAIL` and `ADMIN_PASSWORD` privately and run `npm run migrate:admin` from `backend` to create or promote an administrator explicitly. That command changes the configured database; it is never run automatically by the server.

## Payments and cancellation

GCash receipt upload remains a manually verified customer flow. Check the real receiving account before confirming payment. A screenshot alone does not establish settlement.

The POS QR Ph flow requires `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET`, and an HTTPS `FRONTEND_URL` in deployment. Configure `/api/payments/paymongo/webhook` for `checkout_session.payment.paid`. Test and live keys/events must match. The integration follows the [PayMongo checkout resource](https://docs.paymongo.com/reference/checkout-session-resource) and [webhook event structure](https://docs.paymongo.com/docs/developer-tools-webhooks-events).

If a checkout request times out after reaching PayMongo, find the checkout in the provider dashboard by the order reference. Reconcile the existing checkout; do not charge again:

```powershell
node scripts/reconcileCheckout.js ORDER_OBJECT_ID cs_PROVIDER_CHECKOUT_ID
```

The script retrieves the provider record, checks ownership, currency and amount, restores the local link and records a paid result if present. It never creates a new checkout. If the provider has no checkout or the session has expired, an operator must verify the provider state before releasing/replacing the retained attempt; automatic retry is deliberately blocked where settlement is uncertain.

Provider refunds are not initiated by this application. Manual refund recording applies to manually settled payments. Reconcile electronic refunds with the provider before changing financial records; live refund webhook automation is a separate integration step.

Cancellation rules:

- `pending`: return recorded stock to its original batches once.
- `preparing` or `ready`: keep the deduction and log waste.
- `out_for_delivery`, `served`, `completed`: cannot be cancelled through the normal status flow.

Historical orders that deducted stock without saving batch IDs cannot safely restore expiry-specific quantities automatically. Reconcile those records against physical stock before restoring them. Legacy partial payments without recorded amounts must also be verified, not guessed. Existing order numbers and historical records are not rewritten by startup.

## Reporting and forecasts

Order value is different from money collected. Collections/refunds displayed by order period belong to orders placed in that period; they are not a cash movement report by settlement date. Payment timelines retain settlement timestamps for that distinction.

Forecast days without orders are zero observed demand after the first recorded sale. Schedule changes now retain effective-dated history so complete days can be distinguished as open, closed, or unknown. Days before that history, or days with a mid-day schedule change, remain unknown; old closures are not invented. Future scheduled weekly closures have zero demand. The baseline must not be interpreted as a calibrated confidence interval. Review opening schedules and exceptional closures before using predictions operationally.

Prophet is optional. Install `backend/requirements.txt` into a dedicated Python environment and set `PYTHON_EXE` to its executable to use it. If unavailable, the API labels the deterministic baseline. To measure a stored prediction, POST a past `forecastDate` (`YYYY-MM-DD`) to `/api/forecast/accuracy` with an authorized token; actual completed orders are read from the database. No user-supplied actual count is trusted.

## Backup and recovery

Use your database provider's scheduled snapshots for regular production backups. Keep backup copies encrypted and outside the application host. Choose retention and recovery objectives appropriate to the restaurant, and periodically perform a restore drill.

An application-level BSON JSONL backup tool is provided for modest databases. Pause writes first: its cross-collection scan is not a concurrent point-in-time snapshot.

```powershell
cd backend
node scripts/backup.js backup ../backup-artifacts/2026-09-17
```

Use a fresh destination directory each time. A completion manifest records collection counts and indexes. An interrupted backup without a manifest is incomplete.

To restore, set `RESTORE_MONGODB_URI` privately to a separate, **empty** recovery database. Then run:

```powershell
node scripts/backup.js restore ../backup-artifacts/2026-09-17
```

The script refuses a nonempty target and preserves BSON values and indexes. An interrupted restore should be abandoned in favor of a new empty target. Verify collection counts, sample orders, batch balances, user login and payment references before switching the application to the restored database. The test suite exercises backup and restore against disposable databases; the production restore process has not been executed.

## Verification and deployment

```powershell
# Repository root
npm test
npm run build
```

Backend integration tests start their own replica set and never use `MONGODB_URI` for business data. GitHub Actions installs dependencies and runs backend tests, frontend tests and the production build.

Before rollout, configure the persistent replica-set connection and secret, set the exact frontend origins and trusted proxy hop count, take a recoverable database backup, and test GCash verification plus PayMongo test-mode checkout/webhooks on staging. `/health` returns HTTP 503 if MongoDB is disconnected. Only move to live payment credentials after settlement/retry behavior is verified with the provider.

The changes are local code changes. No live deployment, real payment, production migration or production backup/restore has been performed. Caches/rate-limit counters are per process; a multi-instance rollout should use shared coordination and scheduled forecast generation.
