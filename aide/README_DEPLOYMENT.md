# Guide de Déploiement Cross-Platform OTEA-server

## 📋 Vue d'Ensemble

OTEA-server est maintenant **100% cross-platform** et peut s'exécuter sur Windows et Linux sans modification du code. Le module `osAbstraction.js` gère tous les détails OS-spécifiques.

---

## 🖥️ DÉPLOIEMENT WINDOWS

### Prérequis
- **Node.js** v14+ installé
- **ArmaReforgerServer.exe** téléchargé via SteamCMD
- **SteamCMD** installé

### Étapes d'Installation

#### 1️⃣ Installer le Binaire Arma Reforger Server

```powershell
# Télécharger/mettre à jour le binaire
C:\SteamCMD\steamcmd.exe +login anonymous +app_update 1874900 -beta -dir "C:\Arma3DS" +quit
```

Cela crée/met à jour `C:\Arma3DS\ArmaReforgerServer.exe`

#### 2️⃣ Configurer OTEA-server

Éditer `data/config.json`:

```json
{
  "serverRootPath": "C:\\Arma3DS",
  "steamCmdPath": "C:\\SteamCMD\\steamcmd.exe",
  "backendLog": true,
  "maxInstances": 5,
  "defaultRegion": "EU"
}
```

**OU** utiliser des variables d'environnement (priorité supérieure):

```powershell
# PowerShell
$env:ARMA_SERVER_ROOT = "C:\Arma3DS"
$env:STEAMCMD_PATH = "C:\SteamCMD\steamcmd.exe"
$env:BACKEND_LOG = "true"

# Puis lancer
node js\server.js
```

#### 3️⃣ Installer les Dépendances et Lancer

```powershell
cd path\to\OTEA-server
npm install
node js\server.js
```

**Sortie attendue:**
```
[osAbstraction] 🚀 Initializing osAbstraction module...
[osAbstraction] 🖥️  Platform detected: win32
[osAbstraction] 📁 Server root path: C:\Arma3DS
[osAbstraction] ✅ Binary found: C:\Arma3DS\ArmaReforgerServer.exe
[osAbstraction] ✅ Update script found: C:\Arma3DS\update_armar_ds.bat
[osAbstraction] ✅ osAbstraction ready for win32
✅ OTEA-server is ready!
📊 Platform: win32
📁 Server root: C:\Arma3DS
Interface d'ingénierie active sur le port 3000
```

#### 4️⃣ (Optionnel) Configurer la Mise à Jour via Script

Copier `update_armar_ds.bat` vers `C:\Arma3DS\`:

```powershell
Copy-Item ".\update_armar_ds.bat" "C:\Arma3DS\"
```

Adapter les chemins dans le script si nécessaire.

---

## 🐧 DÉPLOIEMENT LINUX (Ubuntu/Debian)

### Prérequis
- **Node.js** v14+ installé
- **ArmaReforgerServer** (binaire) téléchargé via SteamCMD
- **SteamCMD** installé
- **Permissions d'exécution** pour les scripts

### Étapes d'Installation

#### 1️⃣ Installer le Binaire Arma Reforger Server

```bash
# Créer le répertoire
mkdir -p /home/arma/server

# Télécharger/mettre à jour le binaire
/usr/bin/steamcmd +login anonymous +app_update 1874900 -beta -dir "/home/arma/server" +quit

# S'assurer que le binaire est exécutable
chmod +x /home/arma/server/ArmaReforgerServer
```

#### 2️⃣ Configurer OTEA-server

Éditer `data/config.json`:

```json
{
  "serverRootPath": "/home/arma/server",
  "steamCmdPath": "/usr/bin/steamcmd",
  "backendLog": true,
  "maxInstances": 5,
  "defaultRegion": "EU"
}
```

**OU** utiliser des variables d'environnement (priorité supérieure):

```bash
# Bash
export ARMA_SERVER_ROOT="/home/arma/server"
export STEAMCMD_PATH="/usr/bin/steamcmd"
export BACKEND_LOG="true"

# Puis lancer
node js/server.js
```

#### 3️⃣ Installer les Dépendances et Lancer

```bash
cd /path/to/OTEA-server
npm install
node js/server.js
```

**Sortie attendue:**
```
[osAbstraction] 🚀 Initializing osAbstraction module...
[osAbstraction] 🖥️  Platform detected: linux
[osAbstraction] 📁 Server root path: /home/arma/server
[osAbstraction] ✅ Binary found: /home/arma/server/ArmaReforgerServer
[osAbstraction] ✅ Already executable: /home/arma/server/ArmaReforgerServer
[osAbstraction] ✅ Update script found: /home/arma/server/update_armar_ds.sh
[osAbstraction] ✅ osAbstraction ready for linux
✅ OTEA-server is ready!
📊 Platform: linux
📁 Server root: /home/arma/server
Interface d'ingénierie active sur le port 3000
```

#### 4️⃣ (Optionnel) Configurer la Mise à Jour via Script

Copier `update_armar_ds.sh` vers `/home/arma/server/`:

```bash
cp ./update_armar_ds.sh /home/arma/server/
chmod +x /home/arma/server/update_armar_ds.sh
```

Adapter les chemins dans le script si nécessaire.

#### 5️⃣ (Optionnel) Lancer en Arrière-plan avec PM2

```bash
# Installer PM2 globalement
sudo npm install -g pm2

# Lancer OTEA-server
pm2 start js/server.js --name "otea-server"

