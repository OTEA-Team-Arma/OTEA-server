@echo off
REM Lancement rapide du serveur OTEA (Node.js)
cd /d %~dp0\..\..
call npm install
node js/server.js
pause
