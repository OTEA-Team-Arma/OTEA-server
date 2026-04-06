/**
 * routes/index.js
 * Agrégateur de toutes les routes de l'app
 */

const express = require('express');
const router = express.Router();

// Import route files (will be added as we refactor)
// const serversRoutes = require('./servers.routes');
// const adminRoutes = require('./admin.routes');
// const logsRoutes = require('./logs.routes');

/**
 * Mount route handlers
 */
function setupRoutes(app) {
    // Example health check route (public)
    router.get('/health', (req, res) => {
        res.json({
            success: true,
            status: 'ok',
            message: 'OTEA-server is running',
            version: '2.2.0',
            timestamp: new Date().toISOString()
        });
    });

    // Mount specific route groups
    // app.use('/api/servers', serversRoutes);
    // app.use('/api/admin', adminRoutes);
    // app.use('/api/logs', logsRoutes);

    // Mount main router
    app.use('/api', router);

    return router;
}

module.exports = {
    setupRoutes,
    router
};
