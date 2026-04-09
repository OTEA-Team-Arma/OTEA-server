// ============================================================================
// CENTRALIZED CONFIGURATION MODULE
// Loads all environment variables and provides organized config objects
// ============================================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const path = require('path');

// ============================================================================
// SERVER CONFIGURATION
// ============================================================================
const SERVER = {
    PORT: parseInt(process.env.OTEA_PORT || '3000', 10),
    HOST: process.env.OTEA_HOST || 'localhost',
    NODE_ENV: process.env.NODE_ENV || 'development',
};

// ============================================================================
// JWT AUTHENTICATION CONFIGURATION
// ============================================================================
const JWT = {
    SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production-min-32-chars-long!!!',
    EXPIRATION: parseInt(process.env.JWT_EXPIRATION || '86400', 10), // 24 hours in seconds
    ALGORITHM: 'HS256',
    AUDIENCE: 'client',
    ISSUER: 'OTEA-Server',
};

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================
const DATABASE = {
    PATH: process.env.DB_PATH || path.resolve(__dirname, '../../data/app.db'),
    TYPE: 'sqlite3',
};

// ============================================================================
// ARMA SERVER CONFIGURATION
// ============================================================================
const ARMA = {
    SERVER_ROOT: process.env.ARMA_SERVER_ROOT || 'C:\\Arma3DS',
    STEAMCMD_PATH: process.env.STEAMCMD_PATH || 'C:\\SteamCMD\\steamcmd.exe',
};

// ============================================================================
// LOGGING CONFIGURATION
// ============================================================================
const LOGGING = {
    LEVEL: process.env.LOG_LEVEL || 'info',
};

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================
const SECURITY = {
    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 100,
    },
    HELMET: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                scriptSrcAttr: ["'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:"],
            },
        },
    },
};

// ============================================================================
// VALIDATION: Check required configs
// ============================================================================
function validateConfig() {
    const errors = [];

    if (!JWT.SECRET || JWT.SECRET.length < 32) {
        errors.push('❌ JWT_SECRET must be at least 32 characters long');
    }

    if (!ARMA.SERVER_ROOT) {
        errors.push('❌ ARMA_SERVER_ROOT is required');
    }

    if (errors.length > 0) {
        console.error('⚠️  Configuration validation errors:');
        errors.forEach(err => console.error(`   ${err}`));
        if (SERVER.NODE_ENV === 'production') {
            throw new Error('Configuration validation failed');
        }
    }
}

// ============================================================================
// EXPORT CONFIGURATION OBJECTS
// ============================================================================
module.exports = {
    SERVER,
    JWT,
    DATABASE,
    ARMA,
    LOGGING,
    SECURITY,
    validateConfig,
};
