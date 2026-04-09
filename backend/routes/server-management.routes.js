/**
 * js/routes/server-management.routes.js
 * 
 * Routes de gestion des serveurs (persistance DB + lock/unlock)
 * 
 * Toutes les routes sont protégées par JWT + RBAC
 * 
 * Game Master: peut créer/modifier/supprimer ses propres serveurs
 * Admin: peut gérer tous les serveurs + lock/unlock
 * Viewer: lecture seule (pas d'endpoint ici)
 * 
 * Routes:
 * - GET /servers (list)
 * - GET /servers/:id (get one)
 * - POST /servers (create)
 * - PATCH /servers/:id (update)
 * - DELETE /servers/:id (delete)
 * - POST /servers/:id/lock (admin-only)
 * - POST /servers/:id/unlock (admin-only)
 */

const express = require('express');
const router = express.Router();

const ServerManagementController = require('../controllers/server-management.controller');
const { authorizeRole } = require('../middleware/jwt.middleware');

/**
 * GET /api/servers/managed
 * Lister les serveurs
 * 
 * Game Masters: voir seulement leurs serveurs
 * Admins: voir tous les serveurs
 * Viewers: pas d'accès direct - utiliser GET /api/servers (readonly)
 */
router.get(
    '/',
    authorizeRole('admin', 'game_master'),
    ServerManagementController.listServers
);

/**
 * GET /api/servers/managed/:id
 * Récupérer détails d'un serveur
 */
router.get(
    '/:id',
    authorizeRole('admin', 'game_master'),
    ServerManagementController.getServer
);

/**
 * POST /api/servers/managed
 * Créer un nouveau serveur
 * 
 * Body: { name, port, config_json, mods }
 */
router.post(
    '/',
    authorizeRole('admin', 'game_master'),
    ServerManagementController.createServer
);

/**
 * PATCH /api/servers/managed/:id
 * Mettre à jour un serveur
 * 
 * Body: { name, config_json, mods }
 */
router.patch(
    '/:id',
    authorizeRole('admin', 'game_master'),
    ServerManagementController.updateServer
);

/**
 * DELETE /api/servers/managed/:id
 * Supprimer un serveur
 * 
 * Game Masters: peuvent supprimer leurs serveurs (non-locked)
 * Admins: peuvent supprimer n'importe quel serveur (non-locked)
 */
router.delete(
    '/:id',
    authorizeRole('admin', 'game_master'),
    ServerManagementController.deleteServer
);

/**
 * POST /api/servers/managed/:id/lock
 * Verrouiller un serveur (admin-only)
 * 
 * Empêche la suppression et toute modification par les Game Masters
 */
router.post(
    '/:id/lock',
    authorizeRole('admin'),
    ServerManagementController.lockServer
);

/**
 * POST /api/servers/managed/:id/unlock
 * Déverrouiller un serveur (admin-only)
 */
router.post(
    '/:id/unlock',
    authorizeRole('admin'),
    ServerManagementController.unlockServer
);

module.exports = router;