# Sauvegarder la config PM2
pm2 save

# Auto-démarrage au reboot
pm2 startup
```

---

## ⚙️ Variable d'Environnement vs config.json

### Priorité de Chargement (de plus haute à plus basse):

1. **Variables d'environnement** (ARMA_SERVER_ROOT, STEAMCMD_PATH, BACKEND_LOG)
2. **data/config.json** (fichier local)
3. **Valeurs par défaut** (C:\Arma3DS ou /home/arma/server selon OS)

### Exemple: Utiliser les Deux

**Cas 1: Production (Linux avec env var)**
```bash
# Surcharger le chemin via variable d'environnement
export ARMA_SERVER_ROOT="/mnt/large-disk/arma"
node js/server.js
```

**data/config.json** sera ignoré pour `serverRootPath`, mais autres paramètres seront utilisés.

**Cas 2: Développement (Windows avec config.json)**
```json
{
  "serverRootPath": "E:\\TestServer",
  "steamCmdPath": "C:\\SteamCMD\\steamcmd.exe"
}
```

Aucune variable d'env, donc config.json est utilisé directement.

---

## 🔧 Dépannage

### ❌ Erreur: "FATAL: Initialization failed. Binary not found"

**Cause:** Le binaire ArmaReforgerServer n'existe pas au chemin spécifié.

**Solution:**
1. Vérifier `serverRootPath` dans `data/config.json`
2. Vérifier que le binaire existe: `ls /home/arma/server/ArmaReforgerServer` (Linux)
3. Réinstaller avec SteamCMD

### ❌ Erreur: "Update script not found" (Warning)

**Cause:** Le fichier `update_armar_ds.bat` ou `.sh` n'existe pas.

**Solution:**
1. Copier `update_armar_ds.sh` vers le répertoire du serveur
2. Sur Linux: `chmod +x update_armar_ds.sh`

### ❌ Erreur: "Permission denied" (Linux)

**Cause:** Le binaire n'est pas exécutable.

**Solution:**
```bash
chmod +x /home/arma/server/ArmaReforgerServer
```

### ❌ Sortie: "Platform: linux" mais reçois du bash "command not found"

**Cause:** SteamCMD ou autre utilitaire n'est pas installé.

**Solution:**
```bash
# Linux: installer SteamCMD
sudo apt-get install steamcmd

# Vérifier
which steamcmd
```

---

## 📊 Vérification de la Configuration

Pour déboguer, consultez les logs au démarrage:

```
[osAbstraction] Platform detected: win32|linux
[osAbstraction] Server root path: /path/to/server
[osAbstraction] Binary found: /path/to/ArmaReforgerServer[.exe]
```

Vous pouvez aussi consulter avec cURL:

```bash
# Voir la config (non recommandé pour production!)
curl -u admin:admin1234 http://localhost:3000/api/servers-status
```

---

## 🚀 Déploiement Automatisé (Optional)

### Windows - PowerShell Script

```powershell
# setup-windows.ps1
$serverRoot = "C:\Arma3DS"
$steamCmd = "C:\SteamCMD\steamcmd.exe"

# Créer répertoire
New-Item -ItemType Directory -Path $serverRoot -Force

# Installer binaire
& "$steamCmd" +login anonymous +app_update 1874900 -beta -dir "$serverRoot" +quit

# Lancer OTEA-server
cd "path\to\OTEA-server"
npm install
node js/server.js
```

### Linux - Bash Script

```bash
#!/bin/bash
# setup-linux.sh
SERVER_ROOT="/home/arma/server"
STEAMCMD="/usr/bin/steamcmd"

mkdir -p $SERVER_ROOT
$STEAMCMD +login anonymous +app_update 1874900 -beta -dir "$SERVER_ROOT" +quit
chmod +x "$SERVER_ROOT/ArmaReforgerServer"

cd /path/to/OTEA-server
npm install
node js/server.js
```

---

## 📝 Résumé Architecture Cross-Platform

```
┌──────────────────────────────────────────┐
│         OTEA-server (Node.js)            │
├──────────────────────────────────────────┤
│                                          │
│  server.js (Code 100% agnostique)        │
│       │                                  │
│       ├─► osAbstraction.js (Abstraction) │
│           │                              │
│           ├─► Windows: netstat, taskkill │
│           └─► Linux: lsof, kill          │
│                                          │
│       ├─► ArmaReforgerServer.exe (Win)   │
│       └─► ArmaReforgerServer (Linux)     │
│                                          │
└──────────────────────────────────────────┘
```

---

## ✅ Checklist Déploiement

**Windows:**
- [ ] Node.js v14+ installé
- [ ] SteamCMD installé et configuré
- [ ] ArmaReforgerServer.exe présent dans C:\Arma3DS
- [ ] data/config.json configuré avec serverRootPath
- [ ] npm install exécuté
- [ ] node js/server.js démarre sans erreur

**Linux:**
- [ ] Node.js v14+ installé
- [ ] SteamCMD installé (`apt-get install steamcmd`)
- [ ] ArmaReforgerServer binaire présent dans /home/arma/server
- [ ] chmod +x /home/arma/server/ArmaReforgerServer exécuté
- [ ] data/config.json configuré avec serverRootPath
- [ ] npm install exécuté
- [ ] node js/server.js démarre sans erreur

---

**Questions?** Consultez les logs osAbstraction en haut du terminal au démarrage.
