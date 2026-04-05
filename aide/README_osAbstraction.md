# Module osAbstraction.js - Structure Logique

## 📋 Vue d'Ensemble

Le module `osAbstraction.js` est une **couche d'abstraction cross-platform** qui centralise toute la logique OS-spécifique pour permettre à OTEA-server de fonctionner sur Windows et Linux sans modifications du code principal.

```
┌─────────────────────────────────────────────────────────────┐
│            osAbstraction.js Module Structure                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ SECTION 1: PRIVÉES INTERNES (Données)                       │
│ ├─ let platformDetected = null                              │
│ ├─ let serverRootPath = null                                │
│ ├─ let executablePath = null                                │
│ ├─ let updateScriptPath = null                              │
│ ├─ let config = {}                                          │
│ └─ let isInitialized = false                                │
│                                                              │
│ SECTION 2: PRIVÉES HELPERS (Fonctions internes)             │
│ ├─ _resolvePlatform()                                       │
│ ├─ _loadConfigWithPriority()                                │
│ ├─ _constructPaths()                                        │
│ ├─ _validateBinaries()                                      │
│ ├─ _ensureExecutablePermissions() [Linux only]              │
│ ├─ _killProcessWindows(port)                                │
│ └─ _killProcessLinux(port)                                  │
│                                                              │
│ SECTION 3: EXPORTS (API Publique)                           │
│ ├─ init(configFromServer)     ← Call from server.js         │
│ ├─ getServerExecutable()      ← Use in /api/launch          │
│ ├─ buildLaunchArgs(...)       ← Use in /api/launch          │
│ ├─ getUpdateScript()          ← Use in /api/update-server   │
│ ├─ killProcessByPort(port)    ← Use in /api/stop fallback   │
│ ├─ getPlatform()              ← For debugging/logging       │
│ └─ getServerRootPath()        ← For debugging               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 SECTION 1: RÉSOLUTION DE LA CONFIGURATION

### Fonction Interne: `_loadConfigWithPriority()`

**Objectif:** Charger la configuration avec un système de priorités (variables d'env > config.json > défauts)

**Entrée:** Aucune (lit l'environnement system et config.json)

**Sortie:**
```json
{
  "platform": "win32|linux",
  "serverRootPath": "C:\\Arma3DS ou /home/arma/server",
  "steamCmdPath": "C:\\SteamCMD\\steamcmd.exe ou /usr/bin/steamcmd",
  "backendLog": true,
  "maxInstances": 5,
  "defaultRegion": "EU"
}
```

**Logique Étape par Étape:**

```
┌──────────────────────────────────────────────┐
│ ÉTAPE 1: Lire variables d'environnement      │
├──────────────────────────────────────────────┤
│ • ARMA_SERVER_ROOT (si défini)               │
│ • STEAMCMD_PATH (si défini)                  │
│ • BACKEND_LOG (si défini)                    │
└──────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│ ÉTAPE 2: Lire data/config.json               │
├──────────────────────────────────────────────┤
│ SI config.json existe {                      │
│   charger son contenu                        │
│ }                                            │
│ SINON {                                      │
│   config_default = null                      │
│ }                                            │
└──────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│ ÉTAPE 3: Fusionner avec PRIORITÉ             │
├──────────────────────────────────────────────┤
│ config_final = {                             │
│   ...config_json,          // Défaults       │
│   ...env_variables         // Override       │
│ }                                            │
└──────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│ ÉTAPE 4: Remplir les valeurs par défaut      │
├──────────────────────────────────────────────┤
│ SI config_final.serverRootPath = null {      │
│   SI platform = "win32" {                    │
│     serverRootPath = "C:\\Arma3DS"           │
│   }                                          │
│   SI platform = "linux" {                    │
│     serverRootPath = "/home/arma/server"     │
│   }                                          │
│ }                                            │
│                                              │
│ SI config_final.backendLog = undefined {     │
│   backendLog = true                          │
│ }                                            │
└──────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│ RETOURNER config_final                       │
└──────────────────────────────────────────────┘
```

---

## 🛣️ SECTION 2: CONSTRUCTION DES CHEMINS

### Fonction Interne: `_constructPaths(config, platform)`

**Objectif:** Construire les chemins complets vers les binaires et scripts selon la plateforme

**Entrée:**
- `config`: Object (résultat de `_loadConfigWithPriority`)
- `platform`: "win32" | "linux"

**Sortie:**
```json
{
  "executablePath": "String (chemin COMPLET au binaire)",
  "updateScriptPath": "String (chemin COMPLET au script)",
  "baseDir": "String"
}
```

**Logique:**

```
┌─────────────────────────────────────────┐
│ SI platform = "win32" {                 │
│   executablePath =                      │
│     path.join(                          │
│       config.serverRootPath,            │
│       "ArmaReforgerServer.exe"          │
│     )                                   │
│   updateScriptPath =                    │
│     path.join(                          │
│       config.serverRootPath,            │
│       "update_armar_ds.bat"             │
│     )                                   │
│ }                                       │
│                                         │
│ SI platform = "linux" {                 │
│   executablePath =                      │
│     path.join(                          │
│       config.serverRootPath,            │
│       "ArmaReforgerServer"              │
│     )                                   │
│   updateScriptPath =                    │
│     path.join(                          │
│       config.serverRootPath,            │
│       "update_armar_ds.sh"              │
│     )                                   │
│ }                                       │
└─────────────────────────────────────────┘
```

---

## ✅ SECTION 3: VALIDATION DES BINAIRES

### Fonction Interne: `_validateBinaries(executablePath, updateScriptPath, platform)`

**Objectif:** Valider l'existence des binaires et corriger les permissions sur Linux

**Entrée:**
- `executablePath`: String
- `updateScriptPath`: String
- `platform`: "win32" | "linux"

**Sortie:** Boolean (true = OK + erreurs loggées, false = ERREUR)

**Logique:**

```
┌─────────────────────────────────────────────────────┐
│ VÉRIFICATION 1: Binaire principal existe?           │
├─────────────────────────────────────────────────────┤
│ SI NOT fs.existsSync(executablePath) {              │
│   console.error(                                    │
│     `❌ CRITICAL: Binary not found:                 │
│      ${executablePath}`                             │
│   )                                                 │
│   RETURN false                                      │
│ }                                                   │
│ SINON {                                             │
│   console.log(`✅ Binary found: ${executablePath}`)│
│ }                                                   │
└─────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│ VÉRIFICATION 2: Script MAJ existe?                  │
├─────────────────────────────────────────────────────┤
│ SI NOT fs.existsSync(updateScriptPath) {            │
│   console.warn(                                     │
│     `⚠️  Update script not found:                   │
│      ${updateScriptPath}`                           │
│   )                                                 │
│   ⚠️  WARNING seulement, pas CRITICAL               │
│ }                                                   │
│ SINON {                                             │
│   console.log(`✅ Update script: ${updateScriptPath}`)│
│ }                                                   │
└─────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│ VÉRIFICATION 3: Permissions Linux                   │
├─────────────────────────────────────────────────────┤
│ SI platform = "linux" {                             │
│   Appeler _ensureExecutablePermissions()            │
│   // Gère chmod +x automatiquement                  │
│ }                                                   │
└─────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│ RETOURNER true si binaire principal OK              │
└─────────────────────────────────────────────────────┘
```

### Fonction Interne: `_ensureExecutablePermissions(executablePath)` [Linux Only]

**Objectif:** Appliquer chmod +x sur les binaires Linux s'ils ne sont pas exécutables

**Entrée:** `executablePath`: String

**Logique:**

```
┌────────────────────────────────────────┐
│ SI fichier existe {                    │
│   Lire stats actuelles:                │
│   fs.statSync(executablePath)          │
│                                        │
│   SI (mode & 0o111) === 0 {            │
│     // N'est pas exécutable              │
│     fs.chmodSync(executablePath, 0o755)│
│     console.log(`✅ chmod +x applied`) │
│   }                                    │
│   SINON {                              │
│     console.log(`✅ Already executable`)│
│   }                                    │
│ }                                      │
└────────────────────────────────────────┘
```

---

## 💀 SECTION 4: KILLER PROCESS (Platform-Specific)

### Fonction Interne: `_killProcessWindows(port)`

**Objectif:** Terminer un processus sur un port spécifique (Windows)

**Entrée:** `port`: Number

**Logique:**

```
┌─────────────────────────────────────────────┐
│ 1. Requêter netstat pour port utilisé       │
│    exec('netstat -ano | findstr :${port}')  │
├─────────────────────────────────────────────┤
│ 2. Parser la sortie → Extraire PIDs         │
│    Exemple: "TCP  127.0.0.1:2001  ...  1234"│
│    Extraire: PID = 1234                     │
├─────────────────────────────────────────────┤
│ 3. Pour chaque PID trouvé:                  │
│    exec('taskkill /PID ${pid} /F')          │
├─────────────────────────────────────────────┤
│ 4. Retourner succès/erreur                  │
└─────────────────────────────────────────────┘
```

### Fonction Interne: `_killProcessLinux(port)`

**Objectif:** Terminer un processus sur un port spécifique (Linux)

**Entrée:** `port`: Number

**Logique:**

```
┌─────────────────────────────────────────────┐
│ 1. Requêter lsof pour port utilisé          │
│    exec('lsof -i :${port}')                 │
├─────────────────────────────────────────────┤
│ 2. Parser la sortie → Extraire PIDs         │
│    Exemple: "arma  1234  user  12u IPv4 ..."│
│    Extraire: PID = 1234                     │
├─────────────────────────────────────────────┤
│ 3. Pour chaque PID trouvé:                  │
│    exec('kill -9 ${pid}')                   │
├─────────────────────────────────────────────┤
│ 4. Retourner succès/erreur                  │
└─────────────────────────────────────────────┘
```

---

## 📤 SECTION 5: EXPORTS PUBLIQUES

### Fonction: `init(configFromServer)`

**Objectif:** Initialiser complètement le module au démarrage de server.js

**Entrée:** `configFromServer`: Object
```json
{
  "username": "String",
  "password": "String"
}
```

**Sortie:** void (Prépare le module pour les appels futurs)

**Logique:**

```
┌─────────────────────────────────────────────────────┐
│ ÉTAPE 1: Détecter OS                                │
├─────────────────────────────────────────────────────┤
│ platformDetected = process.platform                 │
│ console.log(`🖥️  Platform: ${platformDetected}`)     │
└─────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│ ÉTAPE 2: Charger config avec priorités              │
├─────────────────────────────────────────────────────┤
│ config = _loadConfigWithPriority()                  │
│ console.log(`✅ Config loaded:                      │
│   serverRootPath: ${config.serverRootPath}`)        │
└─────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│ ÉTAPE 3: Construire chemins complets                │
├─────────────────────────────────────────────────────┤
│ const paths = _constructPaths(                      │
│   config,                                           │
│   platformDetected                                  │
│ )                                                   │
│                                                     │
│ serverRootPath = config.serverRootPath              │
│ executablePath = paths.executablePath               │
│ updateScriptPath = paths.updateScriptPath           │
└─────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│ ÉTAPE 4: Valider binaires (CRITICAL CHECK)          │
├─────────────────────────────────────────────────────┤
│ const valid = _validateBinaries(                    │
│   executablePath,                                   │
│   updateScriptPath,                                 │
│   platformDetected                                  │
│ )                                                   │
│                                                     │
│ SI !valid {                                         │
│   console.error(                                    │
│     `❌ FATAL: Initialization failed. Server won't  │
│      launch. Fix the binary paths and restart.`     │
│   )                                                 │
│   process.exit(1)  ← HARD EXIT                      │
│ }                                                   │
└─────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│ ÉTAPE 5: Marquer comme initialisé                   │
├─────────────────────────────────────────────────────┤
│ isInitialized = true                                │
│ console.log(`✅ osAbstraction ready for platform:   │
│  ${platformDetected}`)                              │
└─────────────────────────────────────────────────────┘
```

---

### Fonction: `getServerExecutable()`

**Objectif:** Retourner le chemin complet au binaire ArmaReforgerServer

**Entrée:** Aucune

**Sortie:** String
```
Windows: "C:\\Arma3DS\\ArmaReforgerServer.exe"
Linux:   "/home/arma/server/ArmaReforgerServer"
```

**Logique:**
```
┌──────────────────────────────┐
│ SI NOT isInitialized {       │
│   throw Error(               │
│     "osAbstraction not init"  │
│   )                          │
│ }                            │
│ RETURN executablePath         │
└──────────────────────────────┘
```

---

### Fonction: `buildLaunchArgs(configPath, port)`

**Objectif:** Construire les arguments adaptés à l'OS pour lancer le serveur

**Entrée:**
- `configPath`: String (chemin vers active_config_${port}.json)
- `port`: Number

**Sortie:** Array<String> (arguments à passer à spawn)

**Logique:**
```
┌────────────────────────────────────────────┐
│ baseArgs = [                               │
│   '-config', configPath,                   │
│   '-port', String(port),                   │
│   '-update'                                │
│ ]                                          │
├────────────────────────────────────────────┤
│ SI platformDetected = "linux" {             │
│   baseArgs.push('-backendlog')              │
│ }                                          │
├────────────────────────────────────────────┤
│ RETURN baseArgs                            │
│                                            │
│ Exemple Windows:                           │
│  ['-config', 'active_config_2001.json',    │
│   '-port', '2001', '-update']              │
│                                            │
│ Exemple Linux:                             │
│  ['-config', 'active_config_2001.json',    │
│   '-port', '2001', '-update', '-backendlog']│
└────────────────────────────────────────────┘
```

---

### Fonction: `getUpdateScript()`

**Objectif:** Retourner le chemin complet au script de mise à jour

**Entrée:** Aucune

**Sortie:** String
```
Windows: "C:\\Arma3DS\\update_armar_ds.bat"
Linux:   "/home/arma/server/update_armar_ds.sh"
```

**Logique:**
```
┌──────────────────────────────┐
│ SI NOT isInitialized {       │
│   throw Error(...)           │
│ }                            │
│ RETURN updateScriptPath       │
└──────────────────────────────┘
```

---

### Fonction: `killProcessByPort(port)`

**Objectif:** Tuer un processus utilisant un port spécifique

**Entrée:** `port`: Number

**Sortie:** Promise<Boolean>
```
true = processus tué
false = non trouvé ou erreur
```

**Logique:**
```
┌───────────────────────────────────────┐
│ SI platformDetected = "win32" {        │
│   RETURN _killProcessWindows(port)    │
│ }                                     │
│                                       │
│ SI platformDetected = "linux" {        │
│   RETURN _killProcessLinux(port)      │
│ }                                     │
│                                       │
│ ELSE {                                │
│   throw Error("Unknown platform")     │
│ }                                     │
└───────────────────────────────────────┘
```

---

### Fonctions Utilitaires:

```
getPlatform()
  └─ RETURN platformDetected  // "win32" ou "linux"

