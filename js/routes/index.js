/**
 * routes/index.js
 * Agrégateur centralisé de toutes les routes de l'app
 * 
 * Toutes les routes API sont montées ici et organisées par domaine
 */

const express = require('express');
const router = express.Router();

// Import de tous les route modules
const serversRoutes = require('./arma-server.routes');
const updatesRoutes = require('./updates.routes');
const adminRoutes = require('./admin.routes');
const presetsRoutes = require('./presets.routes');
const logsRoutes = require('./logs.routes');

/**
 * Setup toutes les routes
 * 
 * @param {Express} app - Application Express
 * @returns {Router} Router avec toutes les routes montées
 */
function setupRoutes(app) {
    // Route de santé (public)
    router.get('/health', (req, res) => {
        res.json({
            success: true,
            status: 'ok',
            message: 'OTEA-server is running',
            version: '2.3.0',
            timestamp: new Date().toISOString()
        });
    });

    // Route pour infos de l'app (public)
    router.get('/info', (req, res) => {
        res.json({
            success: true,
            name: 'OTEA-Server',
            version: '2.3.0',
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    });

    // =========================================================================
    // API Routes - Montées hiérarchiquement par domaine
    // =========================================================================

    // GET /api/v1/servers - Opérations sur les serveurs Arma
    app.use('/api/servers', serversRoutes);

    // GET /api/v1/updates - Opérations de mise à jour
    app.use('/api/updates', updatesRoutes);

    // GET /api/v1/admin - Opérations administratives
    app.use('/api/admin', adminRoutes);

    // GET /api/v1/presets - Gestion des prests
    app.use('/api/presets', presetsRoutes);

    // GET /api/v1/logs - Gestion des logs
    app.use('/api/logs', logsRoutes);

    // =========================================================================
    // Routes principales (root)
    // =========================================================================
    app.use('/api', router);

    return router;
}

module.exports = {
    setupRoutes,
    router
};
