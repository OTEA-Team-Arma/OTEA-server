/**
 * arma-server.service.js
 * 
 * Service pour gérer le cycle de vie des serveurs Arma Reforger
 * Responsabilités:
 * - Lancer un serveur (spawn)
 * - Arrêter un serveur (kill)
 * - Détecter les serveurs en route
 * - Récupérer les informations et statut
 * 
 * ⚠️ NOTE: Ce service n'a PAS de dépendances HTTP (req/res)
 * Il retourne des Promises et peut être utilisé n'importe où
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const fsSync = require('fs');
const ArmaLogsService = require('./arma-logs.service');

/**
 * État en mémoire des serveurs lancés via OTEA
 * Structure: { port: { proc, startTime, config } }
 */
const runningServers = {};

/**
 * ArmaServerService
 * Gère le cycle de vie des serveurs Arma Reforger
 */
class ArmaServerService {
    /**
     * Lance un serveur Arma Reforger
     * 
     * @param {Object} config - Configuration du serveur
     * @param {number} config.port - Port du serveur (2301-2305 généralement)
     * @param {Object} options - Options de lancement
     * @param {string} options.osAbstraction - Instance osAbstraction pour cross-platform
     * @returns {Promise<Object>} { success: true, port, pid, message }
     * @throws {Error} Si spawn échoue
     */
    static async start(config, options = {}) {
        if (!config || !config.port) {
            throw new Error('Config must include port');
        }

        const port = config.port;
        const osAbstraction = options.osAbstraction;

        if (!osAbstraction) {
            throw new Error('osAbstraction instance required');
        }

        // Vérifier qu'aucun serveur ne tourne déjà sur ce port
        if (runningServers[port]) {
            throw new Error(`Server already running on port ${port}`);
        }

        try {
            // Écrire la config active pour ce serveur
            const configPath = path.join(
                __dirname,
                '..',
                '..',
                `active_config_${port}.json`
            );
            await fs.writeFile(
                configPath,
                JSON.stringify(config, null, 2)
            );

            // Récupérer l'exécutable et les args depuis osAbstraction (cross-platform)
            const executable = osAbstraction.getServerExecutable();
            const args = osAbstraction.buildLaunchArgs(configPath, port);

            // Lancer le serveur en mode détaché (peut survivre à fermeture OTEA)
            // IMPORTANT: stdio: 'pipe' pour capturer les logs
            const proc = spawn(executable, args, {
                detached: true,
                stdio: ['ignore', 'pipe', 'pipe']  // stdin: ignore, stdout/stderr: pipe pour logs
            });

            // Tracker en mémoire
            runningServers[port] = {
                proc,
                startTime: Date.now(),
                config: config,
                configPath: configPath
            };

            // Attacher le logger pour capturer les logs
            ArmaLogsService.attachLogger(proc, port);

            return {
                success: true,
                port: port,
                pid: proc.pid,
                message: `Server started on port ${port}`,
                uptime: '0s'
            };
        } catch (error) {
            throw new Error(`Failed to start server: ${error.message}`);
        }
    }

    /**
     * Arrête un serveur Arma
     * 
     * @param {number} port - Port du serveur à arrêter
     * @param {Object} options - Options (osAbstraction pour fallback)
     * @returns {Promise<Object>} { success: true, port, message }
     * @throws {Error} Si arrêt échoue
     */
    static async stop(port, options = {}) {
        if (!port) {
            throw new Error('Port required');
        }

        const osAbstraction = options.osAbstraction;

        // Méthode 1: Utiliser le process stocké en mémoire
        const proc = runningServers[port];

        if (proc) {
            try {
                // Tenter tuer le process group (-pid pour tout le groupe)
                process.kill(-proc.proc.pid);
                delete runningServers[port];

                return {
                    success: true,
                    port: port,
                    message: `Server on port ${port} stopped`,
                    method: 'process.kill'
                };
            } catch (error) {
                console.warn(
                    `[ArmaServerService.stop] Failed to kill process group: ${error.message}`
                );
                // Continuer au fallback
            }
        }

        // Méthode 2: Utiliser osAbstraction pour cross-platform process kill
        if (osAbstraction && typeof osAbstraction.killProcessByPort === 'function') {
            try {
                const killed = await osAbstraction.killProcessByPort(port);
                if (killed) {
                    delete runningServers[port];
                    return {
                        success: true,
                        port: port,
                        message: `Server on port ${port} stopped (fallback)`,
                        method: 'osAbstraction.killProcessByPort'
                    };
                }
            } catch (error) {
                console.warn(
                    `[ArmaServerService.stop] osAbstraction fallback failed: ${error.message}`
                );
            }
        }

        // Aucun serveur trouvé ou erreur
        throw new Error(`Could not stop server on port ${port}`);
    }