getServerRootPath()
  └─ RETURN serverRootPath    // Pour debug/logs

getConfig()
  └─ RETURN config object     // Pour debug
```

---

## 🔗 INTÉGRATION DANS server.js

### Au Démarrage (AVANT les routes)

```
┌─────────────────────────────────────────────────────┐
│ LIGNE 1-10: Imports standards                        │
├─────────────────────────────────────────────────────┤
│ const path = require('path');                       │
│ const express = require('express');                 │
│ const fs = require('fs');                           │
│ const { spawn, exec } = require('child_process');   │
│ const osAbstraction = require('./osAbstraction');   │
│ // ^ NOUVEAU: Import du module                       │
│                                                     │
│ const app = express();                              │
│ app.use(express.json());                            │
└─────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│ LIGNE 15-30: INITIALISATION OSABSTRACTION          │
├─────────────────────────────────────────────────────┤
│ try {                                               │
│   osAbstraction.init({});                           │
│   console.log(                                      │
│     `✅ Server ready for ${osAbstraction.          │
│      getPlatform()}`                                │
│   );                                                │
│ } catch (err) {                                     │
│   console.error(                                    │
│     `❌ FATAL: ${err.message}`                      │
│   );                                                │
│   process.exit(1);                                  │
│ }                                                   │
└─────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│ LIGNE 35+: Middlewares, routes, ...                 │
│ (Reste inchangé, mais utilise osAbstraction)        │
└─────────────────────────────────────────────────────┘
```

---

### Dans Routes Critiques

#### Route `/api/launch` (Lancement serveur)

```
AVANT:
├─ const proc = spawn('ArmaReforgerServer.exe', args)  ❌
│  (Tightly coupled à Windows)

