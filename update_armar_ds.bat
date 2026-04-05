@echo off
REM === update_armar_ds.bat (Template) ===
REM Script de mise à jour Arma Reforger Server (Windows)
REM À placer dans le répertoire racine du serveur Arma (C:\Arma3DS par défaut)
REM Utilise SteamCMD pour télécharger/mettre à jour le binaire

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Mise a jour Arma Reforger Server
echo ========================================
echo.

REM === ADAPTER CES CHEMINS À VOTRE CONFIGURATION ===
set STEAMCMD_PATH=C:\SteamCMD\steamcmd.exe
set SERVER_DIR=%~dp0
set APP_ID=1874900

REM Vérifier si SteamCMD existe
if not exist "%STEAMCMD_PATH%" (
    echo ERROR: SteamCMD not found at: %STEAMCMD_PATH%
    echo Merci de vérifier le chemin STEAMCMD_PATH dans ce script
    exit /b 1
)

echo [INFO] SteamCMD: %STEAMCMD_PATH%
echo [INFO] Server Dir: %SERVER_DIR%
echo [INFO] App ID: %APP_ID%
echo.

REM Exécuter SteamCMD pour mettre à jour
echo [INFO] Démarrage mise à jour SteamCMD...
"%STEAMCMD_PATH%" +login anonymous +app_update %APP_ID% -beta -dir "%SERVER_DIR:~0,-1%" +quit

if %errorlevel% neq 0 (
    echo ERROR: SteamCMD update failed with exit code %errorlevel%
    exit /b %errorlevel%
)

echo.
echo ========================================
echo Mise a jour terminee avec succes ✅
echo ========================================
echo.
exit /b 0
