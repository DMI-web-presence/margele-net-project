# Legacy Customer Import Plan

## Scope

Import legacy OpenCart customers and addresses into the current `auth.users` and `auth.addresses` tables after this plan is reviewed and approved.

Expected legacy source tables:

- `customer`
- `address`
- `country`
- `zone`

## Safety Rules

- Use `backend/scripts/import-customers.js` with `--dry-run` before the real import.
- Import is idempotent by `users.legacy_id`, normalized email, and `addresses.legacy_id`.
- Emails are normalized to lowercase and trimmed before deduplication.
- Duplicate legacy customers with the same normalized email are collapsed to one canonical customer.
- Canonical customer selection prefers active customers, then newest `date_added`, then highest `customer_id`.
- Existing users matched by email are updated with safe profile fields and linked to `legacy_id` only when there is no conflicting legacy mapping.
- Imported users get `requires_password_reset = true`.
- New imported users receive a disabled placeholder password hash, so legacy password hashes are never reused.
- Legacy customer passwords, salts, tokens, carts, wishlists, custom fields, and IPs are not imported.
- Logs must contain only counts, table names, and legacy IDs for conflicts/skips. No raw emails, names, phones, passwords, tokens, addresses, or IPs.

## Import Steps

1. Apply migrations:
   `npm run db:migrate`
   This must include the password reset token table, because imported legacy users cannot reuse old passwords.
2. Run a dry run:
   `npm run import:customers -- ../../margele_oc.mysql.sql --dry-run`
3. Review the summary:
   imported/updated users, imported/updated addresses, duplicate emails skipped, invalid emails skipped, and conflicts.
4. If conflicts exist, resolve them manually before proceeding.
5. Run the import:
   `npm run import:customers -- ../../margele_oc.mysql.sql`
6. Spot-check counts in the database without exposing sensitive fields:
   users with `legacy_id`, users with `requires_password_reset`, and addresses linked to imported users.

## Acceptance Mapping

- Customers are imported with `legacy_id`: `users.legacy_id`.
- Emails are deduplicated: normalized email dedupe before database writes plus unique lower-email index.
- Addresses are imported and linked to users: `addresses.user_id` references imported or matched users.
- Imported users are marked as requiring password reset: `users.requires_password_reset = true`.
- Sensitive fields are not exposed in logs: importer logs aggregate counts and legacy IDs only.
