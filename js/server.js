// Load environment variables FIRST
require('dotenv').config();

const path = require('path');
const express = require('express');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const auth = require('basic-auth');
const helmet = require('helmet'); // NEW: Security headers
const rateLimit = require('express-rate-limit'); // NEW: Rate limiting
const osAbstraction = require('./osAbstraction'); // NOUVEAU: Import du module cross-platform
const armaVersionService = require('./services/arma-version.service'); // NEW: Version detection

const app = express();

// ============================================================================
// SECURITY MIDDLEWARE (Apply FIRST)
// ============================================================================
app.use(helmet()); // Add security headers

// Rate limiting: Max 100 requests per 15 minutes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
});

// Stricter rate limiting for auth endpoints: Max 5 attempts per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max 5 login attempts
    message: 'Too many login attempts, please try again later.',
    skipSuccessfulRequests: true, // Don't count successful requests
});

app.use(limiter); // Apply general rate limit to all routes
app.use(express.json());

// ============================================================================
// INITIALISATION osAbstraction (CRITICAL - Must be called before routes)
// ============================================================================
let osAbstractionReady = false;
try {
    osAbstraction.init({});
    osAbstractionReady = true;
    console.log('✅ OTEA-server is ready!');
    console.log(`📊 Platform: ${osAbstraction.getPlatform()}`);
    console.log(`📁 Server root: ${osAbstraction.getServerRootPath()}`);
} catch (err) {
    console.error('❌ FATAL ERROR during initialization:');
    console.error(err.message);
    console.error('Server will NOT start. Fix the binary paths and restart.');
    process.exit(1);
}

