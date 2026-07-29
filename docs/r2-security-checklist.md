# Cloudflare R2 Backup Security Checklist

## Lifecycle

Recommended lifecycle for encrypted DB backups:

- prefix: `database-backups/`
- delete encrypted backup objects after `90` days
- delete encrypted metadata objects after `90` days
- abort incomplete multipart uploads after `1` day

Preview the lifecycle rule:

```powershell
cd backend
npm.cmd run security:r2-lifecycle
```

Apply it:

```powershell
npm.cmd run security:r2-lifecycle -- --apply
```

If R2 returns `Access denied`, the current object upload key is too limited to manage lifecycle rules. That is okay for normal backups. Create a temporary/admin R2 credential for lifecycle setup, apply the rule once, then remove that elevated credential from `backend/.env`.

Use a different retention window:

```powershell
npm.cmd run security:r2-lifecycle -- --days 180 --apply
```

List current lifecycle rules:

```powershell
npm.cmd run security:r2-lifecycle -- --list
```

## Bucket Access

For the database backup bucket:

- keep the bucket private
- do not enable public `r2.dev` access
- do not connect a public custom domain
- use a dedicated R2 access key only for backups
- store `BACKUP_ENCRYPTION_KEY` outside the server too

Cloudflare notes that R2 buckets are not public by default, and public access must be explicitly enabled.

## API Token

Use the smallest useful scope for the backup credentials:

- write objects to the backup bucket
- read lifecycle configuration only if lifecycle automation is used
- avoid account-wide admin tokens

## Verification

After applying lifecycle:

```powershell
npm.cmd run security:r2-lifecycle -- --list
```

Then create and upload a backup:

```powershell
npm.cmd run backup:db:offsite
```

Confirm the admin dashboard `Status backup` panel shows R2 configured and a recent uploaded object.
