#!/bin/bash
# === update_armar_ds.sh ===
# Script de mise à jour Arma Reforger Server (Linux)
# Utilise SteamCMD pour télécharger/mettre à jour le binaire
# À adapter selon votre configuration SteamCMD

echo ""
echo "========================================"
echo "Mise a jour Arma Reforger Server (Linux)"
echo "========================================"
echo ""

# Adapter ces chemins selon votre installation
STEAMCMD_PATH="/usr/bin/steamcmd"
SERVER_DIR="/home/arma/server"
APP_ID=1874900

# Vérifier si SteamCMD existe
if [ ! -f "$STEAMCMD_PATH" ]; then
    echo "ERROR: SteamCMD not found at: $STEAMCMD_PATH"
    echo "Please check STEAMCMD_PATH in this script"
    exit 1
fi

# Vérifier si répertoire serveur existe
if [ ! -d "$SERVER_DIR" ]; then
    echo "ERROR: Server directory not found at: $SERVER_DIR"
    echo "Please check SERVER_DIR in this script"
    exit 1
fi

echo "[INFO] SteamCMD: $STEAMCMD_PATH"
echo "[INFO] Server Dir: $SERVER_DIR"
echo "[INFO] App ID: $APP_ID"
echo ""

# S'assurer que le binaire existant est supprimé pour forcer la réinstallation
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
echo "Mise a jour terminee avec succes"
echo "========================================"
echo ""
exit 0
