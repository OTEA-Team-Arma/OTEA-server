const path = require('path');
const express = require('express');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const auth = require('basic-auth');
const app = express();
app.use(express.json());

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
const UPDATE_SCRIPT = path.join(__dirname, '..', 'update_armar_ds.bat');
const runningServers = {}; // Tracker des serveurs en cours d'exécution

app.post('/api/update-server', authMiddleware, (req, res) => {
    if (!fs.existsSync(UPDATE_SCRIPT)) {
        return res.status(404).json({ message: 'Script de mise à jour introuvable.' });
    }
    exec(`"${UPDATE_SCRIPT}"`, (error, stdout, stderr) => {
        logAdmin('update-server', req.user?.name || 'inconnu', { stdout, stderr, error, req });
        if (error) {
            return res.status(500).json({ message: 'Erreur lors de la mise à jour.', error: error.message, stderr });
        }
        res.json({ message: 'Mise à jour terminée.', stdout });
    });
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

// Journalisation du lancement du serveur
app.post('/api/launch', (req, res) => {
    const config = req.body;
    const port = config.port || 2001;
    const configPath = `active_config_${port}.json`;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    if (runningServers[port]) {
        return res.status(400).json({ message: `Un serveur tourne déjà sur le port ${port}` });
    }

    const args = ['-config', configPath, '-port', port, '-update'];
    const proc = spawn('ArmaReforgerServer.exe', args, { detached: true });
    proc.startTime = Date.now(); // Tracker l'heure de démarrage
    runningServers[port] = proc;
    logAdmin('launch-server', req.user?.name || 'inconnu', { port, config, req });
    res.json({ message: `Serveur lancé sur le port ${port}` });
});

// Stopper le serveur Arma

// Journalisation de l'arrêt du serveur
app.post('/api/stop', (req, res) => {
    const { port } = req.body;
    if (!port) return res.status(400).json({ message: 'Port requis' });
    const proc = runningServers[port];
    if (proc) {
        try {
            process.kill(-proc.pid);
        } catch (e) {}
        delete runningServers[port];
        logAdmin('stop-server', req.user?.name || 'inconnu', { port, req });
        res.json({ message: `Serveur sur le port ${port} arrêté` });
    } else {
        // Fallback: kill by process name and port (Windows only)
        exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
            if (!stdout) return res.status(404).json({ message: 'Aucun serveur trouvé sur ce port' });
            const lines = stdout.trim().split('\n');
            let killed = false;
            lines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                const pid = parts[4];
                if (pid) {
                    exec(`taskkill /PID ${pid} /F`);
                    killed = true;
                }
            });
            if (killed) logAdmin('stop-server', req.user?.name || 'inconnu', { port, req, fallback: true });
            if (killed) res.json({ message: `Processus sur le port ${port} stoppé` });
            else res.status(404).json({ message: 'Aucun processus trouvé' });
        });
    }
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