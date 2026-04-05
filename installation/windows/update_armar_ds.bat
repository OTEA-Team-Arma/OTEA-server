@echo off
REM === update_armar_ds.bat ===
REM Script de mise à jour Arma Reforger Server (Windows)
REM Utilise SteamCMD pour télécharger/mettre à jour le binaire
REM À adapter selon votre configuration SteamCMD

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Mise a jour Arma Reforger Server
echo ========================================
echo.

REM Adapter ces chemins selon votre installation
set STEAMCMD_PATH=C:\SteamCMD\steamcmd.exe
set SERVER_DIR=C:\Arma3DS
set APP_ID=1874900

REM Vérifier si SteamCMD existe
if not exist "%STEAMCMD_PATH%" (
    echo ERROR: SteamCMD not found at: %STEAMCMD_PATH%
    echo Please check STEAMCMD_PATH in this script
    exit /b 1
)

REM Vérifier si répertoire serveur existe
if not exist "%SERVER_DIR%" (
    echo ERROR: Server directory not found at: %SERVER_DIR%
    echo Please check SERVER_DIR in this script
    exit /b 1
)

echo [INFO] SteamCMD: %STEAMCMD_PATH%
echo [INFO] Server Dir: %SERVER_DIR%
echo [INFO] App ID: %APP_ID%
echo.

REM Exécuter SteamCMD pour mettre à jour
echo [INFO] Starting SteamCMD update...
"%STEAMCMD_PATH%" +login anonymous +app_update %APP_ID% -beta -dir "%SERVER_DIR%" +quit

if %errorlevel% neq 0 (
    echo ERROR: SteamCMD update failed with exit code %errorlevel%
    exit /b %errorlevel%
)

echo.
echo ========================================
echo Mise a jour terminee avec succes
echo ========================================
echo.
exit /b 0
