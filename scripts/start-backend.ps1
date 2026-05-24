param(
    [string]$Python = "python",
    [switch]$Detached
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

if (-not (Test-Path ".\.venv")) {
    & $Python -m venv .venv
}

. .\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip | Out-Null
pip install -q -r backend/requirements.txt

$env:PYTHONPATH = "$root\backend"

if ($Detached) {
    $log = Join-Path $root "bob.log"
    Write-Host "Starting B.O.B backend in background. Log: $log"
    $py = Join-Path $root ".venv\Scripts\python.exe"
    Start-Process -FilePath $py `
        -ArgumentList "-m", "bob.main" `
        -WorkingDirectory $root `
        -RedirectStandardOutput $log `
        -RedirectStandardError "$log.err" `
        -WindowStyle Hidden
    Start-Sleep -Seconds 3
    Write-Host "Backend running at http://127.0.0.1:8765"
} else {
    python -m bob.main
}
