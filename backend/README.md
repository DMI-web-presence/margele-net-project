# Margele Net Backend

Small Node HTTP API for authentication and account data.

## Environment

Create `backend/.env`:

```env
PORT=3001
DATABASE_URL=postgres://postgres:password@localhost:5432/margele_net
JWT_SECRET=change-me
FRONTEND_ORIGIN=http://localhost:3000
```

For local compatibility, the server can temporarily read `DATABASE_URL` and
`JWT_SECRET` from `frontend/.env`, but backend secrets should live in
`backend/.env`.

## Run

From the project root:

```bash
npm run backend:dev
```

The frontend already points auth requests at `http://127.0.0.1:3001` by default.

## Current required table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Optional profile columns are detected automatically if you add them later:

```sql
ALTER TABLE users
ADD COLUMN phone VARCHAR(30),
ADD COLUMN client_type VARCHAR(30) DEFAULT 'Persoana fizica',
ADD COLUMN company_name VARCHAR(150),
ADD COLUMN cui VARCHAR(50),
ADD COLUMN trade_register_number VARCHAR(80),
ADD COLUMN birth_date DATE,
ADD COLUMN newsletter_subscribed BOOLEAN DEFAULT false;
```