// --- MIDDLEWARES ---
function loadUser() {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'users.json'), 'utf-8'));
    } catch {
        return { username: 'admin', password: 'admin1234' };
    }
}
const authMiddleware = (req, res, next) => {
    const stored = loadUser();
    const user = auth(req);
    if (user && user.name === stored.username && user.pass === stored.password) {
        req.user = { name: stored.username };
        if (typeof logAdmin === 'function') {logAdmin('connexion', stored.username, { req });}
        return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Acces Protege"');
    return res.status(401).send('Authentification requise.');
};
app.use(express.static(path.join(__dirname, '..'))); // Sert les fichiers statiques depuis la racine
app.use(authMiddleware); // Authentification après, protège les routes API



// --- MISE À JOUR ARMA REFORGER SERVER ---
// Utilise osAbstraction pour obtenir le bon script selon l'OS
const runningServers = {}; // Tracker des serveurs en cours d'exécution

app.post('/api/update-server', authMiddleware, (req, res) => {
    if (!osAbstractionReady) {
        return res.status(500).json({ message: 'Server not ready. Check initialization.' });
    }

    try {
        const UPDATE_SCRIPT = osAbstraction.getUpdateScript();

        if (!fs.existsSync(UPDATE_SCRIPT)) {
            return res.status(404).json({
                message: 'Script de mise à jour introuvable.',
                expectedPath: UPDATE_SCRIPT
            });
        }

        console.log(`[/api/update-server] Executing update script: ${UPDATE_SCRIPT}`);
        const config = osAbstraction.getConfig();
        const envOptions = {
            env: { ...process.env, STEAMCMD_PATH: config.steamCmdPath || '' }
        };
        exec(`"${UPDATE_SCRIPT}"`, envOptions, (error, stdout, stderr) => {
            logAdmin('update-server', req.user?.name || 'inconnu', { stdout, stderr, error, req });
            if (error) {
                return res.status(500).json({
                    message: 'Erreur lors de la mise à jour.',
                    error: error.message,
                    stderr
                });
            }
            res.json({ message: 'Mise à jour terminée.', stdout });
        });
    } catch (err) {
        logAdmin('update-server-error', req.user?.name || 'inconnu', { error: err.message, req });
        res.status(500).json({ message: 'Erreur accès script mise à jour', error: err.message });
    }
});

// --- REDÉMARRER OTEA ---
app.post('/api/restart-otea', authMiddleware, (req, res) => {
    logAdmin('restart-otea', req.user?.name || 'inconnu', { req });
    res.json({ message: 'Redémarrage en cours...' });
    setTimeout(() => {
        process.exit(0);
    }, 500);
});

function saveUser(user) {
    fs.writeFileSync(path.join(__dirname, '..', 'data', 'users.json'), JSON.stringify(user, null, 2));
}





// --- LOG ADMIN avec ROTATION (Security & Storage Management) ---
const ADMIN_LOG_FILE = path.join(__dirname, '..', 'data', 'admin.log');
const ADMIN_LOG_DIR = path.join(__dirname, '..', 'data', 'logs');
const MAX_LOG_SIZE_MB = 10; // Max 10 MB par fichier
const MAX_LOG_FILES = 5; // Garder max 5 fichiers (50 MB total)
const MAX_LOG_AGE_DAYS = 30; // Supprimer les logs > 30 jours

// Fonction helper: Nettoyer les données sensibles des headers
function _sanitizeHeaders(headers = {}) {
    const SENSITIVE_KEYS = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    const sanitized = { ...headers };
    SENSITIVE_KEYS.forEach(key => {
        if (sanitized[key]) {
            sanitized[key] = '[REDACTED]';
        }
    });
    return sanitized;
}

// Fonction helper: Initialiser répertoire des logs
function _ensureLogDir() {
    if (!fs.existsSync(ADMIN_LOG_DIR)) {
        fs.mkdirSync(ADMIN_LOG_DIR, { recursive: true });
    }
}

// Fonction helper: Vérifier et rotater les logs si trop volumineux
function _rotateLogsIfNeeded() {
    try {
        _ensureLogDir();

        if (!fs.existsSync(ADMIN_LOG_FILE)) {
            fs.writeFileSync(ADMIN_LOG_FILE, JSON.stringify([], null, 2));
            return;
        }

        const stats = fs.statSync(ADMIN_LOG_FILE);
        const fileSizeMB = stats.size / (1024 * 1024);

        // Rotation: archiver si fichier > MAX_LOG_SIZE_MB
        if (fileSizeMB > MAX_LOG_SIZE_MB) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const archivePath = path.join(ADMIN_LOG_DIR, `admin.log.${timestamp}.bak`);
            fs.renameSync(ADMIN_LOG_FILE, archivePath);
            fs.writeFileSync(ADMIN_LOG_FILE, JSON.stringify([], null, 2));
            console.log(`[logAdmin] ✅ Log rotated to ${path.basename(archivePath)}`);

            // Nettoyer les vieux fichiers
            _cleanupOldLogs();
        }
    } catch (err) {
        console.error(`[logAdmin] ❌ Error rotating logs: ${err.message}`);
    }
}

