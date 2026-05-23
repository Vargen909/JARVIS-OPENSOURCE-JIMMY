param(
    [switch]$SkipInstall
)

# Verifies that the frontend produces a clean production build.
# Used in CI and as part of future desktop-packaging pre-flight.
# Exit code: 0 on success, non-zero on failure. Does NOT start a server.

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location "$root\frontend"

if (-not $SkipInstall) {
    if (-not (Test-Path ".\node_modules")) {
        Write-Host "==> Installing frontend dependencies..."
        npm install
    }
}

Write-Host "==> Type-checking + building (next build)..."
$buildLog = Join-Path $root "frontend-build.log"
npm run build 2>&1 | Tee-Object -FilePath $buildLog
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend build failed. See $buildLog"
    exit 1
}

Write-Host ""
Write-Host "Build OK. Output in frontend\.next\" -ForegroundColor Green
Write-Host "Run .\scripts\start-frontend-prod.ps1 to serve the production build." -ForegroundColor DarkGray
