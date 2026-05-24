param(
    [int]$Port = 8765,
    [int]$TimeoutSec = 5
)

# Probes the B.O.B backend and prints a tidy status table.
# Exit code: 0 on success (root + /info + /safety/config + /engines all OK),
#            1 on any failure. Designed for CI and future installer self-checks.

$ErrorActionPreference = "Continue"

if ($env:BOB_PORT) {
    $Port = [int]$env:BOB_PORT
} elseif ($env:JARVIS_PORT) {
    $Port = [int]$env:JARVIS_PORT
}
$base = "http://127.0.0.1:$Port"

function Probe {
    param(
        [string]$Path,
        [string]$Label,
        [string]$Method = "GET"
    )
    $url = "$base$Path"
    try {
        $r = Invoke-WebRequest -Uri $url -Method $Method -UseBasicParsing -TimeoutSec $TimeoutSec
        if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) {
            return @{ ok = $true; label = $Label; status = $r.StatusCode; body = $r.Content }
        }
        return @{ ok = $false; label = $Label; status = $r.StatusCode; body = $r.Content }
    } catch {
        return @{ ok = $false; label = $Label; status = "ERR"; body = $_.Exception.Message }
    }
}

Write-Host "B.O.B health check -> $base" -ForegroundColor Cyan
Write-Host ""

$checks = @(
    (Probe "/"               "root"),
    (Probe "/info"           "info"),
    (Probe "/safety/config"  "safety/config"),
    (Probe "/engines"        "engines")
)

$failed = 0
foreach ($c in $checks) {
    $tag = if ($c.ok) { "OK " } else { "FAIL" }
    $color = if ($c.ok) { "Green" } else { "Red" }
    Write-Host ("  [{0}] {1,-16} {2}" -f $tag, $c.label, $c.status) -ForegroundColor $color
    if (-not $c.ok) {
        $failed++
        Write-Host ("        {0}" -f $c.body) -ForegroundColor DarkYellow
    }
}

Write-Host ""

if ($failed -eq 0) {
    try {
        $info = ($checks | Where-Object { $_.label -eq "info" }).body | ConvertFrom-Json
        Write-Host ("Engines: " + ($info.engines | ForEach-Object {
            $flag = if ($_.available) { "ok" } else { "off" }
            "{0}({1})" -f $_.id, $flag
        }) -join ", ")
        Write-Host ("Users: {0}   Onboarding required: {1}" -f $info.user_count, $info.needs_onboarding)
    } catch {}
    Write-Host ""
    Write-Host "All checks passed." -ForegroundColor Green
    exit 0
}

Write-Host ("{0} check(s) failed." -f $failed) -ForegroundColor Red
exit 1
