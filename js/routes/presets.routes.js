/**
 * routes/presets.routes.js
 * Routes pour la gestion des presets de serveur
 */

const express = require('express');
const router = express.Router();

const PresetsController = require('../controllers/presets.controller');

/**
 * GET /api/presets
 * Liste tous les presets
 */
router.get('/', PresetsController.listPresets);

/**
 * GET /api/presets/stats
 * Récupère les statistiques des presets
 */
router.get('/stats', PresetsController.getStats);

/**
 * GET /api/presets/template
 * Récupère un template par défaut
 */
router.get('/template', PresetsController.getTemplate);

/**
 * GET /api/presets/search
 * Recherche les presets par pattern
 */
router.get('/search', PresetsController.searchPresets);

/**
 * GET /api/presets/:id
 * Charge un preset spécifique
 */
router.get('/:id', PresetsController.loadPreset);

/**
 * GET /api/presets/:id/export
 * Exporte un preset en JSON
 */
router.get('/:id/export', PresetsController.exportPreset);

/**
 * POST /api/presets
 * Crée ou met à jour un preset
 */
router.post('/', PresetsController.savePreset);

/**
 * POST /api/presets/import
 * Importe un preset depuis des données externes
 */
router.post('/import', PresetsController.importPreset);

/**
 * POST /api/presets/:sourceId/duplicate/:destId
 * Duplique un preset
 */
router.post('/:sourceId/duplicate/:destId', PresetsController.duplicatePreset);

/**
 * DELETE /api/presets/:id
 * Supprime un preset
 */
router.delete('/:id', PresetsController.deletePreset);

module.exports = router;
