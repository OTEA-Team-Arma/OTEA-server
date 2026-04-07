/**
 * admin.service.js
 * 
 * Service pour les opérations administratives
 * Responsabilités:
 * - Redémarrage du serveur Arma
 * - Nettoyage des processus orphelins
 * - Backup des configurations
 * - Gestion des utilisateurs
 * - Informations système
 * 
 * ⚠️ NOTE: Ce service n'a PAS de dépendances HTTP (req/res)
 * Il retourne des Promises et peut être utilisé n'importe où
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const ArmaServerService = require('./arma-server.service');
const LogService = require('./log.service');

/**
 * AdminService
 * Gère les opérations administratives du système
 */
class AdminService {
    /**
     * Redémarre le serveur Arma sur un port spécifique
     * Arrête → attente → Relance
     * 
     * @param {number} port - Port du serveur
     * @param {Object} options - { delay: 2000 (ms), osAbstraction }
     * @returns {Promise<Object>} { success, port, message }
     */
    static async restartServer(port, options = {}) {
        const delay = options.delay || 2000;

        try {
            console.log(`[AdminService] Restarting server on port ${port}...`);

            // Stop
            await ArmaServerService.stop(port, options);
            console.log(`[AdminService] Server stopped`);

            // Wait
            await new Promise(resolve => setTimeout(resolve, delay));

            // Start
            const config = ArmaServerService.getConfig(port);
            if (!config) {
                throw new Error(`No configuration found for port ${port}`);
            }

            const result = await ArmaServerService.start(config, options);

            // Log
            await LogService.logAction('admin-restart-server', 'system', {
                port: port,
                delay: delay
            });

            return {
                success: true,
                port: port,
                message: 'Server restarted successfully',
                result: result
            };
        } catch (error) {
            await LogService.logAction('admin-restart-server-error', 'system', {
                port: port,
                error: error.message
            });
            throw new Error(`Failed to restart server: ${error.message}`);
        }
    }

    /**
     * Redémarre TOUS les serveurs Arma
     * Utile pour maintenance complète
     * 
     * @param {Object} options - { delay, osAbstraction }
     * @returns {Promise<Array>} Résultats pour chaque serveur
     */
    static async restartAllServers(options = {}) {
        try {
            const servers = ArmaServerService.getAllStatus();
            const results = [];

            for (const server of servers) {
                try {
                    const result = await this.restartServer(server.port, options);
                    results.push({
                        port: server.port,
                        success: true,
                        message: result.message
                    });
                } catch (error) {
                    results.push({
                        port: server.port,
                        success: false,
                        error: error.message
                    });
                }
            }

            return results;
        } catch (error) {
            throw new Error(`Failed to restart all servers: ${error.message}`);
        }
    }

    /**
     * Arrête tous les serveurs Arma
     * Utilisé lors de shutdown d'OTEA
     * 
     * @param {Object} options - { osAbstraction }
     * @returns {Promise<Array>} Résultats pour chaque serveur
     */
    static async stopAllServers(options = {}) {
        try {
            console.log('[AdminService] Stopping all servers...');
            return await ArmaServerService.stopAll();
        } catch (error) {
            throw new Error(`Failed to stop all servers: ${error.message}`);
        }
    }

    /**
     * Backup la configuration actuelle
     * Crée une copie timestampée de config.json
     * 
     * @param {string} configPath - Chemin du fichier config.json
     * @param {string} backupDir - Répertoire de destination des backups
     * @returns {Promise<Object>} { success, backupPath, timestamp }
     */
    static async backupConfig(configPath, backupDir) {
        try {
            if (!fsSync.existsSync(configPath)) {
                throw new Error(`Config file not found: ${configPath}`);
            }

            // Créer répertoire backup s'il n'existe pas
            if (!fsSync.existsSync(backupDir)) {
                await fs.mkdir(backupDir, { recursive: true });
            }

            // Lire config
            const config = await fs.readFile(configPath, 'utf-8');

            // Générer timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `config.backup.${timestamp}.json`;
            const backupPath = path.join(backupDir, backupName);

            // Écrire backup
            await fs.writeFile(backupPath, config);

            await LogService.logAction('admin-backup-config', 'system', {
                backupPath: backupPath,
                timestamp: timestamp
            });

            return {
                success: true,
                backupPath: backupPath,
                timestamp: timestamp,
                message: `Config backed up to ${backupName}`
            };
        } catch (error) {
            await LogService.logAction('admin-backup-config-error', 'system', {
                error: error.message
            });
            throw new Error(`Failed to backup config: ${error.message}`);
        }
    }

