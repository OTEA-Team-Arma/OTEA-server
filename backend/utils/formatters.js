/**
 * formatters.js
 * Utility functions for formatting
 */

/**
 * Format date to ISO string
 * @param {Date} date - Date to format
 * @returns {string} ISO formatted date
 */
function formatDate(date = new Date()) {
    return date.toISOString();
}

/**
 * Format bytes to human readable size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
function formatBytes(bytes) {
    if (bytes === 0) {
        return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format seconds to human readable duration
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
}

/**
 * Sanitize headers for logging
 * @param {object} headers - Request headers
 * @returns {object} Sanitized headers
 */
function sanitizeHeaders(headers) {
    const sensitiveKeys = [
        'authorization',
        'cookie',
        'x-api-key',
        'x-auth-token'
    ];

    const sanitized = { ...headers };

    sensitiveKeys.forEach(key => {
        if (sanitized[key]) {
            sanitized[key] = '[REDACTED]';
        }
    });

    return sanitized;
}

module.exports = {
    formatDate,
    formatBytes,
    formatDuration,
    sanitizeHeaders
};
