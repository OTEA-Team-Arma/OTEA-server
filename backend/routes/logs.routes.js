/**
 * routes/logs.routes.js
 * Routes pour la gestion des logs d'administration
 */

const express = require('express');
const router = express.Router();

const LogController = require('../controllers/log.controller');

/**
 * GET /api/logs
 * Récupère les N derniers logs
 */
router.get('/', LogController.getLogs);

/**
 * GET /api/logs/status
 * Récupère le statut des logs
 */
router.get('/status', LogController.getLogStatus);

/**
 * GET /api/logs/search
 * Recherche dans les logs
 */
router.get('/search', LogController.searchLogs);

/**
 * GET /api/logs/user/:username
 * Récupère les logs d'un utilisateur spécifique
 */
router.get('/user/:username', LogController.getLogsByUser);

/**
 * GET /api/logs/action/:action
 * Récupère les logs d'une action spécifique
 */
router.get('/action/:action', LogController.getLogsByAction);

/**
 * GET /api/logs/export
 * Exporte les logs en JSON ou CSV
 */
router.get('/export', LogController.exportLogs);

/**
 * POST /api/logs/cleanup
 * Effectue un nettoyage manuel des logs
 */
router.post('/cleanup', LogController.cleanupLogs);

/**
 * POST /api/logs/clear
 * ⚠️ DANGER: Supprime TOUS les logs (admin only)
 */
router.post('/clear', LogController.clearAllLogs);

module.exports = router;
