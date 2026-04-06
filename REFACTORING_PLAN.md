# 🔄 OTEA Refactoring Plan v2.2 - v3.0

**Dernière mise à jour:** 6 avril 2026  
**Status:** En planification  
**Objectif:** Transformer OTEA de "deux gros fichiers" à architecture pro scalable

---

## 📋 TABLE OF CONTENTS

1. [Phase 1 - Court terme (Avant refactorisation)](#phase-1-court-terme)
2. [Phase 2 - Moyen terme (Refactorisation)](#phase-2-moyen-terme)
3. [Phase 3 - Long terme (v3.0+)](#phase-3-long-terme)
4. [Nouvelles Features](#nouvelles-features)
5. [Timeline estimée](#timeline)

---

## PHASE 1: Court Terme (v2.1+ → v2.2)
**Durée:** 1-2 semaines  
**Avant:** Avant de restructurer le code  
**Objectif:** Consolider base + ajouter features manquantes

### ✅ Task 1.1: Code Quality Setup
- [ ] Installer ESLint + Prettier
- [ ] Créer `.eslintrc.json`
- [ ] Ajouter scripts npm: `lint`, `format`, `test`
- [ ] Linter tous les fichiers existants
- **Fichiers affectés:** `package.json`, `.eslintrc.json`
- **Effort:** 30 min
- **Priorité:** 🟢 Haute

### ✅ Task 1.2: Environment Configuration
- [ ] Créer `.env.example` avec toutes les vars
- [ ] Charger `.env` avec dotenv package
- [ ] Valider vars d'env au startup
- [ ] Documenter dans docs/ENV.md
- **Fichiers affectés:** `js/server.js`, `.env.example`, `docs/ENV.md`
- **Effort:** 45 min
- **Priorité:** 🟢 Haute

```javascript
// .env vars à supporter:
NODE_ENV=production
OTEA_PORT=3000
OTEA_HOST=127.0.0.1        // localhost par défaut!
ARMA_SERVER_ROOT=/path/to/server
STEAMCMD_PATH=/path/to/steamcmd
AUTH_PASSWORD=defaultPass123
LOG_LEVEL=info
```

### ✅ Task 1.3: Arma Server Update Detection
- [ ] Créer `services/arma-version.service.js`
- [ ] Implémenter détection version via SteamCMD
- [ ] Implémenter détection version via binaire
- [ ] Stocker version dans fichier (JSON)
- [ ] Endpoint `/api/arma-server/version-check` (compare installé vs dispo)
- [ ] UI: Afficher bouton "Mise à jour disponible" en rouge
- **Fichiers affectés:** 
  - `js/server.js` (ajouter endpoint)
  - `js/app.js` (UI pour alerter)
  - `index.html` (badge/alerte version)
  - NEW: `js/services/arma-version.service.js`
- **Effort:** 2-3 heures
- **Priorité:** 🟡 Moyenne
- **Documentation:** `docs/ARMA_VERSION_DETECTION.md`

**Implémentation détails (voir section [Arma Update Detection](#arma-update-detection) plus bas)**

### ✅ Task 1.4: Rate Limiting sur Auth
- [ ] Installer `express-rate-limit`
- [ ] Max 5 tentatives login / 15 min
- [ ] Implémenter sur `/api/login` et tous endpoints auth
- [ ] Logguer les tentatives échouées
- **Fichiers affectés:** `js/server.js`
- **Effort:** 45 min
- **Priorité:** 🟠 Moyenne (sécurité)

### ✅ Task 1.5: Helmet Security Headers
- [ ] Installer `helmet`
- [ ] Ajouter au middleware Express
- [ ] Documente dans `docs/SECURITY_HEADERS.md`
- **Fichiers affectés:** `js/server.js`, `package.json`
- **Effort:** 20 min
- **Priorité:** 🟠 Moyenne

### ✅ Task 1.6: Testing Setup (Optional for v2.1)
- [ ] Installer Jest + SuperTest
- [ ] Créer exemple test service
- [ ] CI/CD consideration
- **Effort:** 1 heure (optional)
- **Priorité:** 🔵 Basse

**Total Phase 1:** ~6-7 heures

---

## PHASE 2: Moyen Terme (v2.2 → v2.5)
**Durée:** 3-4 semaines  
**Objectif:** REFACTORISER code en architecture MVC moderne  
**Dependencies:** Phase 1 terminée

### 🏗️ Task 2.1: Create Directory Structure

```
js/
├── osAbstraction.js          (keep as is)
├── server.js                 (renommer → index.js, make LEAN!)
├── routes/
│   ├── index.js              (aggregate all routes)
│   ├── servers.routes.js     (launch, kill, list, restart)
│   ├── admin.routes.js       (logs cleanup, OTEA restart)
│   ├── logs.routes.js        (get admin log, get arma log)
│   ├── updates.routes.js     (check version, trigger update)
│   └── health.routes.js      (status, info)
├── controllers/
│   ├── servers.controller.js
│   ├── admin.controller.js
│   ├── logs.controller.js    (NEW)
│   ├── updates.controller.js (NEW)
│   └── health.controller.js
├── services/
│   ├── server.service.js     (launch, kill, detect logic)
│   ├── log.service.js        (existing, improve)
│   ├── update.service.js     (execute steamcmd)
│   ├── arma-version.service.js (NEW - version detection)
│   └── auth.service.js       (validate credentials)
├── middleware/
│   ├── auth.middleware.js    (basic auth, rate limiting)
│   ├── error.middleware.js   (centralized error handling)
│   └── logger.middleware.js  (request logging)
├── models/
│   ├── validators.js         (input validation)
│   ├── responses.js          (response formatting)
│   └── constants.js          (APP_ID, defaults)
├── utils/
│   ├── formatters.js         (date, JSON, errors)
│   └── helpers.js            (misc utilities)
└── __tests__/
    ├── servers.service.test.js
    ├── update.service.test.js
    └── routes.integration.test.js
```

- [ ] Créer dossiers et fichiers de structure
- **Effort:** 1 heure
- **Priorité:** 🟢 Haute

### 🔄 Task 2.2: Extract Services (Non-HTTP Logic)

**2.2a: server.service.js** (Launch Arma servers logic)
```javascript
// Seulement la logique métier, pas d'Express!
async function launch(config) {}
async function kill(pid) {}
async function detect() {}
async function getStatus(pid) {}
```
- [ ] Extraire logique de launch de server.js
- [ ] Tester indépendamment
- **Effort:** 2 heures

**2.2b: update.service.js** (SteamCMD execution)
```javascript
async function executeUpdate(steamCmdPath, serverId) {}
```
- [ ] Extraire exec du update script
- [ ] Passer STEAMCMD_PATH depuis config
- **Effort:** 1 heure

**2.2c: log.service.js** (Improve existing)
```javascript
async function sanitizeHeaders(headers) {}
async function rotateIfNeeded() {}
async function getAdminLog() {}
async function getArmaLog() {}
```
- [ ] Consolider logique existante
- **Effort:** 1 heure

**2.2d: arma-version.service.js** (NEW - Version detection)
```javascript
async function detectInstalledVersion() {}
async function detectAvailableVersion() {}
async function hasUpdate() {}
```
- [ ] Implémenter détection version (cf Phase 1.3)
- **Effort:** 2 heures

**2.2e: auth.service.js** (Authentication)
```javascript
function validateCredentials(username, password) {}
function checkRateLimit(ip) {}
```
- [ ] Extraire logique auth
- **Effort:** 1 heure

**Total 2.2:** ~7 heures

### 🎮 Task 2.3: Create Controllers

Chaque controller = orchestrateur entre request HTTP et service métier

**2.3a: servers.controller.js**
```javascript
async function launchServer(req, res, next) {
    try {
        const result = await serverService.launch(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
}
```
- [ ] Créer launch, kill, list, restart
- **Effort:** 2 heures

**2.3b: admin.controller.js**
```javascript
async function cleanupLogs(req, res, next) {}
async function restartOTEA(req, res, next) {}
```
- [ ] Créer endpoints admin
- **Effort:** 1 heure

**2.3c: logs.controller.js** (NEW)
```javascript
async function getAdminLog(req, res, next) {}
async function getArmaLog(req, res, next) {}
```
- [ ] Extraire logique logs actuels
- **Effort:** 1 heure

**2.3d: updates.controller.js** (NEW)
```javascript
async function checkVersion(req, res, next) {}
async function triggerUpdate(req, res, next) {}
```
- [ ] Orchestrer update service
- **Effort:** 1 heure

**Total 2.3:** ~5 heures

### 🛣️ Task 2.4: Create Routes

Chaque route file = URLs + middleware aurait → controller

```javascript
// routes/servers.routes.js
router.post('/launch', auth, servers.controller.launch);
router.post('/kill', auth, servers.controller.kill);
router.get('/list', auth, servers.controller.list);
```

- [ ] Créer servers.routes.js
- [ ] Créer admin.routes.js
- [ ] Créer logs.routes.js (NEW)
- [ ] Créer updates.routes.js (NEW)
- [ ] Créer health.routes.js
- [ ] Créer routes/index.js (aggregate)
- **Total effort:** 3 heures

### 🛡️ Task 2.5: Middlewares & Error Handling

- [ ] `auth.middleware.js` - Basic auth + rate limiting
- [ ] `error.middleware.js` - Centralized error catch
- [ ] `logger.middleware.js` - Request logging
- **Total effort:** 2 heures

### ✔️ Task 2.6: Input Validation & Models

- [ ] Créer `models/validators.js` (validateLaunchRequest, etc)
- [ ] Créer `models/constants.js` (APP_ID, defaults)
- [ ] Créer `models/responses.js` (response formatting)
- **Total effort:** 2 heures

### 🧪 Task 2.7: Update server.js (NOW MINIMAL!)

```javascript
require('dotenv').config();
const express = require('express');
const routes = require('./routes');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();
app.use(express.json());
app.use(authMiddleware);
app.use(routes);  // ← All routes here
app.use(errorMiddleware);

const PORT = process.env.OTEA_PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
```

- [ ] Refactor server.js → become entry point only (~50 lines!)
- **Total effort:** 1 heure

### 📝 Task 2.8: Documentation for new structure

- [ ] Créer `docs/ARCHITECTURE.md` (explain structure)
- [ ] Créer `docs/API_ENDPOINTS.md` (all endpoints documented)
- [ ] Créer `docs/SERVICE_LAYER.md` (how to add new service)
- [ ] Update README.md (new structure)
- **Total effort:** 2 heures

### 🧪 Task 2.9: Unit Tests

- [ ] Test server.service.js (launch, kill, detect)
- [ ] Test update.service.js (version detection)
- [ ] Test validators.js (input validation)
- Minimum: 80% coverage on services
- **Total effort:** 4-5 heures (optional for v2.2)

**Total Phase 2:** ~27-30 heures (peut être split en v2.2 / v2.3 / v2.4)

---

## PHASE 3: Long Terme (v3.0+)
**Durée:** 2-3 mois  
**Objectif:** Database, advanced auth, scaling

### Task 3.1: Database Layer
- [ ] Replace JSON files with SQLite (lightweight)
- [ ] Models: Server configs, users, audit logs, version history
- [ ] Migration scripts
- **Effort:** 10-15 heures
- **Tools:** sqlite3, Sequelize or Drizzle ORM

### Task 3.2: Advanced Authentication
- [ ] JWT tokens (replace Basic Auth)
- [ ] Token refresh mechanism
- [ ] Multiple users + roles (admin, viewer, operator)
- [ ] 2FA support (TOTP)
- **Effort:** 8-10 heures

### Task 3.3: API Versioning
- [ ] `/api/v1/*, /api/v2/*` structure
- [ ] Deprecation warnings
- [ ] Changelog by version
- **Effort:** 4 heures

### Task 3.4: Advanced Monitoring
- [ ] Prometheus metrics endpoint
- [ ] Health checks + alerts
- [ ] Performance tracking
- [ ] Error rate monitoring
- **Effort:** 6-8 heures

### Task 3.5: Deployment Automation
- [ ] GitHub Actions CI/CD
- [ ] Docker image build/push
- [ ] Automated testing on push
- [ ] Auto-deployment to staging
- **Effort:** 6-8 heures

---

## 🆕 NOUVELLES FEATURES

### Arma Update Detection
**Feature:** Détecter auto si mise à jour Arma dispo, notifier admin

#### Implémentation - Phase 1.3

**FILE: `js/services/arma-version.service.js`**
```javascript
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Get version installed locally
 * @returns {string} Version number or 'Unknown'
 */
async function getInstalledVersion() {
    return new Promise((resolve) => {
        const versionFile = path.join(__dirname, '..', '..', 'data', 'arma_version.json');
        
        try {
            if (fs.existsSync(versionFile)) {
                const data = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
                resolve(data.version || 'Unknown');
            } else {
                resolve('Unknown');
            }
        } catch {
            resolve('Unknown');
        }
    });
}

/**
 * Check available version from Steam
 * Uses SteamCMD to query latest build
 * @param {string} steamCmdPath - Path to steamcmd executable
 * @returns {string} Latest version or 'Unknown'
 */
async function getAvailableVersion(steamCmdPath) {
    return new Promise((resolve) => {
        if (!steamCmdPath) {
            resolve('Unknown');
            return;
        }

        // Query SteamCMD for app info
        const cmd = `"${steamCmdPath}" +login anonymous +app_info_update 1 +app_info_print 1874900 +quit`;
        
        exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
            try {
                if (error) {
                    console.warn('[arma-version] SteamCMD query failed:', error.message);
                    resolve('Unknown');
                    return;
                }

                // Parse buildid from SteamCMD output
                // Output format: ... "buildid" "12345" ...
                const match = stdout.match(/"buildid"\s+"(\d+)"/);
                if (match && match[1]) {
                    resolve(`Build ${match[1]}`);
                } else {
                    resolve('Unknown');
                }
            } catch {
                resolve('Unknown');
            }
        });
    });
}

/**
 * Check if update is available
 * @returns {boolean} True if newer version available
 */
async function isUpdateAvailable(steamCmdPath) {
    const installed = await getInstalledVersion();
    const available = await getAvailableVersion(steamCmdPath);
    
    // Simple comparison: if versions different → update available
    return installed !== available && available !== 'Unknown';
}

/**
 * Save version after successful update
 * Called after SteamCMD finishes
 * @param {string} version - Version to save
 */
async function saveVersion(version) {
    const versionFile = path.join(__dirname, '..', '..', 'data', 'arma_version.json');
    const data = {
        version,
        lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(versionFile, JSON.stringify(data, null, 2));
}

module.exports = {
    getInstalledVersion,
    getAvailableVersion,
    isUpdateAvailable,
    saveVersion
};
```

**UPDATE: `js/server.js`** - Add new endpoints

```javascript
const armaVersionService = require('./services/arma-version.service');

// NEW ENDPOINT: Check for Arma updates
app.get('/api/arma-server/check-updates', authMiddleware, async (req, res) => {
    try {
        const config = osAbstraction.getConfig();
        const installed = await armaVersionService.getInstalledVersion();
        const available = await armaVersionService.getAvailableVersion(config.steamCmdPath);
        const updateAvailable = await armaVersionService.isUpdateAvailable(config.steamCmdPath);
        
        logAdmin('check-updates', req.user?.name || 'inconnu', { installed, available });
        
        res.json({
            installed,
            available,
            updateAvailable,
            updateUrl: '/api/update-server'  // Hint to frontend
        });
    } catch (err) {
        logAdmin('check-updates-error', req.user?.name || 'inconnu', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// MODIFY EXISTING: After successful update, save version
// In /api/update-server endpoint, after successful update:
// await armaVersionService.saveVersion('Build 12345');
```

**UPDATE: `js/app.js`** - Add UI for version check

```javascript
async function checkArmaUpdates() {
    try {
        const response = await fetch('/api/arma-server/check-updates');
        const data = await response.json();
        
        const updateBadge = document.getElementById('updateBadge');
        if (data.updateAvailable) {
            updateBadge.style.display = 'block';
            updateBadge.innerHTML = `
                <span style="color: red; font-weight: bold;">
                    🔔 Update available: ${data.available}
                    <button onclick="triggerArmaUpdate()">Update Now</button>
                </span>
            `;
            logAdmin('update-available', data.installed, data.available);
        }
    } catch (err) {
        console.error('Failed to check updates:', err);
    }
}

// Run on dashboard load
document.addEventListener('DOMContentLoaded', checkArmaUpdates);

// Auto-check every 1 hour
setInterval(checkArmaUpdates, 3600000);
```

**UPDATE: `index.html`** - Add badge

```html
<div id="updateBadge" style="display: none; 
    background: #fff3cd; 
    border: 1px solid #ffc107; 
    padding: 10px; 
    margin: 10px 0; 
    border-radius: 5px;">
</div>
```

**NEW FILE: `data/arma_version.json`**
```json
{
  "version": "Build 12345",
  "lastUpdated": "2026-04-06T14:30:00Z"
}
```

---

## 📅 TIMELINE

### v2.1 (Current) ✅ DONE
- Security audit complete
- Config protection (.gitignore)
- SteamCMD path injection fixed
- Port 3000 security documented

### v2.2 (Next - 1-2 weeks)
- [ ] Phase 1.1-1.6: Code quality, env config, version detection, rate limiting
- **Target Release:** 2 weeks
- **Breaking Changes:** None (user-transparent)

### v2.3 (Following - 3-4 weeks)
- [ ] Phase 2: REFACTORIZATION
- Split into routes/controllers/services
- **Target Release:** 4 weeks after v2.2
- **Breaking Changes:** None (internal only)

### v2.4-v2.5 (Optional minor releases)
- Additional endpoints, polish, documentation

### v3.0 (Q3 2026 - Future)
- Database layer
- JWT authentication
- Multi-user support with roles
- Advanced monitoring

---

## 📊 EFFORT SUMMARY

| Phase | Component | Hours | Priority |
|-------|-----------|-------|----------|
| 1 | Code Quality | 0.5 | 🟢 |
| 1 | Env Config | 0.75 | 🟢 |
| 1 | Version Detection | 3 | 🟡 |
| 1 | Rate Limiting | 0.75 | 🟠 |
| 1 | Security Headers | 0.33 | 🟠 |
| 1 | Testing | 1 | 🔵 |
| **Phase 1 Total** | **~7 hours** | |
| 2 | Structure | 1 | 🟢 |
| 2 | Services | 7 | 🟢 |
| 2 | Controllers | 5 | 🟢 |
| 2 | Routes | 3 | 🟢 |
| 2 | Middleware | 2 | 🟢 |
| 2 | Models/Validation | 2 | 🟡 |
| 2 | server.js Refactor | 1 | 🟢 |
| 2 | Documentation | 2 | 🟡 |
| 2 | Tests | 5 | 🔵 |
| **Phase 2 Total** | **~30 hours** | |
| **GRAND TOTAL** | **~37 hours** | |

*Note: Can be split across multiple releases*

---

## 🎯 RECOMMENDED EXECUTION

### Week 1-2: Phase 1 (v2.2)
- ESLint + env config (quick wins)
- Version detection (main feature)
- Rate limiting (security)
- **Release:** v2.2 with update detection + security improvements

### Week 3-6: Phase 2 (v2.3-v2.4)
- Services extraction (foundation)
- Controllers (orchestration)
- Routes (endpoints)
- Tests (validation)
- **Release:** v2.3 with refactored architecture (user-facing behavior unchanged)

### Week 7+: Phase 3 (v3.0)
- Database layer
- JWT auth + multi-user
- Advanced monitoring
- **Release:** v3.0 (major refactor, new features)

---

## ✅ VALIDATION CHECKLIST before each Release

- [ ] All ESLint warnings resolved
- [ ] Tests pass (80%+ coverage)
- [ ] No console.error without try/catch
- [ ] All endpoints documented in API docs
- [ ] Security checklist reviewed
- [ ] CHANGELOG.md updated
- [ ] Git history clean (squash if needed)
- [ ] Version tag created

---

**Next Step:** Start Phase 1.1 (ESLint setup) this week! 🚀
