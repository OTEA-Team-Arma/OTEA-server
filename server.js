const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const auth = require('basic-auth');

const runningServers = {}; // port -> process

const app = express();
app.use(express.json());
app.use(express.static('.')); // Permet de servir l'index.html

// --- SÉCURITÉ ---
const USERS = { 'admin': 'OTEA' }; // À CHANGER
const authMiddleware = (req, res, next) => {
    const user = auth(req);
    if (user && USERS[user.name] && USERS[user.name] === user.pass) return next();
    res.set('WWW-Authenticate', 'Basic realm="Acces Protege"');
    return res.status(401).send('Authentification requise.');
};
app.use(authMiddleware);

const PRESETS_DIR = './presets/';
if (!fs.existsSync(PRESETS_DIR)) fs.mkdirSync(PRESETS_DIR);

// --- ROUTES API ---

// Lister les presets
app.get('/api/presets', (req, res) => {
    const files = fs.readdirSync(PRESETS_DIR);
    const data = files.map(f => JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, f))));
    res.json(data);
});

// Sauvegarder ou Créer un preset
app.post('/api/presets', (req, res) => {
    const preset = req.body;
    const fileName = `${preset.id}.json`;
    fs.writeFileSync(path.join(PRESETS_DIR, fileName), JSON.stringify(preset, null, 2));
    res.json({ message: "Preset enregistré !" });
});

// Supprimer un preset
app.delete('/api/presets/:id', (req, res) => {
    const filePath = path.join(PRESETS_DIR, `${req.params.id}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ message: "Supprimé" });
    } else {
        res.status(404).send("Introuvable");
    }
});

// Lancer le serveur Arma

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
    runningServers[port] = proc;
    res.json({ message: `Serveur lancé sur le port ${port}` });
});

// Stopper le serveur Arma

app.post('/api/stop', (req, res) => {
    const { port } = req.body;
    if (!port) return res.status(400).json({ message: 'Port requis' });
    const proc = runningServers[port];
    if (proc) {
        try {
            process.kill(-proc.pid);
        } catch (e) {}
        delete runningServers[port];
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
            if (killed) res.json({ message: `Processus sur le port ${port} stoppé` });
            else res.status(404).json({ message: 'Aucun processus trouvé' });
        });
    }
});

app.listen(3000, () => console.log("Interface d'ingénierie active sur le port 3000"));