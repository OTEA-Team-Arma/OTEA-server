/**
 * js/routes/user.routes.js
 * 
 * Routes de gestion des utilisateurs
 * 
 * Toutes les routes sont protégées par JWT + admin-only
 * 
 * Routes:
 * - GET /admin/users
 * - GET /admin/users/:id
 * - DELETE /admin/users/:id
 * - PATCH /admin/users/:id/role
 * - PATCH /admin/users/:id/status
 */

const express = require('express');
const router = express.Router();

const UserController = require('../controllers/user.controller');
const { authorizeRole } = require('../middleware/jwt.middleware');

/**
 * GET /admin/users
 * Lister tous les utilisateurs
 * Query: search, role, is_active, limit, offset
 */
router.get(
    '/users',
    authorizeRole('admin'),
    UserController.listUsers
);

/**
 * GET /admin/users/:id
 * Récupérer détails d'un utilisateur
 */
router.get(
    '/users/:id',
    authorizeRole('admin'),
    UserController.getUser
);

/**
 * DELETE /admin/users/:id
 * Supprimer un utilisateur
 */
router.delete(
    '/users/:id',
    authorizeRole('admin'),
    UserController.deleteUser
);

/**
 * PATCH /admin/users/:id/role
 * Changer le rôle d'un utilisateur
 * Body: { role }
 */
router.patch(
    '/users/:id/role',
    authorizeRole('admin'),
    UserController.changeUserRole
);

/**
 * PATCH /admin/users/:id/status
 * Activer/désactiver un utilisateur
 * Body: { is_active }
 */
router.patch(
    '/users/:id/status',
    authorizeRole('admin'),
    UserController.updateUserStatus
);

module.exports = router;
