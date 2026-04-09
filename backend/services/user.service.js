/**
 * js/services/user.service.js
 * 
 * Service de gestion des utilisateurs (CRUD)
 * Responsabilités:
 * - Lister utilisateurs
 * - Récupérer détails d'un utilisateur
 * - Supprimer utilisateur
 * - Changer rôle utilisateur
 * - Activer/désactiver utilisateur
 */

const { getDB } = require('../db/database');
const AuthService = require('./auth.service');

/**
 * Lister tous les utilisateurs (page + filtres)
 * 
 * @param {Object} options - {search, role, is_active, limit, offset}
 * @returns {Object} {total, users}
 */
function getAllUsers(options = {}) {
    try {
        const { search = '', role = null, is_active = 1, limit = 50, offset = 0 } = options;

        let query = 'SELECT id, username, email, role, is_active, created_at, last_login FROM users WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        const params = [];
        const countParams = [];

        // Filtre: actif/inactif
        if (is_active !== null) {
            query += ' AND is_active = ?';
            countQuery += ' AND is_active = ?';
            params.push(is_active);
            countParams.push(is_active);
        }

        // Filtre: rôle
        if (role) {
            query += ' AND role = ?';
            countQuery += ' AND role = ?';
            params.push(role);
            countParams.push(role);
        }

        // Recherche: username ou email
        if (search) {
            query += ` AND (username LIKE ? OR email LIKE ?)`;
            countQuery += ` AND (username LIKE ? OR email LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm);
        }

        // Récupérer total
        const countResult = getDB().prepare(countQuery).get(...countParams);
        const total = countResult.total;

        // Paginer
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const users = getDB().prepare(query).all(...params);

        return {
            success: true,
            data: {
                total,
                count: users.length,
                limit,
                offset,
                users
            }
        };
    } catch (err) {
        console.error('[UserService.getAllUsers]', err);
        return {
            success: false,
            error: 'Failed to fetch users'
        };
    }
}

/**
 * Récupérer un utilisateur par ID
 * 
 * @param {number} user_id - ID utilisateur
 * @returns {Object} {success, user, error}
 */
function getUserById(user_id) {
    try {
        const user = getDB().prepare(`
            SELECT id, username, email, role, is_active, created_at, last_login 
            FROM users 
            WHERE id = ?
        `).get(user_id);

        if (!user) {
            return {
                success: false,
                error: 'User not found'
            };
        }

        return {
            success: true,
            user
        };
    } catch (err) {
        console.error('[UserService.getUserById]', err);
        return {
            success: false,
            error: 'Failed to fetch user'
        };
    }
}

/**
 * Supprimer un utilisateur
 * 
 * @param {number} user_id - ID utilisateur à supprimer
 * @param {number} requesting_user_id - ID de l'admin qui supprime (audit)
 * @returns {Object} {success, error}
 */
function deleteUser(user_id, requesting_user_id) {
    try {
        // Vérifier que ce n'est pas le dernier admin
        if (user_id === 1) {
            return {
                success: false,
                error: 'Cannot delete the default admin user'
            };
        }

        const user = getDB().prepare('SELECT * FROM users WHERE id = ?').get(user_id);
        
        if (!user) {
            return {
                success: false,
                error: 'User not found'
            };
        }

        // Ne pas autoriser de supprimer un autre admin si on n'est pas soi-même admin
        if (user.role === 'admin') {
            const requestingUser = getDB().prepare('SELECT role FROM users WHERE id = ?').get(requesting_user_id);
            if (requestingUser.role !== 'admin') {
                return {
                    success: false,
                    error: 'Only admins can delete other admins'
                };
            }
        }

        // Supprimer l'utilisateur
        getDB().prepare('DELETE FROM users WHERE id = ?').run(user_id);

        // Log audit
        _logAudit(requesting_user_id, 'user_deleted', 'user', user_id, `Deleted user: ${user.username}`);

        return {
            success: true,
            message: `User ${user.username} deleted`
        };
    } catch (err) {
        console.error('[UserService.deleteUser]', err);
        return {
            success: false,
            error: 'Failed to delete user'
        };
    }
}

/**
 * Changer le rôle d'un utilisateur
 * 
 * @param {number} user_id - ID utilisateur
 * @param {string} newRole - Nouveau rôle (admin, game_master, viewer)
 * @param {number} requesting_user_id - ID de l'admin qui change (audit)
 * @returns {Object} {success, error}
 */
function updateUserRole(user_id, newRole, requesting_user_id) {
    try {
        const validRoles = ['admin', 'game_master', 'viewer'];
        if (!validRoles.includes(newRole)) {
            return {
                success: false,
                error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
            };
        }

        const user = getDB().prepare('SELECT * FROM users WHERE id = ?').get(user_id);
        
        if (!user) {
            return {
                success: false,
                error: 'User not found'
            };
        }

        if (user.role === newRole) {
            return {
                success: false,
                error: `User already has role: ${newRole}`
            };
        }

        // Mettre à jour le rôle
        getDB().prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(newRole, user_id);

        // Log audit
        _logAudit(
            requesting_user_id,
            'role_changed',
            'user',
            user_id,
            `Changed role: ${user.role} → ${newRole}`
        );

        return {
            success: true,
            message: `User ${user.username} role changed to ${newRole}`
        };
    } catch (err) {
        console.error('[UserService.updateUserRole]', err);
        return {
            success: false,
            error: 'Failed to update user role'
        };
    }
}

/**
 * Activer ou désactiver un utilisateur
 * 
 * @param {number} user_id - ID utilisateur
 * @param {boolean} isActive - Active ou pas
 * @param {number} requesting_user_id - ID de l'admin (audit)
 * @returns {Object} {success, error}
 */
function updateUserStatus(user_id, isActive, requesting_user_id) {
    try {
        const user = getDB().prepare('SELECT * FROM users WHERE id = ?').get(user_id);
        
        if (!user) {
            return {
                success: false,
                error: 'User not found'
            };
        }

        if (user.is_active === (isActive ? 1 : 0)) {
            const status = isActive ? 'already active' : 'already inactive';
            return {
                success: false,
                error: `User is ${status}`
            };
        }

        // Mettre à jour le statut
        getDB().prepare('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(isActive ? 1 : 0, user_id);

        // Log audit
        const action = isActive ? 'user_enabled' : 'user_disabled';
        _logAudit(requesting_user_id, action, 'user', user_id, `User ${user.username} ${isActive ? 'enabled' : 'disabled'}`);

        return {
            success: true,
            message: `User ${user.username} ${isActive ? 'enabled' : 'disabled'}`
        };
    } catch (err) {
        console.error('[UserService.updateUserStatus]', err);
        return {
            success: false,
            error: 'Failed to update user status'
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
        console.error('[UserService._logAudit]', err);
    }
}

module.exports = {
    getAllUsers,
    getUserById,
    deleteUser,
    updateUserRole,
    updateUserStatus
};
