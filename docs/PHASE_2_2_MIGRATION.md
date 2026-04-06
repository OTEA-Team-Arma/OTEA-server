# Phase 2.2 - Guide d'Extraction des Services

## Objectif
Convertir la logique de `server.js` en services réutilisables et testables.

## Services à Créer

### 1. ArmaServerService ⚠️ PRIORITAIRE
**Fichier:** `js/services/arma-server.service.js`

**Extraire de server.js:**
- Logique de lancement (`spawn`, `nssm start`, etc.)
- Détection de processus
- Récupération d'infos serveur

```javascript
class ArmaServerService {
    /**
     * Lance le serveur Arma
     * @param {string} configPath - Chemin config.json
     * @returns {number} PID du processus
     */
    static async start(configPath) {
        // Logique existante dans server.js route POST /api/update-server
    }

    /**
     * Arrête le serveur
     * @returns {boolean} Succès
     */
    static async stop() {
        // Utiliser process.kill(), nssm stop, etc.
    }

    /**
     * Détecte si serveur est running
     * @returns {boolean}
     */
    static isRunning() {
        // Chercher processus Arma
    }

    /**
     * Info du serveur
     * @returns {Object} {running, pid, uptime, ...}
     */
    static async getInfo() {
        // Stats du serveur
    }
}
```

### 2. UpdateService ⚠️ PRIORITAIRE
**Fichier:** `js/services/update.service.js`

**Extraire de server.js:**
- Exécution SteamCMD
- Parsing output
- Gestion erreurs

```javascript
class UpdateService {
    /**
     * Déclenche mise à jour
     * @param {string} steamCmdPath
     * @param {string} armaPath - Répertoire serveur
     */
    static async triggerUpdate(steamCmdPath, armaPath) {
        const { exec } = require('child_process');
        // Logique existante route POST /api/update-server
    }

    /**
     * Exécute SteamCMD avec retry
     */
    static async executeSteamCmd(cmd, steamCmdPath) {
        // exec() dans promesse
    }

    /**
     * Parse buildid de output SteamCMD
     */
    static parseBuildId(output) {
        // Regex pour extraire version
    }
}
```

### 3. LogService
**Fichier:** `js/services/log.service.js`

**À améliorer:**
- Récupérer N dernières lignes
- Rechercher dans logs
- Vérifier rotation

```javascript
class LogService {
    /**
     * Dernières N lignes
     */
    static getTail(filePath, lines = 50) {
        // Lire fichier, retourner dernières lignes
    }

    /**
     * Recherche dans logs
     */
    static search(filePath, pattern) {
        // Grep-like search
    }

    /**
     * Nettoie ancien logs
     */
    static archive(filePath, maxDays = 30) {
        // Supprimer logs > 30 jours
    }
}
```

### 4. AdminService
**Fichier:** `js/services/admin.service.js`

**Nouvelles fonctions admin:**
- Redémarrage
- Cleanup processus fantômes
- Backup config
- System info

```javascript
class AdminService {
    /**
     * Redémarre le serveur
     */
    static async restartServer() {
        await ArmaServerService.stop();
        await new Promise(r => setTimeout(r, 2000));
        await ArmaServerService.start();
    }

    /**
     * Tue processus orphelins
     */
    static async cleanupProcesses() {
        // Process cleanup
    }

    /**
     * Backup config.json
     */
    static async backupConfig() {
        // Copy config.json → config.backup.timestamp.json
    }
}
```

### 5. PresetsService
**Fichier:** `js/services/presets.service.js`

**Gestion presets:**
- Load/save presets
- Validation
- Listing

```javascript
class PresetsService {
    /**
     * Charge preset
     */
    static async loadPreset(presetPath) {
        // JSON.parse + validate
    }

    /**
     * Sauvegarde preset
     */
    static async savePreset(name, config) {
        // Validate + JSON.stringify
    }

    /**
     * Liste tous presets
     */
    static listPresets() {
        // Lire dossier presets/
    }
}
```

## Étapes de Migration

### Étape 1: Créer le Service
```bash
# Créer js/services/arma-server.service.js
# Copier la logique existante de server.js
# Ajouter jsdoc comments
# ✅ Tester service seul (console.log)
```

### Étape 2: Créer le Controller
```bash
# Créer js/controllers/arma-server.controller.js
# Importer le service
# Orchestrer: service + response format
# ✅ Tester endpoints
```

### Étape 3: Créer les Routes
```bash
# Créer js/routes/arma-server.routes.js
# Ajouter endpoints
# Mapper vers controllers
# ✅ Tester routes
```

### Étape 4: Intégrer dans server.js
```javascript
// Avant
app.post('/api/update-server', async (req, res) => {
    // 200 lignes de logique directe
});

// Après
const { setupRoutes } = require('./routes');
setupRoutes(app);
```

### Étape 5: Nettoyer server.js
- Supprimer les routes inline
- Garder juste: middleware setup + setupRoutes()
- Réduire de 300+ lignes à ~50

## Checklist de Qualité

Avant de commiter un service:
- ✅ Pas de `req/res` dans le service
- ✅ JSDoc comments sur toutes méthodes
- ✅ Error handling (try/catch ou throw)
- ✅ Valider inputs (validatePort, etc.)
- ✅ Valeur retour cohérent
- ✅ Réutilisable dans d'autres contextes
- ✅ Tests unitaires idéals (si temps)

## Estimation Temps

- ArmaServerService: 2-3h (cœur du système)
- UpdateService: 2h (SteamCMD parsing)
- LogService: 1h (amélioration)
- AdminService: 1.5h (quelques foncts)
- PresetsService: 1.5h (i/o presets)
- Routes/Controllers: 2h (orchestration)
- **Total Phase 2.2: ~10-11 heures** (peut être fait par parties)

## Format Service Standard

```javascript
/**
 * nom.service.js
 * Description rapide du service
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * MyService - Gère XXX
 */
class MyService {
    /**
     * Ma première fonction
     * @param {string} param1 - Description
     * @returns {Promise<any>} Description
     * @throws {Error} Si XXX
     */
    static async myFunction(param1) {
        try {
            // Logique
            return result;
        } catch (error) {
            console.error('MyService error:', error);
            throw new Error(`MyService failed: ${error.message}`);
        }
    }
}

module.exports = MyService;
```

## Prochaines Actions

1. **Courte terme (1-2h):** Créer ArmaServerService + ArmaServerController + routes
2. **Moyen terme (2-3h):** UpdateService, LogService
3. **Intégration (1h):** Nettoyer server.js, tester ensemble
4. **Phase 3:** JWT Auth, Database layer (v3.0)

---

**Status:** Phase 2.1 ✅ Terminée (structure + models + middleware)
**Current:** Phase 2.2 🔄 En cours (services extraction)
**Next:** Phase 2.3 🔲 Routes/Controllers (sera rapide suite à 2.2)
