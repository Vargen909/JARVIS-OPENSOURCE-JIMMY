$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location "$root\frontend"

if (-not (Test-Path ".\node_modules")) {
    npm install
}

npm run dev
