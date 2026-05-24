param(
    [switch]$Production
)

# Convenience: start backend (detached) + frontend (foreground).
# Use -Production to also build the frontend first and run `next start`.

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host "==> Stopping any previous B.O.B processes..."
& powershell -ExecutionPolicy Bypass -File (Join-Path $root "scripts\stop-all.ps1") | Out-Null

Write-Host "==> Starting backend (detached)..."
& powershell -ExecutionPolicy Bypass -File (Join-Path $root "scripts\start-backend.ps1") -Detached

Write-Host "==> Waiting for backend to become healthy..."
$backendPort = if ($env:BOB_PORT) { [int]$env:BOB_PORT } elseif ($env:JARVIS_PORT) { [int]$env:JARVIS_PORT } else { 8765 }
$ready = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 500
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$backendPort/" -UseBasicParsing -TimeoutSec 2
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
}
if (-not $ready) {
    Write-Warning "Backend did not respond at http://127.0.0.1:$backendPort within 10s. Check bob.log."
} else {
    Write-Host "Backend healthy at http://127.0.0.1:$backendPort"
}

Write-Host "==> Starting frontend..."
if ($Production) {
    & powershell -ExecutionPolicy Bypass -File (Join-Path $root "scripts\start-frontend-prod.ps1")
} else {
    & powershell -ExecutionPolicy Bypass -File (Join-Path $root "scripts\start-frontend.ps1")
}