// Fonction helper: Supprimer les logs trop vieux
function _cleanupOldLogs() {
    try {
        _ensureLogDir();
        const files = fs.readdirSync(ADMIN_LOG_DIR);
        const now = Date.now();

        // Supprimer les fichiers > MAX_LOG_AGE_DAYS
        files.forEach(file => {
            if (!file.startsWith('admin.log.')) {return;}
            const filePath = path.join(ADMIN_LOG_DIR, file);
            const stats = fs.statSync(filePath);
            const ageInDays = (now - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

            if (ageInDays > MAX_LOG_AGE_DAYS) {
                fs.unlinkSync(filePath);
                console.log(`[logAdmin] 🧹 Deleted old log: ${file} (${ageInDays.toFixed(1)} days)`);
            }
        });

        // Garder seulement les MAX_LOG_FILES fichiers les plus récents
        const sorted = files
            .filter(f => f.startsWith('admin.log.'))
            .sort()
            .reverse();

        for (let i = MAX_LOG_FILES; i < sorted.length; i++) {
            const filePath = path.join(ADMIN_LOG_DIR, sorted[i]);
            fs.unlinkSync(filePath);
            console.log(`[logAdmin] 🧹 Deleted excess backup: ${sorted[i]}`);
        }
    } catch (err) {
        console.warn(`[logAdmin] ⚠️  Warning during cleanup: ${err.message}`);
    }
}

function logAdmin(action, user, details = {}) {
    _rotateLogsIfNeeded();

    // Extraire et NETTOYER les infos de req
    const safeDetails = { ...details };
    if (safeDetails.req && typeof safeDetails.req === 'object') {
        safeDetails.req = {
            ip: safeDetails.req.ip,
            url: safeDetails.req.url,
            method: safeDetails.req.method,
            headers: _sanitizeHeaders(safeDetails.req.headers) // 🔒 SANITIZATION
        };
    } else if (safeDetails.req) {
        delete safeDetails.req;
    }

    const entry = {
        date: new Date().toISOString(),
        user,
        action,
        details: safeDetails,
        ip: (details.req && details.req.ip) || undefined
    };

    let logs = [];
    try {
        logs = JSON.parse(fs.readFileSync(ADMIN_LOG_FILE, 'utf-8'));
    } catch {}

    logs.push(entry);
    fs.writeFileSync(ADMIN_LOG_FILE, JSON.stringify(logs, null, 2));
}
// Exemple de route réservée à l'admin
app.get('/admin', (req, res) => {
    res.send('Bienvenue, administrateur !');
});

// Route pour changer son propre mot de passe (authentifié)
// Journalisation du changement de mot de passe
app.post('/change-credentials', authMiddleware, authLimiter, (req, res) => {
    const { oldPassword, newUsername, newPassword } = req.body;
    const user = loadUser();
    if (!oldPassword || (newUsername === undefined && newPassword === undefined)) {
        return res.status(400).send('Paramètres manquants.');
    }
    if (oldPassword !== user.password) {
        return res.status(403).send('Ancien mot de passe incorrect.');
    }
    if (newUsername) {user.username = newUsername;}
    if (newPassword) {user.password = newPassword;}
    saveUser(user);
    logAdmin('change-credentials', user.username, { req });
    res.send('Identifiants modifiés.');
});






// Route pour ajouter un utilisateur (admin uniquement)
// Journalisation de l'ajout d'utilisateur par un admin
app.post('/add-user', authLimiter, (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
        return res.status(400).send('Paramètres manquants.');
    }
    USERS = loadUsers();
    if (USERS[username]) {
        return res.status(409).send('Utilisateur déjà existant.');
    }
    USERS[username] = { password, role };
    saveUsers(USERS);
    logAdmin('add-user', req.user.name, { added: username, role, req });
    res.send('Utilisateur ajouté.');
});


const PRESETS_DIR = path.join(__dirname, '..', 'presets');
if (!fs.existsSync(PRESETS_DIR)) {fs.mkdirSync(PRESETS_DIR);}

// --- ROUTES API ---

// Lister les presets
app.get('/api/presets', (req, res) => {
    try {
        const files = fs.readdirSync(PRESETS_DIR);
        const data = files
            .filter(f => f.endsWith('.json'))
            .map(f => {
                try {
                    return JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, f)));
                } catch (e) {
                    return null;
                }
            })
            .filter(preset => preset !== null);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Erreur lecture presets', details: err.message });
    }
});

// Sauvegarder ou Créer un preset
app.post('/api/presets', (req, res) => {
    const preset = req.body;
    const fileName = `${preset.id}.json`;
    fs.writeFileSync(path.join(PRESETS_DIR, fileName), JSON.stringify(preset, null, 2));
    res.json({ message: 'Preset enregistré !' });
});

