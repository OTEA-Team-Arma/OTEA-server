# Architecture MVC - OTEA v2.3

## Structure Établie

```
js/
├── routes/              # Définition des endpoints
│   ├── index.js        # Agrégateur de routes
│   └── arma-server.routes.js  # Exemple: routes Arma
├── controllers/         # Orchestration (routes → services)
│   └── arma-server.controller.js  # Exemple: contrôleur Arma
├── services/           # Logique métier (SANS HTTP)
│   ├── arma-version.service.js    # ✅ Déjà existant
│   ├── server.service.js          # TODO: Lancer/arrêter
│   ├── update.service.js          # TODO: Mise à jour
│   ├── log.service.js             # TODO: Gestion logs
│   ├── admin.service.js           # TODO: Actions admin
│   └── presets.service.js         # TODO: Gestion presets
├── middleware/         # Middlewares Express
│   ├── auth.middleware.js
│   └── error.middleware.js
├── models/             # Constants, validators, formatters
│   ├── constants.js
│   ├── validators.js
│   └── responses.js
├── utils/              # Utilities
│   └── formatters.js
└── __tests__/          # Tests (TODO)
```

## Pattern de Flux

```
HTTP Request
    ↓
[Route] /api/arma-server/check-updates
    ↓
[Controller] ArmaServerController.checkUpdates()
    ↓
[Service] ArmaVersionService.isUpdateAvailable()
    ↓
[Response] { success: true, data: {...} }
    ↓
HTTP Response
```

## Principes Clés

### 1. Services = Logique Pure (Pas de req/res)
```javascript
// ✅ Service: Pas d'HTTP, juste logique
class ArmaVersionService {
    static async isUpdateAvailable(steamCmdPath) {
        const installed = this.getInstalledVersion();
        const available = await this.getAvailableVersion(steamCmdPath);
        return available > installed;
    }
}

// ✅ Utilisation dans contrôleur
const needsUpdate = await ArmaVersionService.isUpdateAvailable(path);
```

### 2. Contrôleurs = Orchestration
```javascript
// ✅ Contrôleur: Relie routes à services + formatting response
static async checkUpdates(req, res) {
    try {
        const needsUpdate = await ArmaVersionService.isUpdateAvailable(path);
        return res.json(success({ updateAvailable: needsUpdate }));
    } catch (err) {
        return res.status(500).json(error('...', 'ERROR_CODE'));
    }
}
```

### 3. Routes = Définition Clean
```javascript
// ✅ Routes: Juste les endpoints
router.get('/check-updates', (req, res) => 
    ArmaServerController.checkUpdates(req, res)
);
```

## Étapes Suivantes (Phase 2.2)

À Refactoriser:

### 1. server.service.js
Extraire de `server.js`:
- `launchServer()` - Lancer Arma
- `killServer()` - Arrêter Arma
- `detectRunning()` - Détecte si running
- `getServerInfo()` - Info du processus

### 2. update.service.js
Extraire de `server.js`:
- `triggerUpdate()` - Lance SteamCMD
- `checkUpdateProgress()` - Progression
- `verifyUpdate()` - Vérifie succès

### 3. log.service.js  
Améliorer logs existants:
- `sanitizeHeaders()` - Redact sensibles
- `rotateLog()` - Gestion fichiers
- `getLogTail()` - Dernières lignes
- `searchLogs()` - Recherche

### 4. admin.service.js
Contrôles admin:
- `restartServer()`
- `cleanupProcesses()`
- `backupConfig()`
- `getSystemInfo()`

### 5. presets.service.js
Gestion presets:
- `loadPreset()`
- `savePreset()`
- `listPresets()`
- `validatePresetConfig()`

## Integration dans server.js

```javascript
// Avant
const express = require('express');
// ... Routes inline

// Après
const express = require('express');
const { setupRoutes } = require('./routes');
const { authMiddleware } = require('./middleware/auth.middleware');
const { errorMiddleware } = require('./middleware/error.middleware');

const app = express();

// Middleware
app.use(helmet());
app.use(rateLimiter);
app.use(authMiddleware);

// Routes
setupRoutes(app);

// Error handling (DOIT être dernier)
app.use(errorMiddleware);
```

## Exemple: Ajouter une Nouvelle Route

### Étape 1: Controller
```javascript
// js/controllers/logs.controller.js
static async getLogs(req, res) {
    const lines = req.query.lines || 50;
    const logs = LogService.getTail(lines);
    return res.json(success(logs));
}
```

### Étape 2: Route
```javascript
// js/routes/logs.routes.js
router.get('/', (req, res) => LogController.getLogs(req, res));
```

### Étape 3: Intégrer
```javascript
// js/routes/index.js
app.use('/api/logs', logsRoutes);
```

## Avantages de Cette Architecture

✅ **Séparation des préoccupations** - Chaque couche a rôle clair
✅ **Testabilité** - Services sans HTTP = faciles à tester
✅ **Maintenabilité** - Code organisé, logique centralisée
✅ **Réutilisabilité** - Services utilisables partout
✅ **Scalabilité** - Facile d'ajouter features
✅ **Debugging** - Erreurs isolées par couche

## Notes Importantes

- **Services = Logique métier** (fonctionne sans Express)
- **Controllers = HTTP orchestration** (req/res handling)
- **Routes = Définition endpoints** (URL mapping)
- **Middleware = Exécution globale** (auth, logging, errors)
- **Models = Constants & validators** (réutilisable)

---

**Prochaine étape:** Extraire les services existants (server.js → server.service.js, etc.)
