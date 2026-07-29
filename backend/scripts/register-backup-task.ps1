param(
  [string]$TaskName = 'MargeleNetDailyDatabaseBackup',
  [string]$At = '03:15'
)

$ErrorActionPreference = 'Stop'

$scriptPath = Resolve-Path (Join-Path $PSScriptRoot 'run-scheduled-backup.ps1')
$action = New-ScheduledTaskAction `
  -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At $At
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -MultipleInstances IgnoreNew `
  -ExecutionTimeLimit (New-TimeSpan -Hours 2)

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description 'Creates an encrypted Margele.net database backup and uploads it to Cloudflare R2.' `
  -Force | Out-Null

Write-Host "Scheduled task registered: $TaskName"
Write-Host "Runs daily at: $At"
Write-Host "Backup script: $scriptPath"
