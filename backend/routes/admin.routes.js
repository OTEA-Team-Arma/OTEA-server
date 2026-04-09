/**
 * routes/admin.routes.js
 * Routes pour les opérations administratives
 */

const express = require('express');
const router = express.Router();

const AdminController = require('../controllers/admin.controller');

/**
 * GET /api/admin/health
 * Effectue un health check complet
 */
router.get('/health', AdminController.healthCheck);

/**
 * GET /api/admin/system-info
 * Récupère les informations système
 */
router.get('/system-info', AdminController.getSystemInfo);

/**
 * GET /api/admin/arma-version
 * Récupère la version du serveur Arma installée
 */
router.get('/arma-version', AdminController.getArmaVersion);

/**
 * GET /api/admin/servers-summary
 * Récupère un résumé de tous les serveurs
 */
router.get('/servers-summary', AdminController.getServersSummary);

/**
 * POST /api/admin/restart-server/:port
 * Redémarre un serveur spécifique
 */
router.post('/restart-server/:port', AdminController.restartServer);

/**
 * POST /api/admin/restart-all
 * Redémarre TOUS les serveurs
 */
router.post('/restart-all', AdminController.restartAllServers);

/**
 * POST /api/admin/stop-all
 * Arrête TOUS les serveurs
 */
router.post('/stop-all', AdminController.stopAllServers);

/**
 * POST /api/admin/backup-config
 * Crée un backup de la configuration
 */
router.post('/backup-config', AdminController.backupConfig);

/**
 * POST /api/admin/cleanup-orphans
 * Nettoie les processus orphelins
 */
router.post('/cleanup-orphans', AdminController.cleanupOrphans);

/**
 * POST /api/admin/recycle
 * Recycle OTEA (arrête puis redémarre)
 */
router.post('/recycle', AdminController.recycleOtea);

module.exports = router;
