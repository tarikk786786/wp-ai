@echo off
cd /d "C:\Users\tarik\Downloads\tarik AI"
:loop
call npm run server >> "C:\Users\tarik\Downloads\tarik AI\logs\bot-out.log" 2>&1
timeout /t 5 >nul
goto loop