    /**
     * Récupère le statut d'un serveur spécifique
     * 
     * @param {number} port - Port du serveur
     * @returns {Object|null} Infos du serveur ou null
     */
    static getStatus(port) {
        const proc = runningServers[port];
        if (!proc) {
            return null;
        }

        const uptime = this._formatUptime(Date.now() - proc.startTime);

        return {
            port: port,
            running: true,
            pid: proc.proc.pid,
            uptime: uptime,
            startTime: new Date(proc.startTime).toISOString(),
            config: proc.config,
            source: 'OTEA'
        };
    }

    /**
     * Récupère le statut de tous les serveurs lancés via OTEA
     * 
     * @returns {Array<Object>} Liste de tous les serveurs
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
                source: 'OTEA'
            });
        }

        return servers;
    }

    /**
     * Vérifie si un serveur tourne sur le port spécifié
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
     * Arrête tous les serveurs lancés via OTEA
     * Utilisé lors de arrêt d'OTEA
     * 
     * @returns {Promise<Array>} Résultats d'arrêt pour chaque serveur
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
     * Récupère la configuration active d'un serveur
     * 
     * @param {number} port - Port du serveur
     * @returns {Object|null} Configuration ou null
     */
    static getConfig(port) {
        const proc = runningServers[port];
        return proc ? proc.config : null;
    }

    /**
     * Met à jour la configuration d'un serveur running
     * ⚠️ Nécessite généralement un redémarrage
     * 
     * @param {number} port - Port du serveur
     * @param {Object} newConfig - Nouvelle configuration
     * @returns {Promise<void>}
     */
    static async updateConfig(port, newConfig) {
        const proc = runningServers[port];
        if (!proc) {
            throw new Error(`No server running on port ${port}`);
        }

        if (proc.configPath) {
            await fs.writeFile(
                proc.configPath,
                JSON.stringify(newConfig, null, 2)
            );
            // Mettre à jour en mémoire aussi
            proc.config = newConfig;
        }
    }

    /**
     * Redémarre un serveur (stop + start)
     * 
     * @param {number} port - Port du serveur
     * @param {Object} options - Options (osAbstraction, etc)
     * @returns {Promise<Object>} Résultat du restart
     */
    static async restart(port, options = {}) {
        try {
            const config = this.getConfig(port);
            if (!config) {
                throw new Error(`No server configuration for port ${port}`);
            }

            // Stop
            await this.stop(port, options);

            // Attendre un peu avant redeémarrer
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Start
            const result = await this.start(config, options);
            return {
                success: true,
                restart: true,
                ...result
            };
        } catch (error) {
            throw new Error(`Failed to restart server: ${error.message}`);
        }
    }

    /**
     * Récupère les infos système du serveur
     * Format les infos depuis la config
     * 
     * @param {number} port - Port du serveur
     * @returns {Object}
     */
    static getServerInfo(port) {
        const status = this.getStatus(port);
        const config = this.getConfig(port);

        if (!status || !config) {
            return null;
        }

        return {
            port: port,
            running: true,
            uptime: status.uptime,
            config: {
                name: config.name || `Server ${port}`,
                difficulty: config.difficulty || 'Unknown',
                maxPlayers: config.maxPlayers || 0,
                gameType: config.gameType || 'Unknown'
            }
        };
    }

    /**
     * HELPER: Formatte une durée en millisecondes vers string lisible
     * Exemple: 123456789ms → "1j 10h 17m"
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
     * HELPER: Exporte l'état des serveurs (pour debugging)
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
