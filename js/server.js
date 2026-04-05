const path = require('path');
const express = require('express');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const auth = require('basic-auth');
const osAbstraction = require('./osAbstraction'); // NOUVEAU: Import du module cross-platform

const app = express();
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
        if (typeof logAdmin === 'function') logAdmin('connexion', stored.username, { req });
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
        exec(`"${UPDATE_SCRIPT}"`, (error, stdout, stderr) => {
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





// --- LOG ADMIN ---
const ADMIN_LOG_FILE = path.join(__dirname, '..', 'data', 'admin.log');
function logAdmin(action, user, details = {}) {
    // On extrait seulement les infos utiles de req pour éviter les structures circulaires
    let safeDetails = { ...details };
    if (safeDetails.req && typeof safeDetails.req === 'object') {
        safeDetails.req = {
            ip: safeDetails.req.ip,
            url: safeDetails.req.url,
            method: safeDetails.req.method,
            headers: safeDetails.req.headers
        };
    } else if (safeDetails.req) {
        // Si req n'est pas un objet, on le supprime
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
app.post('/change-credentials', authMiddleware, (req, res) => {
    const { oldPassword, newUsername, newPassword } = req.body;
    const user = loadUser();
    if (!oldPassword || (newUsername === undefined && newPassword === undefined)) {
        return res.status(400).send('Paramètres manquants.');
    }
    if (oldPassword !== user.password) {
        return res.status(403).send('Ancien mot de passe incorrect.');
    }
    if (newUsername) user.username = newUsername;
    if (newPassword) user.password = newPassword;
    saveUser(user);
    logAdmin('change-credentials', user.username, { req });
    res.send('Identifiants modifiés.');
});






// Route pour ajouter un utilisateur (admin uniquement)
// Journalisation de l'ajout d'utilisateur par un admin
app.post('/add-user', (req, res) => {
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
if (!fs.existsSync(PRESETS_DIR)) fs.mkdirSync(PRESETS_DIR);

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
    res.json({ message: "Preset enregistré !" });
});

// Supprimer un preset
// Journalisation de la suppression d'un preset
app.delete('/api/presets/:id', (req, res) => {
    const filePath = path.join(PRESETS_DIR, `${req.params.id}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logAdmin('delete-preset', req.user?.name || 'inconnu', { preset: req.params.id, req });
        res.json({ message: "Supprimé" });
    } else {
        res.status(404).send("Introuvable");
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
    if (!port) return res.status(400).json({ message: 'Port requis' });
    
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

// --- ROUTE STATUT SERVEURS ---
app.get('/api/servers-status', authMiddleware, (req, res) => {
    const servers = [];
    for (const [port, proc] of Object.entries(runningServers)) {
        const uptime = proc.startTime ? formatUptime(Date.now() - proc.startTime) : '-';
        servers.push({
            port: port,
            running: true,
            uptime: uptime,
            lastAction: `Lancé il y a ${uptime}`
        });
    }
    res.json(servers);
});

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}j ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

app.listen(3000, () => console.log("Interface d'ingénierie active sur le port 3000"));

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
    let latestVersion = installedVersion;
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
        if (ban.type === 'permanent') return true;
        
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
        if (banId) return ban.id !== parseInt(banId);
        if (playerName) return ban.playerName.toLowerCase() !== playerName.toLowerCase();
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