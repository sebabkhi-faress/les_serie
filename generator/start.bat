@echo off
title Antigravity QCM Studio IA
echo ========================================================
echo  Lancement du Studio QCM Agent IA (Gemini)
echo ========================================================
echo.
cd /d "%~dp0"
start http://localhost:3000
node server.js
pause
