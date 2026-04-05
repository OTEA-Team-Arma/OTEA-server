# 📚 OTEA-server Cross-Platform: Index Documentation

Bienvenue! Voici votre guide de navigation pour la transformation cross-platform complète d'OTEA-server.

---

## 🎯 Commencer par Ici

| Document | Objectif | Lire si... |
|----------|----------|-----------|
| **[README_CHANGES.md](README_CHANGES.md)** | Vue d'ensemble des changements | Vous êtes nouveau et voulez comprendre **quoi** a changé |
| **[README_osAbstraction.md](README_osAbstraction.md)** | Architecture logique du module | Vous voulez comprendre **comment** ça marche techniquement |
| **[README_DEPLOYMENT.md](README_DEPLOYMENT.md)** | Déploiement pas-à-pas | Vous êtes prêt à **installer et déployer** |

---

## 📂 Fichiers Créés/Modifiés

### Nouveaux Fichiers

```
js/
└── osAbstraction.js                    Module core cross-platform (~420 lignes)

data/
└── config.json                         ✏️ Ajout params système

update_armar_ds.bat                     Template script mise à jour Windows
update_armar_ds.sh                      Template script mise à jour Linux

installation/windows/update_armar_ds.bat    Version installation Windows
installation/linux/update_armar_ds.sh       Version installation Linux

README_osAbstraction.md                 Documentation logique (706 lignes)
README_DEPLOYMENT.md                    Guide déploiement Win/Linux
README_CHANGES.md                       Résumé changements
```

### Fichiers Modifiés

```
js/server.js                            ✏️ Intégration osAbstraction (~50 lignes ajoutées)
data/config.json                        ✏️ Ajout params système
```

---

## 🚀 Quickstart

### 🪟 Windows

```powershell
# 1. Installer le binaire
C:\SteamCMD\steamcmd.exe +login anonymous +app_update 1874900 -beta -dir "C:\Arma3DS" +quit

# 2. Configurer (optionnel si config.json déjà OK)
# Éditer data/config.json avec serverRootPath = "C:\\Arma3DS"

# 3. Lancer
cd C:\path\to\OTEA-server
npm install
node js/server.js

# Résultat:
# ✅ OTEA-server is ready!
# 📊 Platform: win32
# 📁 Server root: C:\Arma3DS
```

### 🐧 Linux

```bash
# 1. Installer le binaire
mkdir -p /home/arma/server
/usr/bin/steamcmd +login anonymous +app_update 1874900 -beta -dir "/home/arma/server" +quit
chmod +x /home/arma/server/ArmaReforgerServer

# 2. Configurer (optionnel si config.json déjà OK)
# Éditer data/config.json avec serverRootPath = "/home/arma/server"

# 3. Lancer
cd /path/to/OTEA-server
npm install
node js/server.js

# Résultat:
# ✅ OTEA-server is ready!
# 📊 Platform: linux
# 📁 Server root: /home/arma/server
```

---

## 📖 Guides Complets

### Pour Développeurs

1. **[README_osAbstraction.md](README_osAbstraction.md)** - Comprendre le module
   - Structure interne
   - Chaque fonction
   - Logique décision
   - Diagrammes d'initialisation

2. **[js/osAbstraction.js](js/osAbstraction.js)** - Code commenté
   - Sections claires
   - Logique étape-par-étape
   - Gestion erreurs

### Pour DevOps/Sysadmin

1. **[README_DEPLOYMENT.md](README_DEPLOYMENT.md)** - Déploiement complet
   - Windows step-by-step
   - Linux step-by-step
   - Variables d'environnement
   - Dépannage
   - Scripts automatisés

2. **[data/config.json](data/config.json)** - Configuration système
   - Paramètres OS
   - Priorités
   - Exemples

### Pour Ingénieurs

1. **[README_CHANGES.md](README_CHANGES.md)** - Vue d'ensemble
   - Quoi a changé
   - Avant/après
   - Tests recommandés

2. **[js/server.js](js/server.js)** - Code modifié
   - Voir les changements
   - Intégration osAbstraction
   - Routes modifiées

---

## 🔍 Rechercher par Sujet

### "Comment configurer..."

| Sujet | Document | Section |
|-------|----------|---------|
| ...le chemin du serveur Arma? | [README_DEPLOYMENT.md](README_DEPLOYMENT.md) | Configurer OTEA-server |
| ...les variables d'environnement? | [README_DEPLOYMENT.md](README_DEPLOYMENT.md) | Variable d'Environnement vs config.json |
| ...la mise à jour automatique? | [README_DEPLOYMENT.md](README_DEPLOYMENT.md) | Configurer la Mise à Jour via Script |
| ...le script de mise à jour? | [update_armar_ds.bat](update_armar_ds.bat) / [update_armar_ds.sh](update_armar_ds.sh) | Templates |

### "Comment déployer sur..."

| Plateforme | Document | Section |
|------------|----------|---------|
| Windows | [README_DEPLOYMENT.md](README_DEPLOYMENT.md) | DÉPLOIEMENT WINDOWS |
| Linux (Ubuntu) | [README_DEPLOYMENT.md](README_DEPLOYMENT.md) | DÉPLOIEMENT LINUX (Ubuntu/Debian) |
| Production (env vars) | [README_DEPLOYMENT.md](README_DEPLOYMENT.md) | Variable d'Environnement vs config.json |
| Docker | N/A (Future) | À implémenter |

### "Corriger l'erreur..."

| Erreur | Document | Section |
|--------|----------|---------|
| "Binary not found" | [README_DEPLOYMENT.md](README_DEPLOYMENT.md) | Dépannage |
| "permission denied" (Linux) | [README_DEPLOYMENT.md](README_DEPLOYMENT.md) | Dépannage |
| "command not found" | [README_DEPLOYMENT.md](README_DEPLOYMENT.md) | Dépannage |

