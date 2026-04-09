/**
 * routes/index.js
 * Agrégateur centralisé de toutes les routes de l'app
 * 
 * Toutes les routes API sont montées ici et organisées par domaine
 */

const express = require('express');
const router = express.Router();

// Import de tous les route modules
const authRoutes = require('./auth.routes');
const serversRoutes = require('./arma-server.routes');
const serverManagementRoutes = require('./server-management.routes');
const updatesRoutes = require('./updates.routes');
const adminRoutes = require('./admin.routes');
const userRoutes = require('./user.routes');
const presetsRoutes = require('./presets.routes');
const logsRoutes = require('./logs.routes');

// Import middleware
const { authenticateJWT } = require('../middleware/jwt.middleware');

/**
 * Setup toutes les routes
 * 
 * @param {Express} app - Application Express
 * @returns {Router} Router avec toutes les routes montées
 */
function setupRoutes(app) {
    // =========================================================================
    // PUBLIC ROUTES MOUNTED TO APP FIRST (before protected middleware)
    // =========================================================================
    app.use('/api/health', (req, res) => {
        res.json({
            success: true,
            status: 'ok',
            message: 'OTEA-server is running',
            version: '2.4.0',
            timestamp: new Date().toISOString()
        });
    });

    app.use('/api/info', (req, res) => {
        res.json({
            success: true,
            name: 'OTEA-Server v2.4 (JWT + Database)',
            version: '2.4.0',
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    });

    // Routes d'authentification (public login, admin-only register)
    app.use('/api/auth', authRoutes);

    // =========================================================================
    // PROTECTED ROUTES (JWT requis - middleware appliqué)
    // =========================================================================

    // Créer un router protégé
    const protectedRouter = express.Router();
    protectedRouter.use(authenticateJWT);

    // Monter les routes protégées sur le router protégé
    protectedRouter.use('/servers', serversRoutes);
    protectedRouter.use('/servers-managed', serverManagementRoutes);
    protectedRouter.use('/updates', updatesRoutes);
    protectedRouter.use('/admin', adminRoutes);
    protectedRouter.use('/admin', userRoutes);
    protectedRouter.use('/presets', presetsRoutes);
    protectedRouter.use('/logs', logsRoutes);

    // Monter le router protégé sur /api
    app.use('/api', protectedRouter);

    return router;
}

module.exports = {
    setupRoutes,
    router
};

