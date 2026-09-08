/**
 * arma-server.service.js
 *
 * Service pour gérer le cycle de vie des serveurs Arma Reforger
 * Architecture "config directe" : les presets sont des fichiers JSON au format Arma Reforger
 * Responsabilités:
 * - Sauvegarder/charger les configs ServerConfig_*.json
 * - Lancer un serveur avec config directe (sans transformation)
 * - Arrêter un serveur (kill)
 * - Gérer l'état des serveurs en cours
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const fsSync = require('fs');
const ArmaLogsService = require('./arma-logs.service');

const PRESETS_DIR = path.join(__dirname, '..', '..', 'presets');

/**
 * État en mémoire des serveurs lancés via OTEA
 * Structure: { port: { proc, startTime, configFile } }
 */
const runningServers = {};

/**
 * ArmaServerService
 * Gère le cycle de vie des serveurs Arma Reforger avec architecture config directe
 */
class ArmaServerService {
    /**
     * Génère un slug depuis un nom
     * Ex: "Mon Serveur GM" → "mon_serveur_gm"
     *
     * @private
     * @param {string} name - Nom du serveur
     * @returns {string} Slug
     */
    static _generateSlug(name) {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    /**
     * Sauvegarde une configuration serveur au format Arma Reforger
     *
     * @param {Object} data - Données du serveur
     * @param {string} data.name - Nom du serveur
     * @param {number} data.port - Port du serveur
     * @param {string} data.scenarioId - ID du scénario
     * @param {number} data.maxPlayers - Nombre max de joueurs
     * @param {string} data.password - Mot de passe serveur (optionnel)
     * @param {string} data.passwordAdmin - Mot de passe admin
     * @param {Array<string>} data.admins - Liste des Steam IDs admin
     * @param {Array<Object>} data.mods - Liste des mods
     * @returns {Promise<Object>} { success: true, filename, path }
     */
    static async saveConfig(data) {
        try {
            // Logger la valeur de scenarioId reçue
            console.log('[ArmaServerService.saveConfig] scenarioId reçu:', data.scenarioId);

            // Créer le dossier presets s'il n'existe pas
            if (!fsSync.existsSync(PRESETS_DIR)) {
                await fs.mkdir(PRESETS_DIR, { recursive: true });
            }

            // Générer le slug et le nom de fichier
            const slug = this._generateSlug(data.name);
            const filename = `ServerConfig_${slug}.json`;
            const filePath = path.join(PRESETS_DIR, filename);

            // Nettoyer les mods (retirer guillemets parasites)
            const cleanMods = (data.mods || []).map(mod => {
                if (typeof mod === 'object' && mod.modId) {
                    return {
                        modId: mod.modId.replace(/"/g, '').trim(),
                        name: mod.name || mod.modId
                    };
                }
                return {
                    modId: String(mod).replace(/"/g, '').trim(),
                    name: String(mod)
                };
            });

            // Construire la config au format Arma Reforger
            const armaConfig = {
                dedicatedServerId: slug,
                region: data.region || 'EU',
                bindAddress: '',
                bindPort: data.port,
                publicAddress: '',
                publicPort: data.port,
                a2s: {
                    address: '0.0.0.0',
                    port: data.port + 1
                },
                game: {
                    name: data.name,
                    password: data.password || '',
                    passwordAdmin: data.passwordAdmin || '',
                    admins: data.admins || [],
                    scenarioId: data.scenarioId || '',
                    maxPlayers: data.maxPlayers || 16,
                    visible: true,
                    crossPlatform: false,
                    mods: cleanMods
                }
            };

            // Sauvegarder le fichier
            await fs.writeFile(filePath, JSON.stringify(armaConfig, null, 2));

            console.log(`[ArmaServerService] ✅ Config saved: ${filePath}`);

            return {
                success: true,
                filename: filename,
                path: filePath
            };
        } catch (error) {
            throw new Error(`Failed to save config: ${error.message}`);
        }
    }

    /**
     * Charge une configuration depuis un fichier
     *
     * @param {string} filename - Nom du fichier (ex: ServerConfig_xxx.json)
     * @returns {Promise<Object>} Configuration JSON
     */
    static async loadConfig(filename) {
        try {
            const filePath = path.join(PRESETS_DIR, filename);

            if (!fsSync.existsSync(filePath)) {
                throw new Error(`Config file not found: ${filename}`);
            }

            const content = await fs.readFile(filePath, 'utf8');
            const config = JSON.parse(content);

            console.log(`[ArmaServerService] ✅ Config loaded: ${filePath}`);

            return config;
        } catch (error) {
            throw new Error(`Failed to load config: ${error.message}`);
        }
    }

    /**
     * Liste toutes les configurations disponibles
     *
     * @returns {Promise<Array<Object>>} Liste des configs avec métadonnées
     */
    static async listConfigs() {
        try {
            if (!fsSync.existsSync(PRESETS_DIR)) {
                await fs.mkdir(PRESETS_DIR, { recursive: true });
                return [];
            }

            const files = await fs.readdir(PRESETS_DIR);
            const configs = [];

            for (const file of files) {
                if (!file.startsWith('ServerConfig_') || !file.endsWith('.json')) {
                    continue;
                }

                try {
                    const config = await this.loadConfig(file);
                    configs.push({
                        filename: file,
                        name: config.game?.name || 'Unknown',
                        port: config.bindPort || 0,
                        scenarioId: config.game?.scenarioId || '',
                        maxPlayers: config.game?.maxPlayers || 0,
                        mods: (config.game?.mods || []).length
                    });
                } catch (error) {
                    console.warn(`[ArmaServerService] Failed to read ${file}: ${error.message}`);
                }
            }

            console.log(`[ArmaServerService] ✅ Found ${configs.length} config(s)`);

            return configs;
        } catch (error) {
            console.warn(`[ArmaServerService] listConfigs failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Supprime une configuration
     *
     * @param {string} filename - Nom du fichier à supprimer
     * @returns {Promise<Object>} { success: true, filename }
     */
    static async deleteConfig(filename) {
        try {
            const filePath = path.join(PRESETS_DIR, filename);

            if (!fsSync.existsSync(filePath)) {
                throw new Error(`Config file not found: ${filename}`);
            }

            await fs.unlink(filePath);

            console.log(`[ArmaServerService] ✅ Config deleted: ${filePath}`);

            return {
                success: true,
                filename: filename
            };
        } catch (error) {
            throw new Error(`Failed to delete config: ${error.message}`);
        }
    }

    /**
     * Lance un serveur Arma Reforger avec config directe
     *
     * @param {string} filename - Nom du fichier config (ex: ServerConfig_xxx.json)
     * @param {number} port - Port du serveur
     * @param {Object} options - Options de lancement
     * @param {Object} options.osAbstraction - Instance osAbstraction
     * @returns {Promise<Object>} { success: true, port, pid, message }
     */
    static async start(filename, port, options = {}) {
        // Logs explicites au début de la fonction
        console.log('[ArmaServerService.start] ========================================');
        console.log('[ArmaServerService.start] 📥 Filename reçu:', filename);
        console.log('[ArmaServerService.start] 📥 Port reçu:', port);

        if (!filename || !port) {
            throw new Error('filename and port are required');
        }

        const osAbstraction = options.osAbstraction;

        if (!osAbstraction) {
            throw new Error('osAbstraction instance required');
        }

        // Vérifier qu'aucun serveur ne tourne déjà sur ce port
        if (runningServers[port]) {
            throw new Error(`Server already running on port ${port}`);
        }

        try {
            // Charger la config pour validation
            const config = await this.loadConfig(filename);

            // Chemin absolu vers le fichier de config
            const configPath = path.join(PRESETS_DIR, filename);

            console.log('[ArmaServerService.start] 📁 Chemin complet du fichier config:', configPath);
            console.log(`[ArmaServerService] 🚀 Starting server on port ${port} with config: ${configPath}`);

            // Récupérer l'exécutable et les args depuis osAbstraction
            const executable = osAbstraction.getServerExecutable();
            const args = osAbstraction.buildLaunchArgs(configPath, port);

            console.log(`[ArmaServerService] 📋 Launch command: ${executable} ${args.join(' ')}`);

            // Lancer le serveur en mode détaché
            const proc = spawn(executable, args, {
                detached: true,
                stdio: ['ignore', 'pipe', 'pipe']
            });

            // Tracker en mémoire
            runningServers[port] = {
                proc,
                startTime: Date.now(),
                configFile: filename,
                config: config
            };

            // Attacher le logger pour capturer les logs
            ArmaLogsService.attachLogger(proc, port);

            console.log(`[ArmaServerService] ✅ Server started: PID ${proc.pid}, port ${port}`);

            return {
                success: true,
                port: port,
                pid: proc.pid,
                message: `Server started on port ${port}`,
                configFile: filename,
                uptime: '0s'
            };
        } catch (error) {
            throw new Error(`Failed to start server: ${error.message}`);
        }
    }

    /**
     * Arrête un serveur par port
     *
     * @param {number} port - Port du serveur à arrêter
     * @param {Object} options - Options (osAbstraction pour fallback)
     * @returns {Promise<Object>} { success: true, port, message }
     */
    static async stop(port, options = {}) {
        if (!port) {
            throw new Error('Port required');
        }

        const osAbstraction = options.osAbstraction;
        const serverInfo = runningServers[port];

        if (serverInfo) {
            try {
                // Tuer le process par PID
                process.kill(-serverInfo.proc.pid);
                delete runningServers[port];

                console.log(`[ArmaServerService] ✅ Server stopped: port ${port}`);

                return {
                    success: true,
                    port: port,
                    message: `Server on port ${port} stopped`,
                    method: 'process.kill'
                };
            } catch (error) {
                console.warn(`[ArmaServerService] Failed to kill process: ${error.message}`);
            }
        }

        // Fallback: utiliser osAbstraction
        if (osAbstraction && typeof osAbstraction.killProcessByPort === 'function') {
            try {
                const killed = await osAbstraction.killProcessByPort(port);
                if (killed) {
                    delete runningServers[port];

                    console.log(`[ArmaServerService] ✅ Server stopped (fallback): port ${port}`);

                    return {
                        success: true,
                        port: port,
                        message: `Server on port ${port} stopped (fallback)`,
                        method: 'osAbstraction'
                    };
                }
            } catch (error) {
                console.warn(`[ArmaServerService] Fallback failed: ${error.message}`);
            }
        }

        throw new Error(`Could not stop server on port ${port}`);
    }

    /**
     * Récupère le statut d'un serveur
     *
     * @param {number} port - Port du serveur
     * @returns {Object|null} Statut du serveur
     */
    static getStatus(port) {
        const serverInfo = runningServers[port];
        if (!serverInfo) {
            return null;
        }

        const uptime = this._formatUptime(Date.now() - serverInfo.startTime);

        return {
            port: port,
            running: true,
            pid: serverInfo.proc.pid,
            uptime: uptime,
            startTime: new Date(serverInfo.startTime).toISOString(),
            configFile: serverInfo.configFile,
            config: serverInfo.config,
            source: 'OTEA'
        };
    }

    /**
     * Récupère le statut de tous les serveurs
     *
     * @returns {Array<Object>} Liste des serveurs
     */
    static getAllStatus() {
        const servers = [];

        for (const [port, serverInfo] of Object.entries(runningServers)) {
            const uptime = this._formatUptime(Date.now() - serverInfo.startTime);
            servers.push({
                port: parseInt(port),
                running: true,
                pid: serverInfo.proc.pid,
                uptime: uptime,
                startTime: new Date(serverInfo.startTime).toISOString(),
                configFile: serverInfo.configFile,
                source: 'OTEA'
            });
        }

        return servers;
    }

    /**
     * Vérifie si un serveur tourne sur le port
     *
     * @param {number} port - Port à vérifier
     * @returns {boolean}
     */
    static isRunning(port) {
        return runningServers.hasOwnProperty(port);
    }

    /**
     * Récupère le nombre de serveurs en route
     *
     * @returns {number}
     */
    static getRunningCount() {
        return Object.keys(runningServers).length;
    }

    /**
     * Arrête tous les serveurs
     *
     * @returns {Promise<Array>} Résultats
     */
    static async stopAll() {
        const results = [];

        for (const port of Object.keys(runningServers)) {
            try {
                const result = await this.stop(parseInt(port));
                results.push({ port, ...result });
            } catch (error) {
                results.push({
                    port: parseInt(port),
                    success: false,
                    message: error.message
                });
            }
        }

        return results;
    }

    /**
     * Formate une durée en millisecondes
     *
     * @private
     * @param {number} ms - Millisecondes
     * @returns {string}
     */
    static _formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}j ${hours % 24}h`;
        }
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    }

    /**
     * Exporte l'état des serveurs (debugging)
     *
     * @returns {Object}
     */
    static exportState() {
        return {
            runningServersCount: Object.keys(runningServers).length,
            ports: Object.keys(runningServers).map(p => parseInt(p)),
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = ArmaServerService;
