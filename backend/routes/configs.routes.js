/**
 * configs.routes.js
 *
 * Routes pour la gestion des configurations serveur
 */

const express = require('express');
const router = express.Router();
const ConfigsController = require('../controllers/configs.controller');

// Liste toutes les configs
router.get('/', ConfigsController.listConfigs);

// Charge une config spécifique
router.get('/:filename', ConfigsController.loadConfig);

// Crée une nouvelle config
router.post('/', ConfigsController.createConfig);

// Met à jour une config
router.put('/:filename', ConfigsController.updateConfig);

// Supprime une config
router.delete('/:filename', ConfigsController.deleteConfig);

module.exports = router;