---

## 🔧 Architecture Overview

```
OTEA-server (100% Cross-Platform)
│
├─ js/server.js
│  └─ Utilise osAbstraction pour tout ce qui est OS-spécifique
│
├─ js/osAbstraction.js (NEW)
│  ├─ init()                    ← Appelé au démarrage
│  ├─ getServerExecutable()     ← Utilisé par /api/launch
│  ├─ buildLaunchArgs()         ← Utilisé par /api/launch
│  ├─ getUpdateScript()         ← Utilisé par /api/update-server
│  └─ killProcessByPort()       ← Utilisé par /api/stop (fallback)
│
├─ data/config.json (UPDATED)
│  ├─ serverRootPath            ← À configurer
│  ├─ steamCmdPath              ← À configurer
│  └─ Autres params système
│
├─ update_armar_ds.bat          ← Template Windows
├─ update_armar_ds.sh           ← Template Linux
│
└─ Presets/*.json               ← Inchangé (configuration missions)
```

---

## ⚙️ Système de Détection & Configuration

```
┌─ Démarrage server.js
│
├─ osAbstraction.init()
│  │
│  ├─ Détecter OS (process.platform)
│  │  ├─ Windows: "win32"
│  │  └─ Linux: "linux"
│  │
│  ├─ Charger config avec PRIORITÉS
│  │  ├─ 1️⃣ Variables d'env (ARMA_SERVER_ROOT, STEAMCMD_PATH, etc.)
│  │  ├─ 2️⃣ data/config.json
│  │  └─ 3️⃣ Defaults (C:\Arma3DS ou /home/arma/server)
│  │
│  ├─ Construire chemins
│  │  ├─ Windows: ${serverRootPath}\ArmaReforgerServer.exe
│  │  └─ Linux: ${serverRootPath}/ArmaReforgerServer
│  │
│  ├─ Valider binaires
│  │  ├─ ✅ OK → Continue
│  │  ❌ FAIL → process.exit(1) (HARD EXIT)
│  │
│  └─ Initialisation terminée ✅
│
└─ Routes prêtes pour /api/launch, /api/stop, etc.
```

---

## 📊 Quick Reference

### osAbstraction.js - API Publique

```javascript
// Initialization (appelé 1x au démarrage)
osAbstraction.init({})

// Getters simples
osAbstraction.getPlatform()           // "win32" ou "linux"
osAbstraction.getServerRootPath()     // "/home/arma/server" ou "C:\Arma3DS"

// Pour le lancement serveur
executable = osAbstraction.getServerExecutable()
args = osAbstraction.buildLaunchArgs(configPath, port)
spawn(executable, args)

// Pour la mise à jour
updateScript = osAbstraction.getUpdateScript()
exec(updateScript)

// Pour arrêter un processus (fallback)
killed = await osAbstraction.killProcessByPort(port)
```

### Priorités de Configuration

```
1. ARMA_SERVER_ROOT (env var) OVERRIDE tout
2. data/config.json → serverRootPath
3. Défaut Windows: "C:\Arma3DS"
4. Défaut Linux: "/home/arma/server"
```

### Logs de Démarrage Attendus

```
✅ Démarrage réussit:
[osAbstraction] 🖥️  Platform detected: win32|linux
[osAbstraction] ✅ Binary found: C:\Arma3DS\ArmaReforgerServer.exe
[osAbstraction] ✅ osAbstraction ready for win32|linux
✅ OTEA-server is ready!

❌ Arrêt fatal:
[osAbstraction] ❌ CRITICAL: Binary not found
process.exit(1)
```

---

## 🎓 Ressources Additionnelles

### Comprendre le Code

- [osAbstraction.js](js/osAbstraction.js) - Code source commenté (~420 lignes)
- [server.js](js/server.js) - Modifications visibles (~50 lignes ajoutées)

### Tester

- Voir section "Tests Recommandés" dans [README_DEPLOYMENT.md](README_DEPLOYMENT.md)

### Déployer

- Suivre exactement [README_DEPLOYMENT.md](README_DEPLOYMENT.md)

---

## ❓ FAQ Rapide

**Q: Peut-on utiliser Windows ET Linux en même temps?**
A: Non, mais la MÊME codebase marche sur les deux! ✅

**Q: Faut-il modifier le code pour déployer sur Linux?**
A: Non, zéro changement de code! Juste configurer `serverRootPath` différent.

**Q: Quel ordre de priorité pour la configuration?**
A: Env vars > config.json > defaults

**Q: Que faire si le binaire Arma n'existe pas?**
A: Le serveur EXIT immédiatement avec un message d'erreur FATAL. À installer via SteamCMD d'abord.

**Q: Les presets changent?**
A: Non! Les fichiers presets/*.json restent inchangés.

**Q: L'API change?**
A: Non! Les endpoints REST restent identiques.

---

## ✅ Checklist Migration

- [ ] Lire [README_CHANGES.md](README_CHANGES.md)
- [ ] Comprendre [README_osAbstraction.md](README_osAbstraction.md)
- [ ] Configurer data/config.json avec serverRootPath
- [ ] Installer binaire Arma Reforger Server
- [ ] Tester sur Windows (`node js/server.js`)
- [ ] Tester sur Linux (option)
- [ ] Supprimer les anciens scripts hardcoded (si existants)
- [ ] Déployer en production!

---

**Vous êtes prêt! Commencez par [README_DEPLOYMENT.md](README_DEPLOYMENT.md). 🚀**
