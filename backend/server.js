// ============================================================================
// OTEA-Server v2.3 - Integrated MVC Architecture with JWT + Database
// ============================================================================

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load centralized configuration
const { SERVER, SECURITY, validateConfig } = require('./config');

// Load platform abstraction
const osAbstraction = require('./osAbstraction');

// Import MVC architecture + Database + Auth
const { setupRoutes } = require('./routes');
const { initDatabase } = require('./db/database');

// ============================================================================
// CONFIGURATION VALIDATION
// ============================================================================
try {
    validateConfig();
} catch (err) {
    console.error('❌ Configuration validation failed:', err.message);
    process.exit(1);
}

const app = express();

// ============================================================================
// SECURITY MIDDLEWARE (Apply FIRST)
// ============================================================================
app.use(helmet(SECURITY.HELMET));

// Rate limiting: Max N requests per X minutes
const limiter = rateLimit({
    windowMs: SECURITY.RATE_LIMIT.WINDOW_MS,
    max: SECURITY.RATE_LIMIT.MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);
app.use(express.json());

// ============================================================================
// INITIALISATION osAbstraction
// ============================================================================
let osAbstractionReady = false;
try {
    osAbstraction.init({});
    osAbstractionReady = true;
    console.log('✅ OTEA-server initialized');
    console.log(`📊 Platform: ${osAbstraction.getPlatform()}`);
    console.log(`📁 Server root: ${osAbstraction.getServerRootPath()}`);
} catch (err) {
    console.error('❌ FATAL ERROR:', err.message);
    process.exit(1);
}

// Make osAbstraction available to controllers
app.locals.osAbstraction = osAbstraction;

// ============================================================================
// DATABASE INITIALIZATION  
// ============================================================================
console.log('[Server] Initializing database...');
initDatabase();
console.log('[Server] ✅ Database ready');

// ============================================================================
// MIDDLEWARE STACK - Static files
// ============================================================================
// Serve static files from project root (../) -> frontend assets
app.use(express.static(path.join(__dirname, '../frontend/src')));
app.use(express.static(path.join(__dirname, '../frontend/assets')));

// Routes publiques (sans JWT):
// - POST /api/auth/login
// - GET /api/health
// - GET /api/info

// ============================================================================
// SETUP ALL ROUTES - MVC Architecture (with Auth)
// ============================================================================
setupRoutes(app);

// JWT middleware: Protéger les routes restreignantes (appliqué dans setupRoutes)
// Voir backend/routes/ pour l'application du middleware

// ============================================================================
// STARTUP
// ============================================================================
// Warn if running production with 0.0.0.0 (exposed everywhere)
if (SERVER.NODE_ENV === 'production' && SERVER.HOST === '0.0.0.0') {
    console.warn('⚠️  WARNING: OTEA exposed on 0.0.0.0 in production!');
    console.warn('⚠️  Recommend: Use reverse proxy (Nginx) instead');
}

app.listen(SERVER.PORT, SERVER.HOST, () => {
    console.log(`✅ OTEA-server running at http://${SERVER.HOST}:${SERVER.PORT}`);
    console.log(`📊 Environment: ${SERVER.NODE_ENV}`);
});