// Supprimer un preset
// Journalisation de la suppression d'un preset
app.delete('/api/presets/:id', (req, res) => {
    const filePath = path.join(PRESETS_DIR, `${req.params.id}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logAdmin('delete-preset', req.user?.name || 'inconnu', { preset: req.params.id, req });
        res.json({ message: 'Supprimé' });
    } else {
        res.status(404).send('Introuvable');
    }
});

// Lancer le serveur Arma
// Utilise osAbstraction pour etre cross-platform
app.post('/api/launch', authMiddleware, (req, res) => {
    if (!osAbstractionReady) {
        return res.status(500).json({ message: 'Server not ready. Check initialization.' });
    }

    const config = req.body;
    const port = config.port || 2001;
    const configPath = path.join(__dirname, '..', `active_config_${port}.json`); // FIXED: Use path.join()
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    if (runningServers[port]) {
        return res.status(400).json({ message: `Un serveur tourne déjà sur le port ${port}` });
    }

    try {
        // Utiliser osAbstraction pour obtenir l'exécutable et les args
        const executable = osAbstraction.getServerExecutable();
        const args = osAbstraction.buildLaunchArgs(configPath, port);

        const proc = spawn(executable, args, {
            detached: true,
            stdio: 'ignore' // Ignore stdio si needed
        });

        proc.startTime = Date.now(); // Tracker l'heure de démarrage
        runningServers[port] = proc;
        logAdmin('launch-server', req.user?.name || 'inconnu', { port, config, req });
        res.json({ message: `Serveur lancé sur le port ${port}` });
    } catch (err) {
        logAdmin('launch-server-error', req.user?.name || 'inconnu', { port, error: err.message, req });
        res.status(500).json({ message: 'Erreur lors du lancement du serveur', error: err.message });
    }
});

// Stopper le serveur Arma
// Utilise osAbstraction en fallback pour etre cross-platform
app.post('/api/stop', authMiddleware, (req, res) => {
    const { port } = req.body;
    if (!port) {return res.status(400).json({ message: 'Port requis' });}

    const proc = runningServers[port];
    if (proc) {
        try {
            process.kill(-proc.pid);
            delete runningServers[port];
            logAdmin('stop-server', req.user?.name || 'inconnu', { port, req });
            return res.json({ message: `Serveur sur le port ${port} arrêté` });
        } catch (e) {
            console.warn(`[/api/stop] Failed to kill process group PID, trying fallback: ${e.message}`);
        }
    }

    // Fallback: Utiliser osAbstraction pour cross-platform process kill
    osAbstraction.killProcessByPort(port).then(killed => {
        if (killed) {
            delete runningServers[port];
            logAdmin('stop-server', req.user?.name || 'inconnu', { port, req, fallback: true });
            res.json({ message: `Processus sur le port ${port} stoppé (fallback)` });
        } else {
            res.status(404).json({ message: 'Aucun processus trouvé sur ce port' });
        }
    }).catch(err => {
        res.status(500).json({ message: 'Erreur lors de l\'arrêt du serveur', error: err.message });
    });
});

// --- ROUTE STATUT SERVEURS (AMÉLIORÉ) ---
// Détecte les instances OTEA + scanne les ports pour instances indépendantes
app.get('/api/servers-status', authMiddleware, (req, res) => {
    const servers = [];

    // 1. Serveurs lancés via OTEA (en mémoire)
    for (const [port, proc] of Object.entries(runningServers)) {
        const uptime = proc.startTime ? formatUptime(Date.now() - proc.startTime) : '-';
        servers.push({
            port: port,
            running: true,
            uptime: uptime,
            source: 'OTEA'  // ← Indique que lancé via OTEA
        });
    }

    // 2. TODO: Scanner les ports pour instances indépendantes
    // Décommentez pour activer la détection automatique (nécessite netstat/lsof)
    /*
    const detectIndependentInstances = async () => {
        if (platformDetected === 'win32') {
            // Windows: netstat -ano | findstr :PORT
            exec('netstat -ano', (err, stdout) => {
                const ports = [2301, 2302, 2303, 2304, 2305];
                ports.forEach(p => {
                    if (stdout.includes(`:${p}`) && !servers.find(s => s.port == p)) {
                        servers.push({
                            port: p,
                            running: true,
                            uptime: 'Inconnu',
                            source: 'Indépendant (détecté)'
                        });
                    }
                });
            });
        } else {
            // Linux: lsof -i :PORT
            exec('lsof -i', (err, stdout) => {
                const ports = [2301, 2302, 2303, 2304, 2305];
                ports.forEach(p => {
                    if (stdout.includes(`:${p}`) && !servers.find(s => s.port == p)) {
                        servers.push({
                            port: p,
                            running: true,
                            uptime: 'Inconnu',
                            source: 'Indépendant (détecté)'
                        });
                    }
                });
            });
        }
    };
    */

    res.json(servers);
});

// --- ROUTE: Récupérer les logs du serveur Arma ---
// Les logs Arma se trouvent généralement dans: serverRoot/logs/ ou serverRoot/ArmaReforgerServer.log
app.get('/api/arma-server-log', authMiddleware, (req, res) => {
    try {
        const serverRoot = config.serverRootPath;
        if (!serverRoot) {
            return res.status(400).json({ error: 'Server root path not configured' });
        }

        // Chemins possibles des logs Arma
        const possibleLogPaths = [
            path.join(serverRoot, 'ArmaReforgerServer.log'),
            path.join(serverRoot, 'logs', 'server.log'),
            path.join(serverRoot, 'console.log'),
            path.join(serverRoot, 'debug.log')
        ];

        let logContent = null;
        let logPath = null;

        // Chercher le premier fichier log qui existe
        for (const logFile of possibleLogPaths) {
            if (fs.existsSync(logFile)) {
                logPath = logFile;
                try {
                    const fullContent = fs.readFileSync(logFile, 'utf-8');
                    // Ne retourner que les 100 dernières lignes pour pas surcharger
                    const lines = fullContent.split('\n');
                    logContent = lines.slice(Math.max(0, lines.length - 100)).join('\n');
                } catch (err) {
                    logContent = `[ERROR] Cannot read file: ${err.message}`;
                }
                break;
            }
        }

        if (!logContent) {
            return res.json({
                log: '[INFO] Aucun fichier log du serveur Arma trouvé.\n\nEmplacements vérifiés:\n' +
                     possibleLogPaths.join('\n') +
                     '\n\n[HINT] Les logs seront disponibles après le premier lancement du serveur Arma.',
                logPath: null,
                available: false
            });
        }

        res.json({
            log: logContent,
            logPath: logPath,
            available: true
        });
    } catch (err) {
        res.status(500).json({
            error: 'Erreur lors de la lecture des logs Arma',
            message: err.message
        });
    }
});


app.post('/api/admin/cleanup-logs', authMiddleware, (req, res) => {
    const user = req.user?.name || 'inconnu';

    // Check if user is admin (optional: add admin role check if you have a users role system)
    try {
        _cleanupOldLogs();
        logAdmin('cleanup-logs', user, { action: 'manual cleanup', req });
        res.json({
            message: 'Logs nettoyés avec succès',
            directory: ADMIN_LOG_DIR,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        logAdmin('cleanup-logs-error', user, { error: err.message, req });
        res.status(500).json({
            message: 'Erreur lors du nettoyage des logs',
            error: err.message
        });
    }
});

// --- ADMIN ROUTE: Get Log Status ---
app.get('/api/admin/log-status', authMiddleware, (req, res) => {
    try {
        const currentStats = fs.existsSync(ADMIN_LOG_FILE)
            ? fs.statSync(ADMIN_LOG_FILE)
            : null;

        const backupFiles = fs.existsSync(ADMIN_LOG_DIR)
            ? fs.readdirSync(ADMIN_LOG_DIR).filter(f => f.startsWith('admin.log.'))
            : [];

        const status = {
            currentLog: {
                path: ADMIN_LOG_FILE,
                exists: currentStats ? true : false,
                sizeMb: currentStats ? (currentStats.size / (1024 * 1024)).toFixed(2) : 0,
                lastModified: currentStats ? currentStats.mtime.toISOString() : null
            },
            backupLogs: backupFiles.map(f => ({
                name: f,
                path: path.join(ADMIN_LOG_DIR, f),
                size: fs.statSync(path.join(ADMIN_LOG_DIR, f)).size,
                sizeMb: (fs.statSync(path.join(ADMIN_LOG_DIR, f)).size / (1024 * 1024)).toFixed(2)
            })),
            totalBackupSize: backupFiles.reduce((sum, f) => {
                return sum + fs.statSync(path.join(ADMIN_LOG_DIR, f)).size;
            }, 0),
            configuration: {
                maxLogSizeMb: MAX_LOG_SIZE_MB,
                maxLogFiles: MAX_LOG_FILES,
                maxLogAgeDays: MAX_LOG_AGE_DAYS
            }
        };

        logAdmin('log-status-check', req.user?.name, { req });
        res.json(status);
    } catch (err) {
        res.status(500).json({
            message: 'Erreur lors de la récupération du statut des logs',
            error: err.message
        });
    }
});

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {return `${days}j ${hours % 24}h`;}
    if (hours > 0) {return `${hours}h ${minutes % 60}m`;}
    if (minutes > 0) {return `${minutes}m ${seconds % 60}s`;}
    return `${seconds}s`;
}

// ============================================================================
// STARTUP: Load config and validate
// ============================================================================
const PORT = process.env.OTEA_PORT || 3000;
const HOST = process.env.OTEA_HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Warn if running production with 0.0.0.0 (exposed everywhere)
if (NODE_ENV === 'production' && HOST === '0.0.0.0') {
    console.warn('⚠️  WARNING: OTEA exposed on 0.0.0.0 in production!');
    console.warn('⚠️  Recommend: Use reverse proxy (Nginx) instead');
    console.warn('⚠️  See: docs/SECURITY_PORT_3000.md');
}

// ============================================================================
// NEW ENDPOINT: Check for Arma Reforger updates
// ============================================================================
app.get('/api/arma-server/check-updates', authMiddleware, async (req, res) => {
    try {
        const config = osAbstraction.getConfig();
        const installed = await armaVersionService.getInstalledVersion();
        const available = await armaVersionService.getAvailableVersion(config.steamCmdPath);
        const updateAvailable = await armaVersionService.isUpdateAvailable(config.steamCmdPath);

        logAdmin('check-updates', req.user?.name || 'inconnu', {
            installed,
            available,
            updateAvailable
        });

        res.json({
            installed,
            available,
            updateAvailable,
            updateUrl: '/api/update-server'
        });
    } catch (err) {
        logAdmin('check-updates-error', req.user?.name || 'inconnu', {
            error: err.message
        });
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, HOST, () => {
    console.log(`✅ OTEA-server running at http://${HOST}:${PORT}`);
    console.log(`📊 Environment: ${NODE_ENV}`);
});

// --- API INFO ARMA REFORGER SERVER ---
app.get('/arma-server/info', authMiddleware, (req, res) => {
    // 1. Version installée (placeholder: à améliorer si possible)
    let installedVersion = 'Inconnue';
    try {
        // Cherche un fichier version.txt généré par SteamCMD ou autre (à adapter selon install)
        const versionFile = path.join(__dirname, '..', 'arma_reforger_version.txt');
        if (fs.existsSync(versionFile)) {
            installedVersion = fs.readFileSync(versionFile, 'utf-8').trim();
        }
    } catch {}

    // 2. Dernière version disponible (placeholder, à remplacer par appel Steam ou API si possible)
    const latestVersion = installedVersion;
    // Pour une vraie vérification, il faudrait parser la sortie de SteamCMD ou une API officielle

    // 3. Log des mises à jour (actions update-server dans admin.log)
    let updateLog = [];
    try {
        const logPath = path.join(__dirname, '..', 'data', 'admin.log');
        if (fs.existsSync(logPath)) {
            const all = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
            updateLog = all.filter(e => e.action === 'update-server').map(e => ({
                date: e.date,
                status: e.details && e.details.error ? 'Erreur' : 'OK',
                message: e.details && e.details.error ? e.details.error : (e.details && e.details.stdout ? e.details.stdout.split('\n')[0] : 'Mise à jour effectuée')
            })).reverse();
        }
    } catch {}

    res.json({ installedVersion, latestVersion, updateLog });
});

// ============================================================================
// PLAYER MANAGEMENT ENDPOINTS
// ============================================================================

const BANS_FILE = path.join(__dirname, '..', 'data', 'bans.json');

function loadBans() {
    try {
        return JSON.parse(fs.readFileSync(BANS_FILE, 'utf-8'));
    } catch {
        return [];
    }
}

function saveBans(bans) {
    fs.writeFileSync(BANS_FILE, JSON.stringify(bans, null, 2));
}

// GET /api/players/list - Liste les joueurs connectés (mock data pour demo)
app.get('/api/players/list', authMiddleware, (req, res) => {
    const { port } = req.query;

    // Mock data - À remplacer par vraies données si possible
    const mockPlayers = [
        { id: 1, name: 'JoueurTest1', ip: '192.168.1.100', port: port || 2001, joinedAt: new Date(Date.now() - 3600000) },
        { id: 2, name: 'JoueurTest2', ip: '192.168.1.101', port: port || 2001, joinedAt: new Date(Date.now() - 1800000) }
    ];

    logAdmin('list-players', req.user?.name || 'inconnu', { port, count: mockPlayers.length, req });
    res.json(mockPlayers);
});

// POST /api/players/kick - Expulser un joueur
app.post('/api/players/kick', authMiddleware, (req, res) => {
    const { playerId, playerName, port, reason } = req.body;

    if (!playerName || !port) {
        return res.status(400).json({ message: 'playerName et port requis' });
    }

    logAdmin('kick-player', req.user?.name || 'inconnu', {
        playerId,
        playerName,
        port,
        reason: reason || 'No reason provided',
        req
    });

    res.json({
        message: `Joueur ${playerName} expulsé du serveur ${port}`,
        kicked: playerName
    });
});

// POST /api/players/ban - Bannir un joueur
app.post('/api/players/ban', authMiddleware, (req, res) => {
    const { playerName, port, reason, duration, type } = req.body;

    if (!playerName) {
        return res.status(400).json({ message: 'playerName requis' });
    }

    const bans = loadBans();

    // Vérifier si joueur déjà banni
    if (bans.find(b => b.playerName.toLowerCase() === playerName.toLowerCase())) {
        return res.status(409).json({ message: 'Ce joueur est déjà banni' });
    }

    const banEntry = {
        id: Date.now(),
        playerName: playerName,
        bannedAt: new Date().toISOString(),
        reason: reason || 'Raison non spécifiée',
        duration: duration || 30,
        type: type || 'temporary',
        bannedBy: req.user?.name || 'admin',
        port: port || 'all'
    };

    bans.push(banEntry);
    saveBans(bans);

    logAdmin('ban-player', req.user?.name || 'inconnu', {
        playerName,
        reason,
        duration,
        type,
        req
    });

    res.json({
        message: `Joueur ${playerName} a été banni`,
        ban: banEntry
    });
});

// GET /api/players/banned - Liste les joueurs bannés
app.get('/api/players/banned', authMiddleware, (req, res) => {
    const bans = loadBans();

    // Filtrer les bans temporaires expirés
    const activeBans = bans.filter(ban => {
        if (ban.type === 'permanent') {return true;}

        const bannedDate = new Date(ban.bannedAt);
        const expiryDate = new Date(bannedDate.getTime() + ban.duration * 24 * 60 * 60 * 1000);
        return expiryDate > new Date();
    });

    res.json(activeBans);
});

// POST /api/players/unban - Débanner un joueur
app.post('/api/players/unban', authMiddleware, (req, res) => {
    const { banId, playerName } = req.body;

    if (!banId && !playerName) {
        return res.status(400).json({ message: 'banId ou playerName requis' });
    }

    let bans = loadBans();
    const initialLength = bans.length;

    bans = bans.filter(ban => {
        if (banId) {return ban.id !== parseInt(banId);}
        if (playerName) {return ban.playerName.toLowerCase() !== playerName.toLowerCase();}
        return true;
    });

    if (bans.length === initialLength) {
        return res.status(404).json({ message: 'Ban non trouvé' });
    }

    saveBans(bans);

    logAdmin('unban-player', req.user?.name || 'inconnu', {
        banId,
        playerName,
        req
    });

    res.json({
        message: `Le joueur ${playerName || banId} a été débanni`,
        bansRemaining: bans.length
    });
});