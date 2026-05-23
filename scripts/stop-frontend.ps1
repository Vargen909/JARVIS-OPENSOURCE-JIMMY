param(
    [int]$Port = 3000
)

# Stops any process listening on the Jarvis frontend port.
# Idempotent — safe to run if nothing is listening.

$ErrorActionPreference = "SilentlyContinue"

if ($env:JARVIS_FRONTEND_PORT) {
    $Port = [int]$env:JARVIS_FRONTEND_PORT
}

$conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $conns) {
    Write-Host "Frontend not running on port $Port."
    exit 0
}

$killed = 0
foreach ($c in $conns) {
    $procId = $c.OwningProcess
    if ($procId -and $procId -ne 0) {
        try {
            Stop-Process -Id $procId -Force -ErrorAction Stop
            Write-Host "Stopped frontend PID $procId on port $Port."
            $killed++
        } catch {
            Write-Warning "Could not stop PID $procId : $_"
        }
    }
}

if ($killed -eq 0) {
    Write-Host "Nothing stopped on port $Port."
}
