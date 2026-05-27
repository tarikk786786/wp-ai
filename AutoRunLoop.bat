@echo off
cd /d "C:\Users\tarik\Downloads\tarik AI"

if not exist logs mkdir logs

:: Load environment variables
for /f "usebackq tokens=1,2 delims==" %%A in (".env.local") do (
    if not "%%A"=="" if not "%%A:~0,1%"=="#" (
        set "%%A=%%B"
    )
)

:: Start Cloudflare Tunnel in background (Creates a public URL)
start "" /B .\cloudflared.exe tunnel --url http://localhost:3001 > logs\tunnel.log 2>&1

:: Extract URL and save to Desktop (async)
start "" /B powershell -Command "Start-Sleep 10; Get-Content logs\tunnel.log | Select-String 'https://.*trycloudflare.com' | Out-File \"$env:USERPROFILE\Desktop\Tarik-Bot-Public-URL.txt\""

:: Start the Bot Loop
:loop
echo [%date% %time%] Starting Bot... >> logs\bot-loop.log
call npm run server >> logs\bot-loop.log 2>&1
echo [%date% %time%] Bot crashed or stopped, restarting in 5s... >> logs\bot-loop.log
timeout /t 5 >nul
goto loop
