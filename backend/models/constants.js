/**
 * constants.js
 * Constantes utilisées partout dans l'app
 */

module.exports = {
    // Arma Reforger
    ARMA_APP_ID: 1874900,
    ARMA_EXECUTABLE_NAMES: {
        win32: 'ArmaReforgerServer.exe',
        linux: 'ArmaReforgerServer'
    },
    ARMA_PORT_MIN: 2300,
    ARMA_PORT_MAX: 65535,

    // OTEA Server
    OTEA_DEFAULT_PORT: 3000,
    OTEA_DEFAULT_HOST: 'localhost',

    // Logging
    LOG_LEVELS: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3
    },

    // Log features
    LOG_ROTATION_MAX_SIZE_MB: 10,
    LOG_ROTATION_MAX_FILES: 5,
    LOG_ROTATION_MAX_AGE_DAYS: 30,

    // Authentication
    MAX_LOGIN_ATTEMPTS: 5,
    LOGIN_ATTEMPT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes

    // Rate limiting
    GENERAL_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
    GENERAL_RATE_LIMIT_MAX: 100,
    AUTH_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
    AUTH_RATE_LIMIT_MAX: 5,

    // Headers to sanitize from logs
    SENSITIVE_HEADERS: [
        'authorization',
        'cookie',
        'x-api-key',
        'x-auth-token'
    ],

    // File paths (relative to project root)
    PATHS: {
        data: 'data',
        admin_log: 'data/admin.log',
        users_file: 'data/users.json',
        version_file: 'data/arma_version.json',
        presets_dir: 'presets',
        logs_dir: 'data/logs'
    }
};
