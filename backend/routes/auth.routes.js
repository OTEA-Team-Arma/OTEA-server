/**
 * routes/auth.routes.js
 * 
 * Routes d'authentification
 * - POST /auth/login
 * - POST /auth/register (admin only)
 * - GET /auth/me
 * - POST /auth/change-password
 */

const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/auth.controller');
const { authenticateJWT, authorizeRole } = require('../middleware/jwt.middleware');

/**
 * POST /auth/login
 * 
 * Login utilisateur (public)
 * Body: { username, password }
 */
router.post('/login', AuthController.login);

/**
 * POST /auth/register
 * 
 * Créer nouvel utilisateur (admin only)
 * Body: { username, password, role, email }
 */
router.post('/register', authenticateJWT, authorizeRole('admin'), AuthController.register);

/**
 * GET /auth/me
 * 
 * Récupérer infos utilisateur actuel (authentifié)
 */
router.get('/me', authenticateJWT, AuthController.getMe);

/**
 * POST /auth/change-password
 * 
 * Changer password (authentifié)
 * Body: { oldPassword, newPassword }
 */
router.post('/change-password', authenticateJWT, AuthController.changePassword);

module.exports = router;