APRÈS:
├─ const executable = osAbstraction.getServerExecutable()
├─ const args = osAbstraction.buildLaunchArgs(          ✅
│                 configPath, port)
└─ const proc = spawn(executable, args, options)
   (Platform-agnostic, utilise le module)
```

---

#### Route `/api/stop` (Arrêt serveur - Fallback)

```
AVANT:
├─ exec('netstat -ano | findstr :${port}')             ❌
│  (Tightly coupled à Windows)

APRÈS:
├─ TRY {
│   const proc = runningServers[port];
│   if (proc) {
│     process.kill(-proc.pid);
│   }
│ } CATCH {
│   // Fallback: utiliser osAbstraction
│   const killed = await osAbstraction.killProcessByPort(port) ✅
│ }
```

---

#### Route `/api/update-server` (Mise à jour)

```
AVANT:
├─ const UPDATE_SCRIPT = path.join(..., 'update_..bat') ❌
├─ IF !fs.exist(UPDATE_SCRIPT) → 404
├─ exec(...UPDATE_SCRIPT)

APRÈS:
├─ const UPDATE_SCRIPT = osAbstraction.getUpdateScript() ✅
├─ IF !fs.exist(UPDATE_SCRIPT) → 404
├─ exec(...UPDATE_SCRIPT)
   (Reste le même, script vient du module)
