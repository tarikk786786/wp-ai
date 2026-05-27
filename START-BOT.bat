@echo off
title Tarik AI WhatsApp Bot - DO NOT CLOSE THIS WINDOW
color 0A

echo.
echo  ====================================================
echo   TARIK AI WHATSAPP BOT - LIVE TERMINAL
echo  ====================================================
echo.
echo   !!! CRITICAL WARNING !!!
echo   DO NOT CLOSE THIS BLACK WINDOW!
echo   IF YOU CLOSE THIS WINDOW, THE BOT WILL GO OFFLINE!
echo   JUST MINIMIZE IT (-) TO KEEP IT RUNNING FOREVER.
echo.
echo  ====================================================
echo.

cd /d "C:\Users\tarik\Downloads\tarik AI"

echo [1/3] Loading environment variables...
for /f "usebackq tokens=1,2 delims==" %%A in (".env.local") do (
    if not "%%A"=="" if not "%%A:~0,1%"=="#" (
        set "%%A=%%B"
    )
)

echo [2/3] Building Web UI Dashboard...
call npm run build >nul 2>&1
if exist dist (
    echo       Dashboard Web UI built successfully!
) else (
    echo       WARNING: Dashboard failed to build!
)

echo [3/3] Stopping old PM2/hidden instances...
call pm2 kill >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo  ====================================================
echo   STARTING THE BOT - Dashboard will be at:
echo   http://localhost:3001
echo  ====================================================
echo.

REM Infinite auto-restart loop inside this terminal
:loop
call npm run server
echo.
echo [CRASH DETECTED] The bot crashed! Restarting automatically in 5 seconds...
timeout /t 5 >nul
goto loop
