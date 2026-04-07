/**
 * arma-server.controller.js
 * 
 * Contrôleur pour les opérations du serveur Arma Reforger
 * Responsabilités:
 * - Valider les inputs HTTP
 * - Orchestrer les services
 * - Formater les réponses
 * - Gérer les erreurs HTTP
 * 
 * Pattern: Route → Controller → Service → Response
 */

const ArmaServerService = require('../services/arma-server.service');
const PresetsService = require('../services/presets.service');
const LogService = require('../services/log.service');
const { success, error, validationError } = require('../models/responses');

/**
 * ArmaServerController
 * Contrôle tous les endpoints liés au serveur Arma
 */
class ArmaServerController {
    /**
     * POST /api/servers
     * Lance un nouveau serveur Arma
     * 
     * @param {Request} req - { body: { port, presetId, config } }
     * @param {Response} res
     */
    static async startServer(req, res) {
        try {
            const { port, presetId, config } = req.body;

            // Validation
            if (!port || !config) {
                await LogService.logAction('server-start-invalid', req.user?.name, {
                    ip: req.ip,
                    reason: 'Missing port or config'
                });
                return res.status(400).json(
                    validationError(['port and config are required'])
                );
            }

            // Vérifier port valide
            if (port < 2301 || port > 65535) {
                await LogService.logAction('server-start-invalid', req.user?.name, {
                    ip: req.ip,
                    port: port,
                    reason: 'Invalid port range'
                });
                return res.status(400).json(
                    validationError(['port must be between 2301 and 65535'])
                );
            }

            // Vérifier pas déjà en cours
            if (ArmaServerService.isRunning(port)) {
                return res.status(409).json(
                    error('Server already running on that port', 'SERVER_RUNNING')
                );
            }

            // Lancer le serveur
            const result = await ArmaServerService.start({ port, ...config }, {
                osAbstraction: req.app.locals.osAbstraction
            });

            // Log action
            await LogService.logAction('server-started', req.user?.name, {
                ip: req.ip,
                port: port,
                presetId: presetId || null,
                pid: result.pid
            });

            return res.json(success(result, 'Server started successfully'));
        } catch (err) {
            await LogService.logAction('server-start-error', req.user?.name, {
                ip: req.ip,
                error: err.message
            });
            return res.status(500).json(
                error('Failed to start server', 'START_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/servers/:port
     * Récupère le statut d'un serveur spécifique
     */
    static async getServerStatus(req, res) {
        try {
            const { port } = req.params;

            if (!port) {
                return res.status(400).json(
                    error('Port is required', 'MISSING_PORT')
                );
            }

            const status = ArmaServerService.getStatus(parseInt(port));

            if (!status) {
                return res.status(404).json(
                    error('Server not found', 'NOT_FOUND', `No server on port ${port}`)
                );
            }

            return res.json(success(status, 'Server status retrieved'));
        } catch (err) {
            return res.status(500).json(
                error('Failed to get server status', 'STATUS_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/servers
     * Récupère le statut de TOUS les serveurs
     */
    static async getAllServers(req, res) {
        try {
            const servers = ArmaServerService.getAllStatus();

            return res.json(success(
                {
                    count: servers.length,
                    servers: servers
                },
                `Retrieved ${servers.length} running server(s)`
            ));
        } catch (err) {
            return res.status(500).json(
                error('Failed to get servers', 'LIST_ERROR', err.message)
            );
        }
    }

    /**
     * POST /api/servers/:port/restart
     * Redémarre un serveur (stop + start)
     */
    static async restartServer(req, res) {
        try {
            const { port } = req.params;

            if (!port) {
                return res.status(400).json(
                    error('Port is required', 'MISSING_PORT')
                );
            }

            if (!ArmaServerService.isRunning(port)) {
                return res.status(404).json(
                    error('Server not found', 'NOT_RUNNING', `No server on port ${port}`)
                );
            }

            const result = await ArmaServerService.restart(
                parseInt(port),
                { osAbstraction: req.app.locals.osAbstraction }
            );

            await LogService.logAction('server-restarted', req.user?.name, {
                ip: req.ip,
                port: port,
                pid: result.pid
            });

            return res.json(success(result, 'Server restarted successfully'));
        } catch (err) {
            await LogService.logAction('server-restart-error', req.user?.name, {
                ip: req.ip,
                port: req.params.port,
                error: err.message
            });
            return res.status(500).json(
                error('Failed to restart server', 'RESTART_ERROR', err.message)
            );
        }
    }

    /**
     * PUT /api/servers/:port/config
     * Met à jour la configuration d'un serveur
     */
    static async updateServerConfig(req, res) {
        try {
            const { port } = req.params;
            const { config } = req.body;

            if (!port || !config) {
                return res.status(400).json(
                    validationError(['port and config are required'])
                );
            }

            if (!ArmaServerService.isRunning(port)) {
                return res.status(404).json(
                    error('Server not found', 'NOT_RUNNING')
                );
            }

            await ArmaServerService.updateConfig(parseInt(port), config);

            await LogService.logAction('server-config-updated', req.user?.name, {
                ip: req.ip,
                port: port
            });

            return res.json(success({ port, config }, 'Config updated successfully'));
        } catch (err) {
            await LogService.logAction('server-config-error', req.user?.name, {
                ip: req.ip,
                port: req.params?.port,
                error: err.message
            });
            return res.status(500).json(
                error('Failed to update config', 'CONFIG_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/servers/info/:port
     * Récupère les infos détaillées d'un serveur
     */
    static async getServerInfo(req, res) {
        try {
            const { port } = req.params;

            if (!port) {
                return res.status(400).json(
                    error('Port is required', 'MISSING_PORT')
                );
            }

            const info = ArmaServerService.getDetailedInfo(parseInt(port));

            if (!info) {
                return res.status(404).json(
                    error('Server not found', 'NOT_FOUND')
                );
            }

            return res.json(success(info, 'Server info retrieved'));
        } catch (err) {
            return res.status(500).json(
                error('Failed to get server info', 'INFO_ERROR', err.message)
            );
        }
    }

    /**
     * DELETE /api/servers/:port
     * Arrête un serveur spécifique
     */
    static async stopServer(req, res) {
        try {
            const { port } = req.params;

            if (!port) {
                return res.status(400).json(
                    error('Port is required', 'MISSING_PORT')
                );
            }

            if (!ArmaServerService.isRunning(port)) {
                return res.status(404).json(
                    error('Server not found', 'NOT_RUNNING')
                );
            }

            const result = await ArmaServerService.stop(parseInt(port));

            await LogService.logAction('server-stopped', req.user?.name, {
                ip: req.ip,
                port: port
            });

            return res.json(success(result, 'Server stopped successfully'));
        } catch (err) {
            await LogService.logAction('server-stop-error', req.user?.name, {
                ip: req.ip,
                port: req.params?.port,
                error: err.message
            });
            return res.status(500).json(
                error('Failed to stop server', 'STOP_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/servers/health
     * Health check pour tous les serveurs
     */
    static async healthCheck(req, res) {
        try {
            const servers = ArmaServerService.getAllStatus();
            const healthy = servers.length > 0;

            return res.json(success(
                {
                    healthy: healthy,
                    serversRunning: servers.length,
                    servers: servers
                },
                healthy ? 'All servers healthy' : 'No servers running'
            ));
        } catch (err) {
            return res.status(500).json(
                error('Health check failed', 'HEALTH_CHECK_ERROR', err.message)
            );
        }
    }
}

module.exports = ArmaServerController;
