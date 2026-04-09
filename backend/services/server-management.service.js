/**
 * js/services/server-management.service.js
 * 
 * Service de gestion des serveurs (persistance DB)
 * Responsabilités:
 * - CRUD serveurs en base de données
 * - Lock/unlock serveurs
 * - Ownership validations (Game Masters)
 * - Server configuration management
 * 
 * Note: Distinct de ArmaServerService qui gère le lancement/arrêt du process
 */

const { getDB } = require('../db/database');

/**
 * Créer un serveur dans la DB
 * 
 * @param {Object} serverData - {name, port, owner_id, config_json, mods}
 * @returns {Object} {success, server_id, error}
 */
function createServer(serverData) {
    try {
        const { name, port, owner_id, config_json = null, mods = null } = serverData;

        if (!name || !port || !owner_id) {
            return {
                success: false,
                error: 'Missing required fields: name, port, owner_id'
            };
        }

        // Vérifier port unique
        const existingPort = getDB().prepare('SELECT id FROM servers WHERE port = ?').get(port);
        if (existingPort) {
            return {
                success: false,
                error: `Port ${port} already in use`
            };
        }

        // Créer serveur
        const result = getDB().prepare(`
            INSERT INTO servers (name, port, owner_id, config_json, mods, locked)
            VALUES (?, ?, ?, ?, ?, 0)
        `).run(name, port, owner_id, config_json, mods);

        return {
            success: true,
            server_id: result.lastInsertRowid,
            message: `Server ${name} created on port ${port}`
        };
    } catch (err) {
        console.error('[ServerManagementService.createServer]', err);
        if (err.message.includes('UNIQUE constraint failed')) {
            return {
                success: false,
                error: 'Port already exists'
            };
        }
        return {
            success: false,
            error: 'Failed to create server'
        };
    }
}

/**
 * Récupérer tous les serveurs
 * 
 * @param {Object} options - {owner_id (filter), locked, limit, offset}
 * @returns {Object} {success, total, servers, error}
 */
function getAllServers(options = {}) {
    try {
        const { owner_id = null, locked = null, limit = 50, offset = 0 } = options;

        let query = `
            SELECT 
                id, name, port, owner_id, 
                (SELECT username FROM users WHERE id = servers.owner_id) as owner_username,
                locked, locked_by_admin_id, locked_at,
                config_json, mods, created_at, updated_at
            FROM servers
            WHERE 1=1
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM servers WHERE 1=1';
        const params = [];
        const countParams = [];

        // Filtre: propriétaire
        if (owner_id) {
            query += ' AND owner_id = ?';
            countQuery += ' AND owner_id = ?';
            params.push(owner_id);
            countParams.push(owner_id);
        }

        // Filtre: locked/unlocked
        if (locked !== null) {
            query += ' AND locked = ?';
            countQuery += ' AND locked = ?';
            params.push(locked ? 1 : 0);
            countParams.push(locked ? 1 : 0);
        }

        // Récupérer total
        const countResult = getDB().prepare(countQuery).get(...countParams);
        const total = countResult.total;

        // Paginer
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const servers = getDB().prepare(query).all(...params);

        return {
            success: true,
            total,
            count: servers.length,
            servers
        };
    } catch (err) {
        console.error('[ServerManagementService.getAllServers]', err);
        return {
            success: false,
            error: 'Failed to fetch servers'
        };
    }
}

/**
 * Récupérer un serveur par ID
 * 
 * @param {number} server_id - ID du serveur
 * @returns {Object} {success, server, error}
 */
function getServerById(server_id) {
    try {
        const server = getDB().prepare(`
            SELECT 
                id, name, port, owner_id,
                (SELECT username FROM users WHERE id = servers.owner_id) as owner_username,
                locked, locked_by_admin_id, locked_at,
                config_json, mods, created_at, updated_at
            FROM servers
            WHERE id = ?
        `).get(server_id);

        if (!server) {
            return {
                success: false,
                error: 'Server not found'
            };
        }

        return {
            success: true,
            server
        };
    } catch (err) {
        console.error('[ServerManagementService.getServerById]', err);
        return {
            success: false,
            error: 'Failed to fetch server'
        };
    }
}

/**
 * Mettre à jour un serveur (nom, config, mods)
 * 
 * @param {number} server_id - ID serveur
 * @param {Object} updates - {name, config_json, mods}
 * @returns {Object} {success, error}
 */
function updateServer(server_id, updates) {
    try {
        const server = getDB().prepare('SELECT * FROM servers WHERE id = ?').get(server_id);
        
        if (!server) {
            return {
                success: false,
                error: 'Server not found'
            };
        }

        const { name, config_json, mods } = updates;
        
        let query = 'UPDATE servers SET updated_at = CURRENT_TIMESTAMP';
        const params = [];

        if (name !== undefined) {
            query += ', name = ?';
            params.push(name);
        }

        if (config_json !== undefined) {
            query += ', config_json = ?';
            params.push(config_json);
        }

        if (mods !== undefined) {
            query += ', mods = ?';
            params.push(mods);
        }

        query += ' WHERE id = ?';
        params.push(server_id);

        getDB().prepare(query).run(...params);

        return {
            success: true,
            message: 'Server updated successfully'
        };
    } catch (err) {
        console.error('[ServerManagementService.updateServer]', err);
        return {
            success: false,
            error: 'Failed to update server'
        };
    }
}

/**
 * Supprimer un serveur
 * 
 * @param {number} server_id - ID du serveur à supprimer
 * @param {number} requesting_user_id - ID de l'utilisateur qui supprime (audit)
 * @returns {Object} {success, error}
 */
function deleteServer(server_id, requesting_user_id) {
    try {
        const server = getDB().prepare('SELECT * FROM servers WHERE id = ?').get(server_id);
        
        if (!server) {
            return {
                success: false,
                error: 'Server not found'
            };
        }

        if (server.locked) {
            return {
                success: false,
                error: 'Cannot delete a locked server. Unlock it first.'
            };
        }

        // Supprimer le serveur
        getDB().prepare('DELETE FROM servers WHERE id = ?').run(server_id);

        // Log audit
        _logAudit(
            requesting_user_id,
            'server_deleted',
            'server',
            server_id,
            `Deleted server: ${server.name} (port ${server.port})`
        );

        return {
            success: true,
            message: `Server ${server.name} deleted`
        };
    } catch (err) {
        console.error('[ServerManagementService.deleteServer]', err);
        return {
            success: false,
            error: 'Failed to delete server'
        };
    }
}

/**
 * Verrouiller un serveur (admin-only)
 * 
 * @param {number} server_id - ID du serveur
 * @param {number} admin_user_id - ID de l'admin
 * @returns {Object} {success, error}
 */
function lockServer(server_id, admin_user_id) {
    try {
        const server = getDB().prepare('SELECT * FROM servers WHERE id = ?').get(server_id);
        
        if (!server) {
            return {
                success: false,
                error: 'Server not found'
            };
        }

        if (server.locked) {
            return {
                success: false,
                error: 'Server is already locked'
            };
        }

        // Verrouiller
        getDB().prepare(`
            UPDATE servers 
            SET locked = 1, locked_by_admin_id = ?, locked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(admin_user_id, server_id);

        // Log audit
        _logAudit(admin_user_id, 'server_locked', 'server', server_id, `Server locked: ${server.name}`);

        return {
            success: true,
            message: `Server ${server.name} locked by admin`
        };
    } catch (err) {
        console.error('[ServerManagementService.lockServer]', err);
        return {
            success: false,
            error: 'Failed to lock server'
        };
    }
}

