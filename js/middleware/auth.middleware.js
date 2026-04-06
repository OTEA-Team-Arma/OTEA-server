/**
 * auth.middleware.js
 * Authentication middleware for basic auth
 */

const auth = require('basic-auth');
const fs = require('fs');
const path = require('path');

/**
 * Load current admin user from users.json
 * @returns {object} User object { username, password }
 */
function loadCurrentUser() {
    try {
        const usersPath = path.join(__dirname, '..', '..', 'data', 'users.json');
        if (!fs.existsSync(usersPath)) {
            return { username: 'admin', password: 'admin1234' };
        }
        const stored = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
        return stored;
    } catch {
        return { username: 'admin', password: 'admin1234' };
    }
}

/**
 * Express middleware for basic authentication
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
function authMiddleware(req, res, next) {
    const stored = loadCurrentUser();
    const credentials = auth(req);

    if (
        credentials &&
        credentials.name === stored.username &&
        credentials.pass === stored.password
    ) {
        req.user = { name: stored.username };
        return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="OTEA-server"');
    return res.status(401).json({
        success: false,
        error: {
            message: 'Authentication required',
            code: 'AUTH_REQUIRED'
        }
    });
}

module.exports = authMiddleware;
