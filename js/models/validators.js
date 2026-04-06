/**
 * validators.js
 * Fonctions de validation pour les entrées
 */

const constants = require('./constants');

/**
 * Validate port number
 * @param {number} port - Port to check
 * @returns {object} { valid: boolean, error: string }
 */
function validatePort(port) {
    const portNum = parseInt(port);

    if (isNaN(portNum)) {
        return { valid: false, error: 'Port must be a number' };
    }

    if (portNum < constants.ARMA_PORT_MIN || portNum > constants.ARMA_PORT_MAX) {
        return {
            valid: false,
            error: `Port must be between ${constants.ARMA_PORT_MIN} and ${constants.ARMA_PORT_MAX}`
        };
    }

    return { valid: true };
}

/**
 * Validate preset config object
 * @param {object} config - Preset config
 * @returns {object} { valid: boolean, errors: string[] }
 */
function validatePresetConfig(config) {
    const errors = [];

    if (!config) {
        errors.push('Config is required');
    } else {
        if (!config.title) {
            errors.push('title is required');
        }
        if (!config.port) {
            errors.push('port is required');
        } else {
            const portCheck = validatePort(config.port);
            if (!portCheck.valid) {
                errors.push(`port: ${portCheck.error}`);
            }
        }
        if (!config.game || typeof config.game !== 'object') {
            errors.push('game object is required');
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate credentials
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {object} { valid: boolean, error: string }
 */
function validateCredentials(username, password) {
    if (!username || typeof username !== 'string') {
        return { valid: false, error: 'Username is required' };
    }

    if (!password || typeof password !== 'string') {
        return { valid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
        return { valid: false, error: 'Password must be at least 8 characters' };
    }

    return { valid: true };
}

module.exports = {
    validatePort,
    validatePresetConfig,
    validateCredentials
};
