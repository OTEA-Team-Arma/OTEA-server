/**
 * admin.controller.js
 * 
 * Contrôleur pour les opérations administratives
 * Orchestre AdminService + ArmaServerService + LogService
 */

const AdminService = require('../services/admin.service');
const ArmaServerService = require('../services/arma-server.service');
const LogService = require('../services/log.service');
const { success, error } = require('../models/responses');

class AdminController {
    /**
     * POST /api/admin/restart-server/:port
     * Redémarre un serveur spécifique
     */
    static async restartServer(req, res) {
        try {
            const { port } = req.params;

            if (!port) {
                return res.status(400).json(
                    error('Port is required', 'MISSING_PORT')
                );
            }

            const result = await AdminService.restartServer(parseInt(port), {
                osAbstraction: req.app.locals.osAbstraction
            });

            return res.json(success(result, 'Server restarted by admin'));
        } catch (err) {
            await LogService.logAction('admin-restart-error', req.user?.name, {
                ip: req.ip,
                port,
                error: err.message
            });
            return res.status(500).json(
                error('Failed to restart server', 'RESTART_ERROR', err.message)
            );
        }
    }

    /**
     * POST /api/admin/restart-all
     * Redémarre TOUS les serveurs
     */
    static async restartAllServers(req, res) {
        try {
            await LogService.logAction('admin-restart-all-initiated', req.user?.name, {
                ip: req.ip
            });

            const results = await AdminService.restartAllServers({
                osAbstraction: req.app.locals.osAbstraction
            });

            await LogService.logAction('admin-restart-all-completed', req.user?.name, {
                ip: req.ip,
                results
            });

            return res.json(success(
                { restarted: results.length, results },
                `${results.length} servers restarted`
            ));
        } catch (err) {
            await LogService.logAction('admin-restart-all-error', req.user?.name, {
                ip: req.ip,
                error: err.message
            });
            return res.status(500).json(
                error('Failed to restart all servers', 'RESTART_ALL_ERROR', err.message)
            );
        }
    }

    /**
     * POST /api/admin/stop-all
     * Arrête TOUS les serveurs
     */
    static async stopAllServers(req, res) {
        try {
            await LogService.logAction('admin-stop-all-initiated', req.user?.name, {
                ip: req.ip
            });

            const results = await AdminService.stopAllServers({
                osAbstraction: req.app.locals.osAbstraction
            });

            await LogService.logAction('admin-stop-all-completed', req.user?.name, {
                ip: req.ip,
                stopped: results.length
            });

            return res.json(success(
                { stopped: results.length, results },
                `${results.length} servers stopped`
            ));
        } catch (err) {
            await LogService.logAction('admin-stop-all-error', req.user?.name, {
                ip: req.ip,
                error: err.message
            });
            return res.status(500).json(
                error('Failed to stop all servers', 'STOP_ALL_ERROR', err.message)
            );
        }
    }

    /**
     * POST /api/admin/backup-config
     * Crée un backup de la config
     */
    static async backupConfig(req, res) {
        try {
            const { configPath, backupDir } = req.body;

            if (!configPath || !backupDir) {
                return res.status(400).json(
                    error('configPath and backupDir are required', 'MISSING_PARAMS')
                );
            }

            const result = await AdminService.backupConfig(configPath, backupDir);

            await LogService.logAction('admin-backup-config', req.user?.name, {
                ip: req.ip,
                backupPath: result.backupPath
            });

            return res.json(success(result, 'Config backed up successfully'));
        } catch (err) {
            await LogService.logAction('admin-backup-config-error', req.user?.name, {
                ip: req.ip,
                error: err.message
            });
            return res.status(500).json(
                error('Failed to backup config', 'BACKUP_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/admin/system-info
     * Récupère les informations système
     */
    static async getSystemInfo(req, res) {
        try {
            const info = await AdminService.getSystemInfo();

            return res.json(success(info, 'System info retrieved'));
        } catch (err) {
            return res.status(500).json(
                error('Failed to get system info', 'INFO_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/admin/health
     * Effectue un health check complet
     */
    static async healthCheck(req, res) {
        try {
            const health = await AdminService.healthCheck();

            const status = health.overall === 'healthy' ? 200 : 503;

            return res.status(status).json(success(health, 'Health check completed'));
        } catch (err) {
            return res.status(500).json(
                error('Health check failed', 'HEALTH_ERROR', err.message)
            );
        }
    }

    /**
     * POST /api/admin/cleanup-orphans
     * Nettoie les processus orphelins
     */
    static async cleanupOrphans(req, res) {
        try {
            const { dryRun } = req.body;

            await LogService.logAction('admin-cleanup-initiated', req.user?.name, {
                ip: req.ip,
                dryRun: dryRun || false
            });

            const result = await AdminService.cleanupOrphanProcesses({
                dryRun: dryRun || false
            });

            await LogService.logAction('admin-cleanup-completed', req.user?.name, {
                ip: req.ip,
                killed: result.killed
            });

            return res.json(success(result, 'Cleanup completed'));
        } catch (err) {
            await LogService.logAction('admin-cleanup-error', req.user?.name, {
                ip: req.ip,
                error: err.message
            });
            return res.status(500).json(
                error('Cleanup failed', 'CLEANUP_ERROR', err.message)
            );
        }
    }

    /**
     * POST /api/admin/recycle
     * Recycle OTEA (arrête tous + redémarre)
     */
    static async recycleOtea(req, res) {
        try {
            await LogService.logAction('admin-recycle-initiated', req.user?.name, {
                ip: req.ip
            });

            // Envoyer la réponse avant de redémarrer
            res.json(success(
                { status: 'recycling' },
                'OTEA system recycling initiated'
            ));

            // Exécuter le recycle après ~1 seconde
            setTimeout(() => {
                AdminService.recycleOtea({ delay: 2000 }).catch(err => {
                    console.error('Recycle error:', err);
                });
            }, 1000);
        } catch (err) {
            await LogService.logAction('admin-recycle-error', req.user?.name, {
                ip: req.ip,
                error: err.message
            });
            return res.status(500).json(
                error('Failed to initiate recycle', 'RECYCLE_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/admin/servers-summary
     * Récupère un résumé de tous les serveurs
     */
    static async getServersSummary(req, res) {
        try {
            const servers = ArmaServerService.getAllStatus();
            const systemInfo = await AdminService.getSystemInfo();

            return res.json(success(
                {
                    serversRunning: servers.length,
                    servers,
                    system: {
                        uptime: systemInfo.uptime,
                        memory: systemInfo.resources
                    }
                },
                'Servers summary retrieved'
            ));
        } catch (err) {
            return res.status(500).json(
                error('Failed to get summary', 'SUMMARY_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/admin/arma-version
     * Récupère la version du serveur Arma installée
     */
    static async getArmaVersion(req, res) {
        try {
            const ArmaVersionService = require('../services/arma-version.service');
            const installed = await ArmaVersionService.getInstalledVersion();

            return res.json(success(
                {
                    installedVersion: installed || 'Inconnue',
                    latestVersion: 'Inconnue',
                    updateAvailable: false
                },
                'Arma version retrieved'
            ));
        } catch (err) {
            return res.status(500).json(
                error('Failed to get Arma version', 'VERSION_ERROR', err.message)
            );
        }
    }
}

module.exports = AdminController;
