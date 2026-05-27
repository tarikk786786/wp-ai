@echo off
REM This script runs on Windows startup to start the Tarik AI Bot
cd /d "C:\Users\tarik\Downloads\tarik AI"
pm2 resurrect
timeout /t 5
pm2 status
