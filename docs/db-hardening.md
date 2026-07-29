# Database Hardening

The local development database can use the `postgres` superuser, but production should not.

## Current Check

Run:

```powershell
cd backend
npm.cmd run db:hardening
```

The report checks:

- current DB user
- whether SSL is active
- whether the role is superuser / can create roles / can create databases
- table privileges across application schemas

## Production Target

Use separate users:

- app runtime user: read/write only on application tables
- migration user: schema changes, migrations, imports
- backup user: read-only dump access, if supported by the provider

## Runtime User Shape

Example only. Adjust database, username, and password in your production provider:

```sql
CREATE ROLE margele_app LOGIN PASSWORD 'use-provider-secret';

GRANT CONNECT ON DATABASE margele_net TO margele_app;
GRANT USAGE ON SCHEMA auth, catalog, commerce, content, public TO margele_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth, catalog, commerce, content TO margele_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA auth, catalog, commerce, content TO margele_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA auth, catalog, commerce, content
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO margele_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA auth, catalog, commerce, content
GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO margele_app;
```

Do not grant:

- `SUPERUSER`
- `CREATEDB`
- `CREATEROLE`
- `REPLICATION`
- `BYPASSRLS`

## SSL

For production, use the provider's SSL connection string or set SSL in the Postgres client options when the provider requires it.

Local development may report:

```txt
SSL: not enabled / local connection
```

That is acceptable locally, but not for production.

## Restore Safety

Keep restore permissions separate from normal app runtime permissions. A restore operation is destructive and should use a temporary/test database first.