```

---

## 📊 DIAGRAMME D'INITIALISATION COMPLET

```
┌─────────────────────────────────────────────────────────────┐
│                 STARTUP server.js                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────▼─────┐
                    │ Require   │
                    │ osAbst... │
                    └────┬─────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐   ┌──────▼──────┐   ┌─────▼──────┐
   │ Detect  │   │ Load config │   │ Validate   │
   │ OS      │   │ (or create) │   │ Binaries   │
   └────┬────┘   └──────┬──────┘   └─────┬──────┘
        │                │                │
        └────────────────┼────────────────┘
                    ┌────▼─────┐
                    │ Init      │
                    │ osAbst    │
                    │ module    │
                    └────┬─────┘
                         │
               ┌─────────▼──────────┐
               │ Express app ready  │
               │ Routes available   │
               │ Listen :3000       │
               └────────────────────┘
```

---

## 📝 RÉSUMÉ STRUCTURAL

```
osAbstraction.js
├─ PRIVÉ: platformDetected, serverRootPath, executablePath, etc.
├─ PRIVÉ: Helpers internes (_kill*, _validate*, _construct*, _load*)
│
└─ EXPORT:
   ├─ init()              ← Appelé 1x au démarrage
   ├─ getServerExecutable()   ← Pour /api/launch
   ├─ buildLaunchArgs()   ← Pour /api/launch
   ├─ getUpdateScript()   ← Pour /api/update-server
   ├─ killProcessByPort() ← Pour /api/stop (fallback)
   └─ getPlatform()       ← Pour logging
```

---

## 🚀 PROCHAINES ÉTAPES

Une fois cette structure logique validée, le code sera implémenté avec:

1. **osAbstraction.js** - Module complet avec toute la logique OS
2. **server.js modifié** - Intégration des appels au module
3. **data/config.json** - Configuration par défaut
4. **Scripts de MAJ** - update_armar_ds.bat et update_armar_ds.sh

---

## ⚠️ POINTS CRITIQUES

- ✅ **Détection OS** au démarrage (une seule fois)
- ✅ **Priorité env vars** > config.json
- ✅ **Hard exit** si binaire manquant (process.exit(1))
- ✅ **chmod +x** automatique sur Linux à l'init
- ✅ **Platform-agnostic** dans server.js
- ✅ **Fallback killProcessByPort** pour /api/stop
