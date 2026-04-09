/**
 * js/controllers/user.controller.js
 * 
 * Contrôleur de gestion des utilisateurs (Admin)
 * Responsabilités:
 * - GET /admin/users (list users)
 * - GET /admin/users/:id (user details)
 * - DELETE /admin/users/:id (delete user)
 * - PATCH /admin/users/:id/role (change role)
 * - PATCH /admin/users/:id/status (enable/disable)
 */

const { success, error } = require('../models/responses');
const UserService = require('../services/user.service');

/**
 * GET /admin/users
 * 
 * Lister tous les utilisateurs (avec filtres optionnels)
 * Query params: search, role, is_active, limit, offset
 */
async function listUsers(req, res) {
    try {
        const { search = '', role = null, is_active = 1, limit = 50, offset = 0 } = req.query;

        const result = UserService.getAllUsers({
            search,
            role: role ? role : null,
            is_active: is_active !== 'null' ? parseInt(is_active) : null,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        if (!result.success) {
            return res.status(500).json(error(result.error, 'LIST_USERS_FAILED'));
        }

        return res.status(200).json(success(result.data, `Retrieved ${result.data.count} user(s)`));
    } catch (err) {
        console.error('[UserController.listUsers]', err);
        return res.status(500).json(error(err.message, 'LIST_USERS_FAILED'));
    }
}

/**
 * GET /admin/users/:id
 * 
 * Récupérer détails d'un utilisateur spécifique
 */
async function getUser(req, res) {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json(error('Invalid user ID', 'INVALID_ID'));
        }

        const result = UserService.getUserById(parseInt(id));

        if (!result.success) {
            return res.status(404).json(error(result.error, 'USER_NOT_FOUND'));
        }

        return res.status(200).json(success(result.user, 'User details retrieved'));
    } catch (err) {
        console.error('[UserController.getUser]', err);
        return res.status(500).json(error(err.message, 'GET_USER_FAILED'));
    }
}

/**
 * DELETE /admin/users/:id
 * 
 * Supprimer un utilisateur
 */
async function deleteUser(req, res) {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json(error('Invalid user ID', 'INVALID_ID'));
        }

        if (parseInt(id) === req.user.user_id) {
            return res.status(400).json(error('Cannot delete your own account', 'CANNOT_DELETE_SELF'));
        }

        const result = UserService.deleteUser(parseInt(id), req.user.user_id);

        if (!result.success) {
            return res.status(400).json(error(result.error, 'DELETE_FAILED'));
        }

        return res.status(200).json(success({ id: parseInt(id) }, result.message));
    } catch (err) {
        console.error('[UserController.deleteUser]', err);
        return res.status(500).json(error(err.message, 'DELETE_FAILED'));
    }
}

/**
 * PATCH /admin/users/:id/role
 * 
 * Changer le rôle d'un utilisateur
 * Body: { role: 'admin' | 'game_master' | 'viewer' }
 */
async function changeUserRole(req, res) {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json(error('Invalid user ID', 'INVALID_ID'));
        }

        if (!role) {
            return res.status(400).json(error('Missing role in request body', 'MISSING_ROLE'));
        }

        if (parseInt(id) === req.user.user_id) {
            return res.status(400).json(error('Cannot change your own role', 'CANNOT_CHANGE_SELF_ROLE'));
        }

        const result = UserService.updateUserRole(parseInt(id), role, req.user.user_id);

        if (!result.success) {
            return res.status(400).json(error(result.error, 'ROLE_CHANGE_FAILED'));
        }

        return res.status(200).json(success({ id: parseInt(id), role }, result.message));
    } catch (err) {
        console.error('[UserController.changeUserRole]', err);
        return res.status(500).json(error(err.message, 'ROLE_CHANGE_FAILED'));
    }
}

/**
 * PATCH /admin/users/:id/status
 * 
 * Activer ou désactiver un utilisateur
 * Body: { is_active: true | false }
 */
async function updateUserStatus(req, res) {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json(error('Invalid user ID', 'INVALID_ID'));
        }

        if (is_active === undefined || is_active === null) {
            return res.status(400).json(error('Missing is_active in request body', 'MISSING_STATUS'));
        }

        if (parseInt(id) === req.user.user_id) {
            return res.status(400).json(error('Cannot disable your own account', 'CANNOT_DISABLE_SELF'));
        }

        const result = UserService.updateUserStatus(parseInt(id), Boolean(is_active), req.user.user_id);

        if (!result.success) {
            return res.status(400).json(error(result.error, 'STATUS_UPDATE_FAILED'));
        }

        return res.status(200).json(success({ id: parseInt(id), is_active }, result.message));
    } catch (err) {
        console.error('[UserController.updateUserStatus]', err);
        return res.status(500).json(error(err.message, 'STATUS_UPDATE_FAILED'));
    }
}

module.exports = {
    listUsers,
    getUser,
    deleteUser,
    changeUserRole,
    updateUserStatus
};
