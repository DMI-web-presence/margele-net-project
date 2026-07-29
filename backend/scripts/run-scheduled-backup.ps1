$ErrorActionPreference = 'Stop'

$backendRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$projectRoot = Resolve-Path (Join-Path $backendRoot '..')
$logRoot = Join-Path $projectRoot '.local\backup-logs'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logFile = Join-Path $logRoot "backup-$timestamp.log"

New-Item -ItemType Directory -Force -Path $logRoot | Out-Null

Set-Location $backendRoot

function Invoke-LoggedNative {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter(Mandatory = $true)][string[]]$ArgumentList
  )

  & $FilePath @ArgumentList 2>&1 | Tee-Object -FilePath $logFile -Append -Encoding UTF8
  if ($LASTEXITCODE -ne 0) {
    throw "$FilePath $($ArgumentList -join ' ') exited with code $LASTEXITCODE"
  }
}

try {
  "[$(Get-Date -Format o)] Starting scheduled database backup" | Tee-Object -FilePath $logFile -Encoding UTF8
  Invoke-LoggedNative -FilePath 'npm.cmd' -ArgumentList @('run', 'backup:db:offsite')
  Invoke-LoggedNative -FilePath 'npm.cmd' -ArgumentList @('run', 'backup:prune', '--', '--confirm')
  "[$(Get-Date -Format o)] Scheduled database backup finished" | Tee-Object -FilePath $logFile -Append -Encoding UTF8
} catch {
  "[$(Get-Date -Format o)] Scheduled database backup failed: $($_.Exception.Message)" | Tee-Object -FilePath $logFile -Append -Encoding UTF8
  node (Join-Path $backendRoot 'scripts\send-backup-alert.js') --status failed --log $logFile 2>&1 | Tee-Object -FilePath $logFile -Append -Encoding UTF8
  exit 1
}
