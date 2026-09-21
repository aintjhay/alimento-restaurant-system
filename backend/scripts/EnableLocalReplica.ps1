$ErrorActionPreference = 'Stop'
$configPath = 'C:\Program Files\MongoDB\Server\8.2\bin\mongod.cfg'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$backupRoot = Join-Path $projectRoot 'backup-artifacts'
if (!(Test-Path -LiteralPath (Join-Path $backupRoot 'local-replica-latest.txt'))) { throw 'Run node scripts/localReplica.js backup first.' }
$original = [System.IO.File]::ReadAllText($configPath)
if ($original -notmatch 'dbPath: C:\\Program Files\\MongoDB\\Server\\8.2\\data') { throw 'Unexpected MongoDB data directory. No changes made.' }
if ($original -match '(?m)^replication:') {
    if ($original -notmatch '(?m)^\s+replSetName:\s*rs0\s*$') { throw 'A different replication configuration already exists.' }
    Write-Output 'rs0 is already configured.'
    exit 0
}
$savedConfig = Join-Path $backupRoot ('mongod-before-replica-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.cfg')
[System.IO.File]::WriteAllText($savedConfig, $original, [System.Text.UTF8Encoding]::new($false))
$updated = $original + "`r`nreplication:`r`n  replSetName: rs0`r`n"
# Preserve storage, logging and localhost-only network settings.
try {
    Stop-Service -Name MongoDB
    (Get-Service -Name MongoDB).WaitForStatus('Stopped', [TimeSpan]::FromSeconds(30))
    [System.IO.File]::WriteAllText($configPath, $updated, [System.Text.UTF8Encoding]::new($false))
    Start-Service -Name MongoDB
    (Get-Service -Name MongoDB).WaitForStatus('Running', [TimeSpan]::FromSeconds(30))
    Write-Output 'MongoDB restarted with rs0 enabled. Existing data directory preserved.'
} catch {
    if ((Get-Service -Name MongoDB).Status -eq 'Stopped') {
        [System.IO.File]::WriteAllText($configPath, $original, [System.Text.UTF8Encoding]::new($false))
        Start-Service -Name MongoDB
    }
    throw
}
