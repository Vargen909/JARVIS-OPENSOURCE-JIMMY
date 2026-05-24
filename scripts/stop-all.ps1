$ErrorActionPreference = "Continue"
$root = Split-Path $PSScriptRoot -Parent

Write-Host "==> Stopping B.O.B backend..."
& powershell -ExecutionPolicy Bypass -File (Join-Path $root "scripts\stop-backend.ps1")

Write-Host "==> Stopping B.O.B frontend..."
& powershell -ExecutionPolicy Bypass -File (Join-Path $root "scripts\stop-frontend.ps1")

Write-Host "Done."
