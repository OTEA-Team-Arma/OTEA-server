#!/bin/bash
# === update_armar_ds.sh (Template) ===
# Script de mise à jour Arma Reforger Server (Linux)
# À placer dans le répertoire racine du serveur Arma (/home/arma/server par défaut)
# Utilise SteamCMD pour télécharger/mettre à jour le binaire

echo ""
echo "========================================"
echo "Mise a jour Arma Reforger Server (Linux)"
echo "========================================"
echo ""

# === LIRE DEPUIS VARIABLE D'ENVIRONNEMENT OU UTILISER DÉFAUT ===
# Si STEAMCMD_PATH n'est pas défini (via OTEA config.json), utiliser défaut Linux
if [ -z "$STEAMCMD_PATH" ]; then
    STEAMCMD_PATH="/usr/bin/steamcmd"
fi
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVER_DIR="$SCRIPT_DIR"
APP_ID=1874900

# Vérifier si SteamCMD existe
if [ ! -f "$STEAMCMD_PATH" ]; then
    echo "ERROR: SteamCMD not found at: $STEAMCMD_PATH"
    echo "Merci de vérifier le chemin STEAMCMD_PATH dans ce script"
    exit 1
fi

echo "[INFO] SteamCMD: $STEAMCMD_PATH"
echo "[INFO] Script Dir: $SCRIPT_DIR"
echo "[INFO] Server Dir: $SERVER_DIR"
echo "[INFO] App ID: $APP_ID"
echo ""

# S'assurer que le vieux binaire est supprimé pour forcer la réinstallation
echo "[INFO] Removing old binary if exists..."
rm -f "$SERVER_DIR/ArmaReforgerServer"

# Exécuter SteamCMD pour mettre à jour
echo "[INFO] Starting SteamCMD update..."
"$STEAMCMD_PATH" +login anonymous +app_update $APP_ID -beta -dir "$SERVER_DIR" +quit

if [ $? -ne 0 ]; then
    echo "ERROR: SteamCMD update failed"
    exit 1
fi

# S'assurer que le binaire est executable
echo "[INFO] Setting executable permissions..."
chmod +x "$SERVER_DIR/ArmaReforgerServer"

echo ""
echo "========================================"
echo "Mise a jour terminee avec succes ✅"
echo "========================================"
echo ""
exit 0
