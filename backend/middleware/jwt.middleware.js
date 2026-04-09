/**
 * js/middleware/jwt.middleware.js
 * 
 * Middleware d'authentification JWT et RBAC
 * Responsabilités:
 * - Extraire token du header Authorization
 * - Vérifier validité du token
 * - Vérifier permissions selon le rôle
 * - Injector user infos dans req.user
 */

const { verifyToken } = require('../services/auth.service');

/**
 * Middleware: Vérifier JWT token
 * 
 * Headers: Authorization: Bearer <token>
 */
function authenticateJWT(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            error: 'Missing authorization header',
            code: 'NO_AUTH_HEADER'
        });
    }

    // Extraire token du "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            success: false,
            error: 'Invalid authorization format. Use: Bearer <token>',
            code: 'INVALID_AUTH_FORMAT'
        });
    }

    const token = parts[1];

    // Vérifier token
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
        });
    }

    // Injector user dans request
    req.user = payload;
    next();
}

/**
 * Middleware: Vérifier rôle utilisateur (RBAC)
 * 
 * Usage: authorizeRole('admin', 'game_master')(req, res, next)
 * 
 * @param {...string} roles - Rôles autorisés
 * @returns {Function} Middleware
 */
function authorizeRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                code: 'NO_USER'
            });
        }

        if (!roles.includes(req.user.role)) {
            console.warn(`[RBAC] Access denied for ${req.user.username} (${req.user.role}) to ${req.method} ${req.path}`);
            return res.status(403).json({
                success: false,
                error: `Access denied. Required roles: ${roles.join(', ')}`,
                code: 'FORBIDDEN',
                requiredRoles: roles,
                userRole: req.user.role
            });
        }

        next();
    };
}

/**
 * Middleware: Optional - Si user existe, l'injector, sinon continue
 * (Pour routes publiques mais avec accès augmenté si authentifié)
 */
function optionalJWT(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        req.user = null;
        return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        req.user = null;
        return next();
    }

    const token = parts[1];
    const payload = verifyToken(token);

    req.user = payload || null;
    next();
}

/**
 * Middleware: Vérifier ownership (pour Game Masters)
 * 
 * Défaut: utilise req.params.serverId
 * Pour servers: Game Master peut SEULEMENT modifier ses propres servers
 */
function checkServerOwnership(req, res, next) {
    // Admin = full access
    if (req.user.role === 'admin') {
        return next();
    }

    // Game Master = peut seulement modifier ses servers
    if (req.user.role === 'game_master') {
        const serverId = req.params.serverId || req.params.port;
        
        // TODO: Vérifier que req.params.port/serverId appartient à req.user.user_id
        // Pour now, on skip et on le fait dans le controller
        
        return next();
    }

    // Viewer = pas de modification
    return res.status(403).json({
        success: false,
        error: 'Viewer role cannot modify servers',
        code: 'FORBIDDEN'
    });
}

module.exports = {
    authenticateJWT,
    authorizeRole,
    optionalJWT,
    checkServerOwnership
};
