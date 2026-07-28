# Legacy Order History Import Plan

## Scope

Import legacy OpenCart order history into the current `commerce.orders` and `commerce.order_items` tables.

Expected source tables:

- `order`
- `order_product`
- `order_total`
- `order_history`

Optional source table if present:

- `order_status`

## Safety Rules

- Run customer import first so `users.legacy_id` and normalized email matching can link orders to migrated users.
- Use `backend/scripts/import-orders.js --dry-run` before the real import.
- Import is idempotent by `orders.legacy_id` and `order_items.legacy_id`.
- Existing app orders are not overwritten unless they already have the same `legacy_id`.
- Guest orders keep `user_id = NULL` and preserve the legacy customer name/email/phone snapshot on the order. The migration explicitly drops the original `orders.user_id` NOT NULL constraint.
- Customer orders are linked by `users.legacy_id` first, then normalized email.
- Payment and shipping method names are preserved verbatim in `legacy_payment_method` and `legacy_shipping_method`.
- Raw order totals and status history are stored as JSONB for auditability.
- Logs must contain only counts and validation summaries. No customer emails, names, phones, addresses, comments, or payment data.

## Total Validation

- `orders.total` is copied from the legacy `order.total`.
- `orders.subtotal` is taken from `order_total.code = 'sub_total'`; if missing, it falls back to the sum of product line totals.
- `orders.delivery_total` is taken from `order_total.code = 'shipping'`; if missing, it falls back to `0`.
- Each `order_items.line_total` is copied from `order_product.total`.
- The importer reports aggregate mismatches where the `order_total.code = 'total'` value differs from the legacy `order.total`. It does not block import unless `--strict-totals` is passed.

## Status Mapping

The importer maps known OpenCart status names/IDs to the current status model:

- pending/processing/processed -> `In procesare`
- complete/shipped -> `Livrata` or `Expediata`
- canceled/denied/expired/voided/failed -> `Anulata`
- refunded/reversed/returned -> `Returnata`
- missing/unknown -> `Plasata`

Payment status is inferred from the mapped order status:

- completed/paid-like statuses -> `paid`
- failed/cancelled-like statuses -> `failed`
- refunded/returned-like statuses -> `refunded`
- otherwise -> `pending`

## Runbook

1. Apply migrations:
   `npm run db:migrate`
2. Ensure customers have been imported:
   `npm run import:customers -- ../../margele_oc.mysql.sql --dry-run`
3. Dry-run order import:
   `npm run import:orders -- ../../margele_oc.mysql.sql --dry-run`
4. Review summary counts, guest order count, linked order count, and total mismatch counts.
5. Run the import:
   `npm run import:orders -- ../../margele_oc.mysql.sql`
6. Spot-check without exposing PII:
   order counts with `legacy_id`, guest order count, linked user count, and aggregate totals.
