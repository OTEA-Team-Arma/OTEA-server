/**
 * responses.js
 * Response formatting utilities
 */

/**
 * Format success response
 * @param {object} data - Response data
 * @param {string} message - Optional message
 * @returns {object} Formatted response
 */
function success(data, message = null) {
    return {
        success: true,
        message,
        data
    };
}

/**
 * Format error response
 * @param {string} message - Error message
 * @param {string} code - Optional error code
 * @param {object} details - Optional error details
 * @returns {object} Formatted response
 */
function error(message, code = 'UNKNOWN_ERROR', details = null) {
    const response = {
        success: false,
        error: {
            message,
            code
        }
    };

    if (details) {
        response.error.details = details;
    }

    return response;
}

/**
 * Format validation error response
 * @param {string[]} errors - Array of error messages
 * @returns {object} Formatted response
 */
function validationError(errors) {
    return {
        success: false,
        error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            validation: errors
        }
    };
}

module.exports = {
    success,
    error,
    validationError
};
