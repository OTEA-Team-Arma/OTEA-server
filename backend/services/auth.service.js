/**
 * js/services/auth.service.js
 * 
 * Service d'authentification JWT
 * Responsabilités:
 * - Générer tokens JWT
 * - Vérifier tokens
 * - Hash passwords avec bcrypt
 * - Valider credentials
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDB } = require('../db/database');
const { JWT } = require('../config');

const JWT_SECRET = JWT.SECRET;
const JWT_EXPIRATION = JWT.EXPIRATION;

/**
 * Hash une password avec bcrypt
 * 
 * @param {string} password - Password en texte clair
 * @returns {string} Password hashée + salt
 */
function hashPassword(password) {
    const salt = bcrypt.genSaltSync(10); // 10 rounds = ~100ms
    return bcrypt.hashSync(password, salt);
}

/**
 * Comparer password en texte clair vs hash stocké
 * 
 * @param {string} password - Password en texte clair
 * @param {string} hash - Hash stocké en DB
 * @returns {boolean} Match ou pas
 */
function comparePassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}

/**
 * Générer JWT token
 * 
 * @param {Object} payload - Données à encoder (user_id, username, role)
 * @returns {string} JWT token signé
 */
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRATION,
        issuer: 'OTEA-Server',
        audience: 'client'
    });
}

/**
 * Vérifier JWT token
 * 
 * @param {string} token - Token à vérifier
 * @returns {Object|null} Payload décodé ou null si invalide
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET, {
            issuer: 'OTEA-Server',
            audience: 'client'
        });
    } catch (err) {
        console.warn(`[AuthService] Invalid token: ${err.message}`);
        return null;
    }
}

/**
 * Login utilisateur
 * 
 * @param {string} username - Nom utilisateur
 * @param {string} password - Password
 * @returns {Object} {success, token, user, error}
 */
function login(username, password) {
    try {
        // Récupérer l'utilisateur
        const user = getDB().prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);
        
        if (!user) {
            return {
                success: false,
                error: 'Invalid username or password'
            };
        }

        // Vérifier password
        if (!comparePassword(password, user.password_hash)) {
            return {
                success: false,
                error: 'Invalid username or password'
            };
        }

        // Générer token
        const token = generateToken({
            user_id: user.id,
            username: user.username,
            role: user.role
        });

        // Update last_login
        getDB().prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

        return {
            success: true,
            token: token,
            expiresIn: JWT_EXPIRATION,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                email: user.email
            }
        };
    } catch (err) {
        console.error('[AuthService] Login error:', err.message);
        return {
            success: false,
            error: 'Login failed'
        };
    }
}

/**
 * Créer nouvel utilisateur (admin only)
 * 
 * @param {string} username - Nom utilisateur
 * @param {string} password - Password
 * @param {string} role - Role (admin, game_master, viewer)
 * @param {string} email - Email optionnel
 * @returns {Object} {success, user_id, error}
 */
function createUser(username, password, role = 'viewer', email = null) {
    try {
        // Valider rôle
        const validRoles = ['admin', 'game_master', 'viewer'];
        if (!validRoles.includes(role)) {
            return {
                success: false,
                error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
            };
        }

        // Valider password (min 8 chars)
        if (!password || password.length < 8) {
            return {
                success: false,
                error: 'Password must be at least 8 characters'
            };
        }

        // Hash password
        const passwordHash = hashPassword(password);

        // Créer utilisateur
        const result = getDB().prepare(`
            INSERT INTO users (username, password_hash, role, email, is_active)
            VALUES (?, ?, ?, ?, 1)
        `).run(username, passwordHash, role, email);

        return {
            success: true,
            user_id: result.lastInsertRowid,
            message: `User ${username} created with role ${role}`
        };
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return {
                success: false,
                error: `Username "${username}" already exists`
            };
        }
        console.error('[AuthService] Create user error:', err.message);
        return {
            success: false,
            error: 'Failed to create user'
        };
    }
}

/**
 * Changer password utilisateur
 * 
 * @param {number} user_id - ID utilisateur
 * @param {string} oldPassword - Ancien password
 * @param {string} newPassword - Nouveau password
 * @returns {Object} {success, error}
 */
function changePassword(user_id, oldPassword, newPassword) {
    try {
        // Récupérer utilisateur
        const user = getDB().prepare('SELECT * FROM users WHERE id = ?').get(user_id);
        
        if (!user) {
            return {
                success: false,
                error: 'User not found'
            };
        }

        // Vérifier ancien password
        if (!comparePassword(oldPassword, user.password_hash)) {
            return {
                success: false,
                error: 'Old password is incorrect'
            };
        }

        // Valider nouveau password
        if (!newPassword || newPassword.length < 8) {
            return {
                success: false,
                error: 'New password must be at least 8 characters'
            };
        }

        // Hash et sauvegarder
        const newHash = hashPassword(newPassword);
        getDB().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user_id);

        return {
            success: true,
            message: 'Password changed successfully'
        };
    } catch (err) {
        console.error('[AuthService] Change password error:', err.message);
        return {
            success: false,
            error: 'Failed to change password'
        };
    }
}

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    login,
    createUser,
    changePassword,
    JWT_EXPIRATION
};
