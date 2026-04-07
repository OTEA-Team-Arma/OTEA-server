// ============================================================================
// OTEA-Server v2.3 - Integrated MVC Architecture
// ============================================================================

// Load environment variables FIRST
require('dotenv').config();

const path = require('path');
const express = require('express');
const fs = require('fs');
const auth = require('basic-auth');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const osAbstraction = require('./osAbstraction');

// Import new MVC architecture
const { setupRoutes } = require('./routes');

const app = express();

// ============================================================================
// SECURITY MIDDLEWARE (Apply FIRST)
// ============================================================================
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "script-src": ["'self'", "'unsafe-inline'"],
            "script-src-attr": ["'unsafe-inline'"],
            "style-src": ["'self'", "'unsafe-inline'"]
        }
    }
}));

// Rate limiting: Max 100 requests per 15 minutes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
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
// AUTHENTICATION MIDDLEWARE
// ============================================================================
function loadUser() {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'users.json'), 'utf-8'));
    } catch {
        return { username: 'admin', password: 'admin1234' };
    }
}

const authMiddleware = (req, res, next) => {
    const stored = loadUser();
    const user = auth(req);
    if (user && user.name === stored.username && user.pass === stored.password) {
        req.user = { name: stored.username };
        return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Acces Protege"');
    return res.status(401).send('Authentification requise.');
};

// ============================================================================
// MIDDLEWARE STACK
// ============================================================================
app.use(express.static(path.join(__dirname, '..')));
app.use(authMiddleware);

// ============================================================================
// SETUP ALL ROUTES - MVC Architecture
// ============================================================================
setupRoutes(app);

// ============================================================================
// STARTUP
// ============================================================================
const PORT = process.env.OTEA_PORT || 3000;
const HOST = process.env.OTEA_HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Warn if running production with 0.0.0.0 (exposed everywhere)
if (NODE_ENV === 'production' && HOST === '0.0.0.0') {
    console.warn('⚠️  WARNING: OTEA exposed on 0.0.0.0 in production!');
    console.warn('⚠️  Recommend: Use reverse proxy (Nginx) instead');
}

app.listen(PORT, HOST, () => {
    console.log(`✅ OTEA-server running at http://${HOST}:${PORT}`);
    console.log(`📊 Environment: ${NODE_ENV}`);
});
