# Production Restore Drill

Use this runbook when you need to prove backups are recoverable, or when production data must be restored after an incident.

## Monthly Drill

1. Confirm the latest offsite backup exists in Cloudflare R2:

```powershell
cd backend
npm.cmd run security:r2-lifecycle -- --list
```

2. Run the local restore smoke test:

```powershell
npm.cmd run backup:test-restore
```

3. Confirm validation output includes:

```txt
Orders: source 8125 / postgres 8125 / diff 0
Order items: source 37883 / postgres 37883 / diff 0
Restore test passed.
```

4. Check the admin dashboard `Status backup` panel.

5. Record the drill date and result outside the repo.

## Emergency Restore

1. Stop writes to the application if production is affected.

2. Download both files from R2:

```txt
database-backups/<backup-name>.dump.enc
database-backups/<backup-name>.dump.enc.json
```

3. Place them in:

```txt
.local/backups/
```

4. Decrypt locally:

```powershell
cd backend
npm.cmd run backup:decrypt -- ../.local/backups/<backup-name>.dump.enc
```

5. Restore first into a temporary database:

```powershell
npm.cmd run backup:restore -- ../.local/backups/<backup-name>.dump --target-url postgres://user:password@host:5432/margele_restore_test --confirm
```

6. Validate:

```powershell
$env:DATABASE_URL="postgres://user:password@host:5432/margele_restore_test"
npm.cmd run migration:validate
```

7. Only after validation, restore to production using the hosting provider's approved recovery process.

## Rules

- Never restore directly over production before a test restore passes.
- Never send `BACKUP_ENCRYPTION_KEY` through chat, email, tickets, or screenshots.
- Keep the encryption key in a password manager and in one offline emergency location.
- After any suspected credential exposure, rotate R2 keys and the backup encryption key.
