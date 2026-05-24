param(
    [int]$Port = 3000,
    [switch]$SkipBuild
)

# Builds the frontend (unless -SkipBuild) and serves it with `next start`.
# Use this for desktop-style "production" runs that don't require dev tooling.

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location "$root\frontend"

if ($env:BOB_FRONTEND_PORT) {
    $Port = [int]$env:BOB_FRONTEND_PORT
} elseif ($env:JARVIS_FRONTEND_PORT) {
    $Port = [int]$env:JARVIS_FRONTEND_PORT
}

if (-not $SkipBuild) {
    & powershell -ExecutionPolicy Bypass -File (Join-Path $root "scripts\build-frontend.ps1")
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "==> Starting production frontend on port $Port..."
npx next start -p $Port
