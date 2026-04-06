/**
 * error.middleware.js
 * Centralized error handling middleware
 */

const responses = require('../models/responses');

/**
 * Express error handling middleware
 * MUST be last middleware registered
 * @param {Error} err - Error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next
 */
function errorMiddleware(err, req, res, next) {
    // Log error
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR:`, err.message);
    console.error('Stack:', err.stack);

    // Determine status code
    const statusCode = err.status || err.statusCode || 500;
    const errorCode = err.code || 'INTERNAL_ERROR';

    // Send response
    res.status(statusCode).json(
        responses.error(
            err.message || 'Internal server error',
            errorCode,
            process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
        )
    );
}

module.exports = errorMiddleware;
