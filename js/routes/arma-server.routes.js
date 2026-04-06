/**
 * routes/arma-server.routes.js
 * Routes pour les opérations du serveur Arma
 */

const express = require('express');
const router = express.Router();

const ArmaServerController = require('../controllers/arma-server.controller');

/**
 * GET /api/arma-server/status
 * Récupère le statut du serveur Arma
 */
router.get('/status', (req, res) => {
    return ArmaServerController.getStatus(req, res);
});

/**
 * GET /api/arma-server/check-updates
 * Vérifie les mises à jour disponibles
 */
router.get('/check-updates', (req, res) => {
    return ArmaServerController.checkUpdates(req, res);
});

/**
 * POST /api/arma-server/start
 * Démarre le serveur Arma
 * Requires: auth middleware
 */
router.post('/start', (req, res) => {
    return ArmaServerController.startServer(req, res);
});

/**
 * POST /api/arma-server/stop
 * Arrête le serveur Arma
 * Requires: auth middleware
 */
router.post('/stop', (req, res) => {
    return ArmaServerController.stopServer(req, res);
});

/**
 * POST /api/arma-server/update
 * Déclenche une mise à jour
 * Requires: auth middleware
 */
router.post('/update', (req, res) => {
    return ArmaServerController.updateServer(req, res);
});

module.exports = router;
