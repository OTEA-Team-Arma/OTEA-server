/**
 * controllers/arma-logs.controller.js
 * 
 * Contrôleur pour les opérations sur les logs du serveur Arma
 * Responsabilités:
 * - Récupérer les logs filtrés
 * - Retourner les presets de mods
 * - Fournir les stats
 */

const ArmaLogsService = require('../services/arma-logs.service');
const { success, error } = require('../models/responses');

/**
 * ArmaLogsController
 */
class ArmaLogsController {
    /**
     * GET /api/servers/:port/logs
     * Récupère les logs du serveur avec filtres
     */
    static async getServerLogs(req, res) {
        try {
            const port = req.params.port;
            const { filter, preset, limit = 100, level, since } = req.query;

            // Valider port
            if (!port || isNaN(port)) {
                return res.status(400).json(error(
                    'Invalid port parameter',
                    'INVALID_PORT',
                    { received: port }
                ));
            }

            let logs;
            if (since) {
                // Logs depuis X minutes
                const minutes = parseInt(since) || 5;
                logs = ArmaLogsService.getLogsSince(port, minutes, {
                    filter, preset, level
                });
            } else {
                // Logs avec limite
                logs = ArmaLogsService.getLogs(port, {
                    filter, preset, limit, level
                });
            }

            // Stats du buffer
            const stats = ArmaLogsService.getStats(port);

            return res.status(200).json(success(
                {
                    count: logs.length,
                    logs: logs,
                    stats: stats,
                    filters: { filter, preset, limit, level, since }
                },
                `Retrieved ${logs.length} log(s)`
            ));
        } catch (err) {
            console.error('[ArmaLogsController.getServerLogs]', err);
            return res.status(500).json(error(
                err.message,
                'LOGS_RETRIEVAL_FAILED'
            ));
        }
    }

    /**
     * GET /api/servers/:port/logs/stream
     * Stream des logs en temps réel (compatible long polling)
     * Query params:
     *  - filter: pattern simple texte pour filtrer
     *  - preset: preset de filtre (tilw, debugIA, error, warning, script)
     *  - level: ERROR, WARN, INFO, DEBUG
     *  - since: minutes to look back (default 1)
     */
    static async getServerLogsStream(req, res) {
        try {
            const port = req.params.port;
            const { filter, preset, level, since = 1 } = req.query;

            // Valider port
            if (!port || isNaN(port)) {
                return res.status(400).json(error(
                    'Invalid port parameter',
                    'INVALID_PORT'
                ));
            }

            // Récupérer logs depuis X minutes
            const minutes = Math.max(1, Math.min(parseInt(since) || 1, 60));
            const logs = ArmaLogsService.getLogsSince(port, minutes, {
                filter, preset, level
            });

            return res.status(200).json(success(
                {
                    count: logs.length,
                    logs: logs,
                    query: { filter, preset, level, since: minutes }
                },
                `Retrieved ${logs.length} log(s) from last ${minutes} minute(s)`
            ));
        } catch (err) {
            console.error('[ArmaLogsController.getServerLogsStream]', err);
            return res.status(500).json(error(
                err.message,
                'LOGS_STREAM_FAILED'
            ));
        }
    }

    /**
     * GET /api/servers/:port/logs/filters
     * Récupère les presets de filtrage disponibles
     */
    static async getFilterPresets(req, res) {
        try {
            const presets = ArmaLogsService.getFilterPresets();
            return res.status(200).json(success(
                {
                    count: presets.length,
                    presets: presets
                },
                `Retrieved ${presets.length} filter preset(s)`
            ));
        } catch (err) {
            console.error('[ArmaLogsController.getFilterPresets]', err);
            return res.status(500).json(error(
                err.message,
                'PRESETS_RETRIEVAL_FAILED'
            ));
        }
    }

    /**
     * GET /api/servers/:port/logs/stats
     * Récupère les stats des logs
     */
    static async getLogsStats(req, res) {
        try {
            const port = req.params.port;

            if (!port || isNaN(port)) {
                return res.status(400).json(error(
                    'Invalid port parameter',
                    'INVALID_PORT'
                ));
            }

            const stats = ArmaLogsService.getStats(port);
            return res.status(200).json(success(
                { stats: stats },
                'Log stats retrieved'
            ));
        } catch (err) {
            console.error('[ArmaLogsController.getLogsStats]', err);
            return res.status(500).json(error(
                err.message,
                'STATS_RETRIEVAL_FAILED'
            ));
        }
    }

    /**
     * DELETE /api/servers/:port/logs
     * Vider tous les logs du serveur
     */
    static async clearLogs(req, res) {
        try {
            const port = req.params.port;

            if (!port || isNaN(port)) {
                return res.status(400).json(error(
                    'Invalid port parameter',
                    'INVALID_PORT'
                ));
            }

            ArmaLogsService.clearBuffer(port);
            return res.status(200).json(success(
                { port: port, cleared: true },
                `Logs cleared for port ${port}`
            ));
        } catch (err) {
            console.error('[ArmaLogsController.clearLogs]', err);
            return res.status(500).json(error(
                err.message,
                'LOGS_CLEAR_FAILED'
            ));
        }
    }
}

module.exports = ArmaLogsController;
