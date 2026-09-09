/**
 * system.routes.js
 *
 * Routes pour la gestion des chemins système
 */

const express = require('express');
const router = express.Router();
const systemController = require('../controllers/system.controller');

// GET /api/system/paths - Récupérer les chemins système
router.get('/paths', systemController.getSystemPaths);

// PUT /api/system/paths - Mettre à jour les chemins système
router.put('/paths', systemController.updateSystemPaths);

// GET /api/system/app-config - Récupérer la configuration de l'application
router.get('/app-config', systemController.getAppConfig);

module.exports = router;
