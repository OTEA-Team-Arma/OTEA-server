/**
 * log.controller.js
 * 
 * Contrôleur pour la gestion des logs d'administration
 * Orchestre LogService
 */

const LogService = require('../services/log.service');
const { success, error } = require('../models/responses');

class LogController {
    /**
     * GET /api/logs
     * Récupère les N derniers logs
     */
    static async getLogs(req, res) {
        try {
            const { lines = 50 } = req.query;
            const numLines = Math.min(parseInt(lines) || 50, 1000); // Max 1000

            const logs = await LogService.getTail(numLines);

            return res.json(success(
                {
                    count: logs.length,
                    limit: numLines,
                    logs
                },
                `Retrieved ${logs.length} log entries`
            ));
        } catch (err) {
            return res.status(500).json(
                error('Failed to retrieve logs', 'RETRIEVE_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/logs/search
     * Recherche dans les logs
     */
    static async searchLogs(req, res) {
        try {
            const { query, field = 'action', limit = 100 } = req.query;

            if (!query) {
                return res.status(400).json(
                    error('Search query is required', 'MISSING_QUERY')
                );
            }

            const results = await LogService.search(query, {
                field,
                limit: Math.min(parseInt(limit) || 100, 1000)
            });

            return res.json(success(
                {
                    query,
                    field,
                    count: results.length,
                    results
                },
                `Found ${results.length} log entries`
            ));
        } catch (err) {
            return res.status(500).json(
                error('Search failed', 'SEARCH_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/logs/user/:username
     * Récupère les logs d'un utilisateur spécifique
     */
    static async getLogsByUser(req, res) {
        try {
            const { username } = req.params;
            const { limit = 100 } = req.query;

            if (!username) {
                return res.status(400).json(
                    error('Username is required', 'MISSING_USERNAME')
                );
            }

            const logs = await LogService.filterByUser(
                username,
                Math.min(parseInt(limit) || 100, 1000)
            );

            return res.json(success(
                {
                    user: username,
                    count: logs.length,
                    logs
                },
                `Retrieved ${logs.length} log entries for user ${username}`
            ));
        } catch (err) {
            return res.status(500).json(
                error('Failed to retrieve user logs', 'USER_LOGS_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/logs/action/:action
     * Récupère les logs d'une action spécifique
     */
    static async getLogsByAction(req, res) {
        try {
            const { action } = req.params;
            const { limit = 100 } = req.query;

            if (!action) {
                return res.status(400).json(
                    error('Action is required', 'MISSING_ACTION')
                );
            }

            const logs = await LogService.filterByAction(
                action,
                Math.min(parseInt(limit) || 100, 1000)
            );

            return res.json(success(
                {
                    action,
                    count: logs.length,
                    logs
                },
                `Retrieved ${logs.length} log entries for action ${action}`
            ));
        } catch (err) {
            return res.status(500).json(
                error('Failed to retrieve action logs', 'ACTION_LOGS_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/logs/status
     * Récupère le statut des logs (taille, rotation, etc)
     */
    static async getLogStatus(req, res) {
        try {
            const status = await LogService.getStatus();

            return res.json(success(status, 'Log status retrieved'));
        } catch (err) {
            return res.status(500).json(
                error('Failed to get log status', 'STATUS_ERROR', err.message)
            );
        }
    }

    /**
     * POST /api/logs/cleanup
     * Effectue un nettoyage manuel des logs
     */
    static async cleanupLogs(req, res) {
        try {
            const result = await LogService.cleanup();

            await LogService.logAction('admin-cleanup-logs', req.user?.name, {
                ip: req.ip,
                deleted: result.deleted
            });

            return res.json(success(result, 'Logs cleaned up successfully'));
        } catch (err) {
            await LogService.logAction('admin-cleanup-logs-error', req.user?.name, {
                ip: req.ip,
                error: err.message
            });
            return res.status(500).json(
                error('Failed to cleanup logs', 'CLEANUP_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/logs/export
     * Exporte les logs en JSON ou CSV
     */
    static async exportLogs(req, res) {
        try {
            const { format = 'json', limit = 10000 } = req.query;

            if (!['json', 'csv'].includes(format)) {
                return res.status(400).json(
                    error('Format must be json or csv', 'INVALID_FORMAT')
                );
            }

            const data = await LogService.export(
                format,
                Math.min(parseInt(limit) || 10000, 100000)
            );

            if (format === 'csv') {
                res.set('Content-Type', 'text/csv');
                res.set('Content-Disposition', 'attachment; filename="logs.csv"');
            } else {
                res.set('Content-Type', 'application/json');
                res.set('Content-Disposition', 'attachment; filename="logs.json"');
            }

            res.send(data);
        } catch (err) {
            return res.status(500).json(
                error('Failed to export logs', 'EXPORT_ERROR', err.message)
            );
        }
    }

    /**
     * POST /api/logs/clear
     * ⚠️ DANGER: Supprime TOUS les logs (admin only)
     */
    static async clearAllLogs(req, res) {
        try {
            // Extra validation: confirmClear token
            const { confirm } = req.body;

            if (confirm !== 'DELETE_ALL_LOGS') {
                return res.status(400).json(
                    error(
                        'Clear confirmation token required: confirm="DELETE_ALL_LOGS"',
                        'CONFIRM_REQUIRED'
                    )
                );
            }

            // Log BEFORE clearing!
            await LogService.logAction('DANGER-clear-all-logs', req.user?.name, {
                ip: req.ip,
                warning: 'ALL LOGS CLEARED BY ADMIN'
            });

            const result = await LogService.cleanup();

            return res.json(success(
                { ...result, warning: 'All logs have been cleared' },
                'All logs cleared'
            ));
        } catch (err) {
            await LogService.logAction('DANGER-clear-all-logs-error', req.user?.name, {
                ip: req.ip,
                error: err.message
            });
            return res.status(500).json(
                error('Failed to clear logs', 'CLEAR_ERROR', err.message)
            );
        }
    }
}

module.exports = LogController;
