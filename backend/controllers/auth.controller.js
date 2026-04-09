/**
 * js/controllers/auth.controller.js
 * 
 * Contrôleur d'authentification
 * Responsabilités:
 * - Endpoint POST /auth/login
 * - Endpoint POST /auth/register (admin only)
 * - Endpoint GET /auth/me (user info)
 * - Endpoint POST /auth/change-password
 */

const { success, error } = require('../models/responses');
const AuthService = require('../services/auth.service');
const { getDB } = require('../db/database');

/**
 * POST /auth/login
 * 
 * Login utilisateur
 * Body: { username, password }
 * Returns: { token, expiresIn, user }
 */
async function login(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json(error(
                'Missing username or password',
                'MISSING_CREDENTIALS'
            ));
        }

        const result = AuthService.login(username, password);

        if (!result.success) {
            return res.status(401).json(error(
                result.error,
                'INVALID_CREDENTIALS'
            ));
        }

        return res.status(200).json(success(
            {
                token: result.token,
                expiresIn: result.expiresIn,
                user: result.user
            },
            `Login successful for ${username}`
        ));
    } catch (err) {
        console.error('[AuthController.login]', err);
        return res.status(500).json(error(
            err.message,
            'LOGIN_FAILED'
        ));
    }
}

/**
 * POST /auth/register
 * 
 * Créer nouvel utilisateur (admin only)
 * Body: { username, password, role, email }
 */
async function register(req, res) {
    try {
        const { username, password, role = 'viewer', email } = req.body;

        if (!username || !password) {
            return res.status(400).json(error(
                'Missing username or password',
                'MISSING_CREDENTIALS'
            ));
        }

        const result = AuthService.createUser(username, password, role, email);

        if (!result.success) {
            return res.status(400).json(error(
                result.error,
                'REGISTER_FAILED'
            ));
        }

        // Log l'action
        _logAudit(req.user.user_id, 'user_created', 'user', result.user_id, {
            username, role, email
        });

        return res.status(201).json(success(
            {
                user_id: result.user_id,
                username: username,
                role: role
            },
            result.message
        ));
    } catch (err) {
        console.error('[AuthController.register]', err);
        return res.status(500).json(error(
            err.message,
            'REGISTER_FAILED'
        ));
    }
}

/**
 * GET /auth/me
 * 
 * Récupérer infos utilisateur actuel
 */
async function getMe(req, res) {
    try {
        const user = getDB().prepare(`
            SELECT id, username, role, email, created_at, last_login
            FROM users WHERE id = ?
        `).get(req.user.user_id);

        if (!user) {
            return res.status(404).json(error(
                'User not found',
                'NOT_FOUND'
            ));
        }

        return res.status(200).json(success(
            user,
            'User info retrieved'
        ));
    } catch (err) {
        console.error('[AuthController.getMe]', err);
        return res.status(500).json(error(
            err.message,
            'FAILED'
        ));
    }
}

/**
 * POST /auth/change-password
 * 
 * Changer password utilisateur
 * Body: { oldPassword, newPassword }
 */
async function changePassword(req, res) {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json(error(
                'Missing oldPassword or newPassword',
                'MISSING_FIELDS'
            ));
        }

        const result = AuthService.changePassword(req.user.user_id, oldPassword, newPassword);

        if (!result.success) {
            return res.status(400).json(error(
                result.error,
                'PASSWORD_CHANGE_FAILED'
            ));
        }

        // Log l'action
        _logAudit(req.user.user_id, 'password_changed', 'user', req.user.user_id, {});

        return res.status(200).json(success(
            {},
            result.message
        ));
    } catch (err) {
        console.error('[AuthController.changePassword]', err);
        return res.status(500).json(error(
            err.message,
            'PASSWORD_CHANGE_FAILED'
        ));
    }
}

/**
 * Utilitaire: Loguer une action pour audit
 * 
 * @private
 */
function _logAudit(userId, action, resourceType, resourceId, details) {
    try {
        getDB().prepare(`
            INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            userId,
            action,
            resourceType,
            resourceId,
            JSON.stringify(details),
            '127.0.0.1' // TODO: Get from req.ip
        );
    } catch (err) {
        console.warn('[Audit] Failed to log:', err.message);
    }
}

module.exports = {
    login,
    register,
    getMe,
    changePassword
};
