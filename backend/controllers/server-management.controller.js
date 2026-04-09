/**
 * js/controllers/server-management.controller.js
 * 
 * Contrôleur de gestion des serveurs (persistance DB)
 * Endpoints:
 * - GET /api/servers/managed (list all - with filters)
 * - GET /api/servers/managed/:id (get one)
 * - POST /api/servers (create)
 * - PATCH /api/servers/:id (update)
 * - DELETE /api/servers/:id (delete)
 * - POST /api/servers/:id/lock (admin-only)
 * - POST /api/servers/:id/unlock (admin-only)
 * 
 * Ownership: Game Masters can only manage their own servers
 */

const { success, error } = require('../models/responses');
const ServerManagementService = require('../services/server-management.service');

/**
 * GET /api/servers/managed
 * Lister les serveurs (avec filtres)
 * 
 * Query params: 
 * - owner_id (filter by owner)
 * - locked (true/false, filter by lock status)
 * - limit (pagination)
 * - offset (pagination)
 */
async function listServers(req, res) {
    try {
        const { owner_id, locked, limit = 50, offset = 0 } = req.query;

        // Si l'utilisateur est game_master (non-admin), restreindre à ses serveurs
        let filter_owner_id = owner_id;
        if (req.user.role === 'game_master' && !owner_id) {
            filter_owner_id = req.user.user_id;
        }

        const result = ServerManagementService.getAllServers({
            owner_id: filter_owner_id ? parseInt(filter_owner_id) : null,
            locked: locked !== undefined ? Boolean(locked === 'true') : null,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        if (!result.success) {
            return res.status(500).json(error(result.error, 'LIST_SERVERS_FAILED'));
        }

        return res.status(200).json(success(
            { total: result.total, count: result.count, servers: result.servers },
            `Retrieved ${result.count} server(s)`
        ));
    } catch (err) {
        console.error('[ServerManagementController.listServers]', err);
        return res.status(500).json(error(err.message, 'LIST_SERVERS_FAILED'));
    }
}

/**
 * GET /api/servers/managed/:id
 * Récupérer détails d'un serveur
 */
async function getServer(req, res) {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json(error('Invalid server ID', 'INVALID_ID'));
        }

        const result = ServerManagementService.getServerById(parseInt(id));

        if (!result.success) {
            return res.status(404).json(error(result.error, 'SERVER_NOT_FOUND'));
        }

        // Vérifier ownership (si game_master)
        if (req.user.role === 'game_master' && result.server.owner_id !== req.user.user_id) {
            return res.status(403).json(error('You can only view your own servers', 'FORBIDDEN'));
        }

        return res.status(200).json(success(result.server, 'Server details retrieved'));
    } catch (err) {
        console.error('[ServerManagementController.getServer]', err);
        return res.status(500).json(error(err.message, 'GET_SERVER_FAILED'));
    }
}

/**
 * POST /api/servers
 * Créer un nouveau serveur
 * 
 * Body: { name, port, config_json, mods }
 * 
 * Game Masters: peuvent créer leurs propres serveurs
 * Admins: peuvent créer pour n'importe qui
 */
async function createServer(req, res) {
    try {
        const { name, port, config_json, mods } = req.body;

        // Validation
        if (!name || !port) {
            return res.status(400).json(error('Missing required fields: name, port', 'MISSING_FIELDS'));
        }

        if (isNaN(parseInt(port)) || port < 2301 || port > 65535) {
            return res.status(400).json(error('Port must be between 2301 and 65535', 'INVALID_PORT'));
        }

        // Le propriétaire du serveur est l'utilisateur courant
        const owner_id = req.user.user_id;

        const result = ServerManagementService.createServer({
            name,
            port: parseInt(port),
            owner_id,
            config_json: config_json || null,
            mods: mods || null
        });

        if (!result.success) {
            return res.status(400).json(error(result.error, 'CREATE_SERVER_FAILED'));
        }

        return res.status(201).json(success(
            { id: result.server_id, name, port, owner_id },
            result.message
        ));
    } catch (err) {
        console.error('[ServerManagementController.createServer]', err);
        return res.status(500).json(error(err.message, 'CREATE_SERVER_FAILED'));
    }
}

/**
 * PATCH /api/servers/:id
 * Mettre à jour un serveur (nom, config, mods)
 * 
 * Body: { name, config_json, mods }
 */
