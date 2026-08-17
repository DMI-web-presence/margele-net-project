# Margele Project

Focused e-commerce application for Margele.net.

## Engineering Guardrails

- Product/platform boundaries: `docs/product-platform-boundaries.md`
- Backup and restore plan: `docs/backup-security-plan.md`
- Restore drill: `docs/restore-drill.md`
- Database hardening: `docs/db-hardening.md`

## Local Checks

Backend unit tests:

```powershell
cd backend
npm.cmd test
```

Frontend lint and build:

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build
```

Restore drill, when a local database and backup are available:

```powershell
cd backend
npm.cmd run test:restore
```
