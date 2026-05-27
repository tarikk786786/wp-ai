# WhatsApp Bot Persistent Daemon Script
# This script ensures that your WhatsApp Bot Express backend is ALWAYS live.
# If the server crashes, encounters network loss, or disconnections, it automatically restarts.

Clear-Host
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "          ⚡ FRIEND-BROTHER WHATSAPP BOT DAEMON ⚡         " -ForegroundColor Green
Write-Host "               - ALWAYS LIVE & AUTO-REPLYING -            " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Status: Active & Monitoring" -ForegroundColor Yellow
Write-Host "OS: Windows Native PowerShell Daemon" -ForegroundColor Yellow
Write-Host "Directory: $PSScriptRoot" -ForegroundColor Yellow
Write-Host "----------------------------------------------------------" -ForegroundColor Gray
Write-Host "Starting Express WhatsApp Bot backend..." -ForegroundColor Cyan

do {
    # Start the TSX server and wait for execution
    npx tsx server.ts
    
    # If the process exited, print warning and restart
    Write-Host ""
    Write-Host "[WARNING] WhatsApp Bot server stopped or crashed!" -ForegroundColor Red
    Write-Host "Initiating auto-restart sequence in..." -ForegroundColor Yellow
    
    for ($i = 5; $i -gt 0; $i--) {
        Write-Host "   $i seconds..." -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
    
    Write-Host "----------------------------------------------------------" -ForegroundColor Gray
    Write-Host "🔄 Restarting WhatsApp Bot Express Backend now..." -ForegroundColor Green
    Write-Host ""
} while ($true)
