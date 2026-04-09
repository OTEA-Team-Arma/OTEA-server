/**
 * routes/updates.routes.js
 * Routes pour les opérations de mise à jour du serveur Arma
 */

const express = require('express');
const router = express.Router();

const UpdateController = require('../controllers/update.controller');

/**
 * GET /api/updates/check
 * Vérifie si une mise à jour est disponible
 */
router.get('/check', UpdateController.checkForUpdates);

/**
 * GET /api/updates/status
 * Récupère le statut de la dernière mise à jour
 */
router.get('/status', UpdateController.getUpdateStatus);

/**
 * POST /api/updates/trigger
 * Déclenche une mise à jour du serveur Arma
 */
router.post('/trigger', UpdateController.triggerUpdate);

/**
 * POST /api/updates/verify
 * Valide qu'une mise à jour a réussi
 */
router.post('/verify', UpdateController.verifyUpdate);

module.exports = router;
