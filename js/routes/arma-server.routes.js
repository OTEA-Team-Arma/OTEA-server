/**
 * routes/servers.routes.js
 * Routes pour les opérations des serveurs Arma
 */

const express = require('express');
const router = express.Router();

const ArmaServerController = require('../controllers/arma-server.controller');
const ArmaLogsController = require('../controllers/arma-logs.controller');

/**
 * GET /api/servers
 * Liste le statut de tous les serveurs
 */
router.get('/', ArmaServerController.getAllServers);

/**
 * GET /api/servers/health
 * Health check pour tous les serveurs
 */
router.get('/health', ArmaServerController.healthCheck);

/**
 * GET /api/servers/:port
 * Récupère le statut d'un serveur spécifique
 */
router.get('/:port', ArmaServerController.getServerStatus);

/**
 * GET /api/servers/info/:port
 * Récupère les infos détaillées d'un serveur
 */
router.get('/info/:port', ArmaServerController.getServerInfo);

/**
 * POST /api/servers
 * Lance un nouveau serveur
 */
router.post('/', ArmaServerController.startServer);

/**
 * POST /api/servers/:port/restart
 * Redémarre un serveur
 */
router.post('/:port/restart', ArmaServerController.restartServer);

/**
 * PUT /api/servers/:port/config
 * Met à jour la configuration d'un serveur
 */
router.put('/:port/config', ArmaServerController.updateServerConfig);

/**
 * DELETE /api/servers/:port
 * Arrête un serveur
 */
router.delete('/:port', ArmaServerController.stopServer);

// =========================================================================
// LOGS ROUTES - Streaming et filtrage des logs Arma
// =========================================================================

/**
 * GET /api/servers/:port/logs/filters
 * Récupère les presets de filtrage disponibles
 */
router.get('/:port/logs/filters', ArmaLogsController.getFilterPresets);

/**
 * GET /api/servers/:port/logs/stream
 * Stream des logs en temps réel (compatible long polling)
 * Query params: filter, preset, level, since
 */
router.get('/:port/logs/stream', ArmaLogsController.getServerLogsStream);

/**
 * GET /api/servers/:port/logs/stats
 * Récupère les stats des logs
 */
router.get('/:port/logs/stats', ArmaLogsController.getLogsStats);

/**
 * GET /api/servers/:port/logs
 * Récupère les logs du serveur avec filtres optionnels
 * Query params: filter, preset, limit, level, since
 */
router.get('/:port/logs', ArmaLogsController.getServerLogs);

/**
 * DELETE /api/servers/:port/logs
 * Vide tous les logs du serveur
 */
router.delete('/:port/logs', ArmaLogsController.clearLogs);

module.exports = router;
