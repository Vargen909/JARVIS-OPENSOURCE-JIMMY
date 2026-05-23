param(
    [int]$Port = 8765
)

# Stops any process listening on the Jarvis backend port.
# Idempotent — safe to run if nothing is listening.

$ErrorActionPreference = "SilentlyContinue"

if ($env:JARVIS_PORT) {
    $Port = [int]$env:JARVIS_PORT
}

$conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $conns) {
    Write-Host "Backend not running on port $Port."
    exit 0
}

$killed = 0
foreach ($c in $conns) {
    $procId = $c.OwningProcess
    if ($procId -and $procId -ne 0) {
        try {
            Stop-Process -Id $procId -Force -ErrorAction Stop
            Write-Host "Stopped backend PID $procId on port $Port."
            $killed++
        } catch {
            Write-Warning "Could not stop PID $procId : $_"
        }
    }
}

if ($killed -eq 0) {
    Write-Host "Nothing stopped on port $Port."
}
