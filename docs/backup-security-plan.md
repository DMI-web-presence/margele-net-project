# Backup And Restore Plan

## Local Backups

Create a compressed PostgreSQL custom-format backup:

```bash
cd backend
npm.cmd run backup:db
```

Backups are written to:

```txt
.local/backups/
```

Each backup has a `.dump` file and a small `.json` metadata file. The backup folder is ignored by git.

Optional plain SQL backup:

```bash
node scripts/backup-db.js --plain
```

## Retention Cleanup

Preview old backups that would be removed:

```bash
cd backend
npm.cmd run backup:prune
```

Actually delete old backups:

```bash
npm.cmd run backup:prune -- --confirm
```

Default retention:

- 14 daily backups
- 8 weekly backups
- 12 monthly backups

You can override this in `backend/.env`:

```env
BACKUP_RETENTION_DAILY=14
BACKUP_RETENTION_WEEKLY=8
BACKUP_RETENTION_MONTHLY=12
```

## Restore Testing

Restore only into a temporary/test database first:

```bash
cd backend
npm.cmd run backup:restore -- ../.local/backups/backup-name.dump --target-url postgres://user:password@localhost:5432/margele_restore_test --confirm
```

The restore script refuses to use `DATABASE_URL` by default. Use `--target-url` or `RESTORE_DATABASE_URL`.

After restore:

```bash
npm.cmd run migration:validate
```

Or run the automated restore smoke test. It creates a temporary database, restores the latest local backup, runs validation, then removes the temporary database:

```bash
cd backend
npm.cmd run backup:test-restore
```

## Production Rule

Before any migration, import, or bulk edit:

```bash
cd backend
npm.cmd run backup:db
npm.cmd run migration:validate
```

## Offsite Backups To Cloudflare R2

Set these in `backend/.env`:

```env
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_ENDPOINT=...
R2_REGION=auto
R2_BACKUP_ACCESS_KEY_ID=...
R2_BACKUP_SECRET_ACCESS_KEY=...
R2_BACKUP_BUCKET_NAME=margele-project-db-backups
R2_BACKUP_ENDPOINT=...
R2_BACKUP_REGION=auto
BACKUP_R2_PREFIX=database-backups
BACKUP_ENCRYPTION_KEY=use-a-long-random-secret
BACKUP_ALERT_EMAIL=admin@example.com
```

`R2_BACKUP_*` values are preferred for database backups. The older `R2_*` values remain available for product images and as fallback. `BACKUP_ENCRYPTION_KEY` is required. The upload script encrypts the backup locally with AES-256-GCM before sending it to R2.

Generate a strong encryption key:

```bash
cd backend
npm.cmd run backup:key
```

Add the generated `BACKUP_ENCRYPTION_KEY` to `backend/.env`, and keep a second copy somewhere safe outside the server.

Upload the latest existing local backup:

```bash
cd backend
npm.cmd run backup:upload-r2
```

Create a new local backup and upload it offsite:

```bash
npm.cmd run backup:db:offsite
```

The uploaded files are:

```txt
database-backups/<backup-name>.dump.enc
database-backups/<backup-name>.dump.enc.json
```

To restore an offsite backup, download both files from R2, then decrypt the `.enc` file:

```bash
cd backend
npm.cmd run backup:decrypt -- ../.local/backups/backup-name.dump.enc
```

Then restore the decrypted `.dump` into a test database first:

```bash
npm.cmd run backup:restore -- ../.local/backups/backup-name.dump --target-url postgres://user:password@localhost:5432/margele_restore_test --confirm
```

Without `BACKUP_ENCRYPTION_KEY`, the offsite backup cannot be decrypted.

## Scheduled Backups On Windows

Register a daily scheduled backup. This creates a new local backup, uploads the encrypted copy to R2, then prunes old local backups:

```powershell
cd backend
.\scripts\register-backup-task.ps1
```

By default it runs daily at `03:15`. To choose another time:

```powershell
.\scripts\register-backup-task.ps1 -At '02:30'
```

Run it manually from Task Scheduler, or test the exact scheduled command directly:

```powershell
.\scripts\run-scheduled-backup.ps1
```

Logs are written to:

```txt
.local/backup-logs/
```

If the scheduled backup fails, the script sends a Brevo alert to `BACKUP_ALERT_EMAIL`. If that is not set, it falls back to `BREVO_ADMIN_EMAIL`, then the first email from `ADMIN_EMAILS`.

Test the alert email without breaking a real backup:

```powershell
cd backend
npm.cmd run backup:send-alert -- --status failed
```

Remove the scheduled task:

```powershell
.\scripts\unregister-backup-task.ps1
```

## R2 Lifecycle And Security

Preview the Cloudflare R2 lifecycle rule:

```powershell
cd backend
npm.cmd run security:r2-lifecycle
```

Apply the lifecycle rule:

```powershell
npm.cmd run security:r2-lifecycle -- --apply
```

The default offsite retention is `90` days. Override it in `backend/.env`:

```env
BACKUP_R2_RETENTION_DAYS=90
BACKUP_R2_LIFECYCLE_RULE_ID=margele-net-encrypted-db-backups
```

More detail: `docs/r2-security-checklist.md`.

## Security Audits

Run the local secret/config audit:

```powershell
cd backend
npm.cmd run security:audit
```

Run the database hardening report:

```powershell
npm.cmd run db:hardening
```

More detail:

- `docs/restore-drill.md`
- `docs/r2-security-checklist.md`
- `docs/db-hardening.md`
