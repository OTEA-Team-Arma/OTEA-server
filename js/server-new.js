/**
 * server-new.js - Template d'intégration v2.3
 * 
 * Ce fichier montre comment intégrer la structure MVC dans server.js
 * Le serveur sera RÉDUIT de 350 lignes à 60 lignes de code clair!
 * 
 * Migration:
 * 1. Copier ce fichier comme server-new.js
 * 2. Tester avec: npm test:server (à créer)
 * 3. Renommer server.js → server-old.js
 * 4. Renommer server-new.js → server.js
 * 5. Supprimer server-old.js une fois stable
 */

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const basicAuth = require('basic-auth');
const path = require('path');

// === IMPORTS: New MVC Structure ===
const { setupRoutes } = require('./routes');
const { authMiddleware } = require('./middleware/auth.middleware');
const { errorMiddleware } = require('./middleware/error.middleware');
const constants = require('./models/constants');

// === EXPRESS APP ===
const app = express();
const PORT = process.env.OTEA_PORT || constants.OTEA_DEFAULT_PORT;
const HOST = process.env.OTEA_HOST || constants.OTEA_DEFAULT_HOST;

// === MIDDLEWARE: Security ===
app.use(helmet());

// === MIDDLEWARE: Rate Limiting ===
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,
    message: 'Trop de requêtes depuis cette IP'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,
    message: 'Trop de tentatives d\'authentification'
});

app.use(limiter);
app.use('/api/arma-server/start', authLimiter);
app.use('/api/arma-server/stop', authLimiter);
app.use('/api/arma-server/update', authLimiter);

// === MIDDLEWARE: Body parsers ===
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === MIDDLEWARE: Authentication ===
// NOTA: authMiddleware est optionnel pour routes publiques
// Routes publiques: /health, /check-updates
// Routes sécurisées: /start, /stop, /update (vérifier req.user)

app.use((req, res, next) => {
    const credentials = basicAuth(req);
    
    if (credentials) {
        req.user = credentials;
    }
    
    next();
});

// === STATIC FILES ===
app.use(express.static(path.join(__dirname, '../')));

// === ROUTES (New MVC) ===
setupRoutes(app);

// TODO: Ajouter ces routes une fois services créés:
// const armaServerRoutes = require('./routes/arma-server.routes');
// const adminRoutes = require('./routes/admin.routes');
// const logsRoutes = require('./routes/logs.routes');
// app.use('/api/servers', armaServerRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/logs', logsRoutes);

// === LEGACY ROUTES (Temporaire, sera supprimé) ===
// Ces routes sont des vestiges de l'ancien architecture
// Elles seront converties en controllers/services progressivement

// Exemple route legacy (à déplacer):
// app.post('/api/update-server', async (req, res) => {
//     // => Convertir en UpdateService + UpdateController
// });

// === MIDDLEWARE: Error Handling (DOIT être dernier) ===
app.use(errorMiddleware);

// === STARTUP ===
const server = app.listen(PORT, HOST, () => {
    const url = `http://${HOST}:${PORT}`;
    
    console.log(`
    ╔═══════════════════════════════════╗
    ║   OTEA-Server v2.3                ║
    ║   Architecture: MVC               ║
    ╚═══════════════════════════════════╝
    
    ✓ Serveur démarre: ${url}
    ✓ Mode: ${process.env.NODE_ENV || 'development'}
    ✓ Auth: HTTP Basic Auth
    
    Endpoints:
    - GET  /health                      (public)
    - GET  /api/arma-server/status      (public)
    - GET  /api/arma-server/check-updates (public)
    - POST /api/arma-server/start       (auth required)
    - POST /api/arma-server/stop        (auth required)
    - POST /api/arma-server/update      (auth required)
    
    API Docs: http://localhost:3000/docs/API.md
    `);
    
    // ⚠️ Warning: 0.0.0.0 = Accessible from network
    if (HOST === '0.0.0.0') {
        console.warn(`
    ⚠️  WARNING: Serveur accessible depuis le réseau!
    ⚠️  Pour la production: Utilisez reverse proxy (nginx) + HTTPS
    ⚠️  Voir: docs/SECURITY_HEADERS_RATE_LIMIT.md
        `);
    }
});

// === ERROR HANDLING (Graceful shutdown) ===
process.on('SIGTERM', () => {
    console.log('SIGTERM reçu, arrêt du serveur...');
    server.close(() => {
        console.log('Serveur fermé');
        process.exit(0);
    });
});

process.on('uncaughtException', (error) => {
    console.error('Exception non gérée:', error);
    process.exit(1);
});

module.exports = app;