async function updateServer(req, res) {
    try {
        const { id } = req.params;
        const { name, config_json, mods } = req.body;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json(error('Invalid server ID', 'INVALID_ID'));
        }

        const server_id = parseInt(id);
        const serverResult = ServerManagementService.getServerById(server_id);

        if (!serverResult.success) {
            return res.status(404).json(error(serverResult.error, 'SERVER_NOT_FOUND'));
        }

        // Vérifier permissions
        if (!ServerManagementService.canManageServer(server_id, req.user.user_id, req.user.role)) {
            return res.status(403).json(error('You cannot manage this server', 'FORBIDDEN'));
        }

        // Vérifier si locked
        if (serverResult.server.locked) {
            return res.status(403).json(error('Cannot update a locked server', 'SERVER_LOCKED'));
        }

        const result = ServerManagementService.updateServer(server_id, {
            name,
            config_json,
            mods
        });

        if (!result.success) {
            return res.status(400).json(error(result.error, 'UPDATE_FAILED'));
        }

        return res.status(200).json(success({ id: server_id }, result.message));
    } catch (err) {
        console.error('[ServerManagementController.updateServer]', err);
        return res.status(500).json(error(err.message, 'UPDATE_FAILED'));
    }
}

/**
 * DELETE /api/servers/:id
 * Supprimer un serveur
 * 
 * Game Masters: peuvent supprimer leurs propres serveurs
 * Admins: peuvent supprimer n'importe quel serveur
 * Viewers: ne peuvent rien supprimer
 */
async function deleteServer(req, res) {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json(error('Invalid server ID', 'INVALID_ID'));
        }

        const server_id = parseInt(id);

        // Vérifier permissions
        if (!ServerManagementService.canManageServer(server_id, req.user.user_id, req.user.role)) {
            return res.status(403).json(error('You cannot delete this server', 'FORBIDDEN'));
        }

        const result = ServerManagementService.deleteServer(server_id, req.user.user_id);

        if (!result.success) {
            return res.status(400).json(error(result.error, 'DELETE_FAILED'));
        }

        return res.status(200).json(success({ id: server_id }, result.message));
    } catch (err) {
        console.error('[ServerManagementController.deleteServer]', err);
        return res.status(500).json(error(err.message, 'DELETE_FAILED'));
    }
}

/**
 * POST /api/servers/:id/lock
 * Verrouiller un serveur (admin-only)
 * 
 * Empêche la suppression et toute modification
 */
async function lockServer(req, res) {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json(error('Invalid server ID', 'INVALID_ID'));
        }

        const server_id = parseInt(id);

        // Vérifier permissions (admin-only)
        if (req.user.role !== 'admin') {
            return res.status(403).json(error('Only admins can lock servers', 'FORBIDDEN'));
        }

        const result = ServerManagementService.lockServer(server_id, req.user.user_id);

        if (!result.success) {
            return res.status(400).json(error(result.error, 'LOCK_FAILED'));
        }

        return res.status(200).json(success({ id: server_id, locked: true }, result.message));
    } catch (err) {
        console.error('[ServerManagementController.lockServer]', err);
        return res.status(500).json(error(err.message, 'LOCK_FAILED'));
    }
}

/**
 * POST /api/servers/:id/unlock
 * Déverrouiller un serveur (admin-only)
 */
async function unlockServer(req, res) {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json(error('Invalid server ID', 'INVALID_ID'));
        }

        const server_id = parseInt(id);

        // Vérifier permissions (admin-only)
        if (req.user.role !== 'admin') {
            return res.status(403).json(error('Only admins can unlock servers', 'FORBIDDEN'));
        }

        const result = ServerManagementService.unlockServer(server_id, req.user.user_id);

        if (!result.success) {
            return res.status(400).json(error(result.error, 'UNLOCK_FAILED'));
        }

        return res.status(200).json(success({ id: server_id, locked: false }, result.message));
    } catch (err) {
        console.error('[ServerManagementController.unlockServer]', err);
        return res.status(500).json(error(err.message, 'UNLOCK_FAILED'));
    }
}

module.exports = {
    listServers,
    getServer,
    createServer,
    updateServer,
    deleteServer,
    lockServer,
    unlockServer
};