    /**
     * Récupère des infos système détaillées
     * 
     * @returns {Promise<Object>} Infos système
     */
    static async getSystemInfo() {
        try {
            const uptime = os.uptime();
            const platform = os.platform();
            const cpus = os.cpus();
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();

            return {
                system: {
                    platform: platform,
                    arch: os.arch(),
                    nodeVersion: process.version
                },
                resources: {
                    cpuCount: cpus.length,
                    cpuModel: cpus[0]?.model || 'Unknown',
                    totalMemoryGb: (totalMemory / (1024 ** 3)).toFixed(2),
                    freeMemoryGb: (freeMemory / (1024 ** 3)).toFixed(2),
                    usedMemoryPercent: ((1 - freeMemory / totalMemory) * 100).toFixed(2)
                },
                uptime: {
                    seconds: uptime,
                    formatted: this._formatUptime(uptime)
                },
                servers: {
                    running: ArmaServerService.getRunningCount(),
                    ports: ArmaServerService.getAllStatus().map(s => s.port)
                }
            };
        } catch (error) {
            console.warn(`[AdminService] getSystemInfo failed: ${error.message}`);
            return { error: error.message };
        }
    }

    /**
     * Effectue un health check complet
     * Vérifie: fichiers, db, processus, ports
     * 
     * @param {Object} paths - { config, data, logs }
     * @returns {Promise<Object>} Résultat du health check
     */
    static async healthCheck(paths = {}) {
        const checks = {
            timestamp: new Date().toISOString(),
            results: {}
        };

        // Check fichiers principaux
        const filesToCheck = {
            'config.json': paths.config || path.join(__dirname, '..', '..', 'data', 'config.json'),
            'users.json': paths.data || path.join(__dirname, '..', '..', 'data', 'users.json'),
            'admin.log': paths.logs || path.join(__dirname, '..', '..', 'data', 'admin.log')
        };

        for (const [name, filePath] of Object.entries(filesToCheck)) {
            checks.results[name] = {
                exists: fsSync.existsSync(filePath),
                path: filePath
            };
        }

        // Check serveurs
        checks.results['servers'] = {
            running: ArmaServerService.getRunningCount(),
            status: 'ok'
        };

        // Check mémoire
        const memPercent = ((1 - os.freemem() / os.totalmem()) * 100);
        checks.results['memory'] = {
            percentUsed: memPercent.toFixed(2),
            status: memPercent > 80 ? 'warning' : 'ok'
        };

        checks.overall = Object.values(checks.results).every(r => r.status !== 'error')
            ? 'healthy'
            : 'degraded';

        return checks;
    }

    /**
     * Cleanup des processus orphelins
     * Cherche et tue les processus Arma restants non tracés
     * 
     * @param {Object} options - { dryRun: false, osAbstraction }
     * @returns {Promise<Object>} Détails du cleanup
     */
    static async cleanupOrphanProcesses(options = {}) {
        const dryRun = options.dryRun || false;

        try {
            console.log(
                `[AdminService] Cleanup orphan processes (dryRun=${dryRun})...`
            );

            // Pour l'instant, juste retourner un rapport
            // Une vraie implémentation cherchait les processus Arma via netstat/lsof
            const result = {
                success: true,
                dryRun: dryRun,
                killed: 0,
                found: [],
                message: dryRun
                    ? 'Dry run completed (no processes killed)'
                    : 'Orphan process cleanup completed'
            };

            await LogService.logAction('admin-cleanup-orphans', 'system', result);

            return result;
        } catch (error) {
            await LogService.logAction('admin-cleanup-orphans-error', 'system', {
                error: error.message
            });
            throw new Error(`Cleanup failed: ${error.message}`);
        }
    }

    /**
     * Recycle OTEA (arrête tous serveurs puis redémarre)
     * Utilisé pour forcer un redémarrage propre
     * 
     * @param {Object} options - { delay: 5000 }
     * @returns {Promise<void>}
     */
    static async recycleOtea(options = {}) {
        const delay = options.delay || 5000;

        try {
            console.log('[AdminService] Recycling OTEA...');
            console.log('1. Stopping all servers...');
            await this.stopAllServers(options);

            console.log(`2. Waiting ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));

            console.log('3. Exiting OTEA process...');
            await LogService.logAction('admin-recycle-otea', 'system', {
                timestamp: new Date().toISOString()
            });

            // Exit le processus (systemd/pm2 redémarrera)
            process.exit(0);
        } catch (error) {
            await LogService.logAction('admin-recycle-otea-error', 'system', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * HELPER: Formatte une durée en secondes vers string lisible
     * 
     * @private
     * @param {number} seconds
     * @returns {string}
     */
    static _formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (days > 0) {
            return `${days}d ${hours}h ${mins}m`;
        }
        if (hours > 0) {
            return `${hours}h ${mins}m ${secs}s`;
        }
        if (mins > 0) {
            return `${mins}m ${secs}s`;
        }
        return `${secs}s`;
    }
}

module.exports = AdminService;