/**
 * Déverrouiller un serveur (admin-only)
 * 
 * @param {number} server_id - ID du serveur
 * @param {number} admin_user_id - ID de l'admin
 * @returns {Object} {success, error}
 */
function unlockServer(server_id, admin_user_id) {
    try {
        const server = getDB().prepare('SELECT * FROM servers WHERE id = ?').get(server_id);
        
        if (!server) {
            return {
                success: false,
                error: 'Server not found'
            };
        }

        if (!server.locked) {
            return {
                success: false,
                error: 'Server is not locked'
            };
        }

        // Déverrouiller
        getDB().prepare(`
            UPDATE servers 
            SET locked = 0, locked_by_admin_id = NULL, locked_at = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(server_id);

        // Log audit
        _logAudit(admin_user_id, 'server_unlocked', 'server', server_id, `Server unlocked: ${server.name}`);

        return {
            success: true,
            message: `Server ${server.name} unlocked by admin`
        };
    } catch (err) {
        console.error('[ServerManagementService.unlockServer]', err);
        return {
            success: false,
            error: 'Failed to unlock server'
        };
    }
}

/**
 * Vérifier que l'utilisateur est propriétaire du serveur
 * (Pour Game Master ownership enforcement)
 * 
 * @param {number} server_id - ID du serveur
 * @param {number} user_id - ID de l'utilisateur
 * @param {string} user_role - Rôle de l'utilisateur (admin, game_master, viewer)
 * @returns {boolean}
 */
function canManageServer(server_id, user_id, user_role) {
    // Les admins peuvent gérer tous les serveurs
    if (user_role === 'admin') {
        return true;
    }

    // Pour les game masters, vérifier qu'ils sont propriétaires
    if (user_role === 'game_master') {
        const server = getDB().prepare('SELECT owner_id FROM servers WHERE id = ?').get(server_id);
        return server && server.owner_id === user_id;
    }

    // Les viewers ne peuvent rien gérer
    return false;
}

/**
 * Récupérer tous les serveurs d'un Game Master
 * 
 * @param {number} user_id - ID du Game Master
 * @returns {Object} {success, servers, error}
 */
function getGameMasterServers(user_id) {
    try {
        const servers = getDB().prepare(`
            SELECT 
                id, name, port, owner_id, locked, locked_by_admin_id, locked_at,
                config_json, mods, created_at, updated_at
            FROM servers
            WHERE owner_id = ?
            ORDER BY created_at DESC
        `).all(user_id);

        return {
            success: true,
            servers
        };
    } catch (err) {
        console.error('[ServerManagementService.getGameMasterServers]', err);
        return {
            success: false,
            error: 'Failed to fetch servers'
        };
    }
}

/**
 * Enregistrer une action dans l'audit log
 * 
 * @private
 */
function _logAudit(user_id, action, resourceType, resourceId, details) {
    try {
        getDB().prepare(`
            INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
            VALUES (?, ?, ?, ?, ?)
        `).run(user_id, action, resourceType, resourceId, details);
    } catch (err) {
        console.error('[ServerManagementService._logAudit]', err);
    }
}

module.exports = {
    createServer,
    getAllServers,
    getServerById,
    updateServer,
    deleteServer,
    lockServer,
    unlockServer,
    canManageServer,
    getGameMasterServers
};
