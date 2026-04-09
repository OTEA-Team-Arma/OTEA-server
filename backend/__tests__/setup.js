/**
 * backend/__tests__/setup.js
 * 
 * Configuration globale pour les tests
 * - Supprime la DB test
 * - Initialise une DB fraîche pour chaque test
 */

const path = require('path');
const fs = require('fs');

const TEST_DB_PATH = path.join(__dirname, '../data/test.db');

/**
 * Setup global avant tous les tests
 */
beforeAll(() => {
    // Définir la variable d'env pour DB test
    process.env.DB_PATH = TEST_DB_PATH;
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key-min-32-characters!!';
});

/**
 * Cleanup après chaque test
 */
afterEach(() => {
    // Optionnel: Garder la DB entre tests ou la supprimer
    // fs.existsSync(TEST_DB_PATH) && fs.unlinkSync(TEST_DB_PATH);
});

/**
 * Cleanup global après tous les tests
 */
afterAll(() => {
    // Supprimer la DB test
    if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH);
    }
});
