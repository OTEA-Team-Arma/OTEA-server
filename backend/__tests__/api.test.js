/**
 * backend/__tests__/api.test.js
 * 
 * Test suite complète pour l'API OTEA-Server
 * - Auth endpoints
 * - User management
 * - Server management
 * - RBAC enforcement
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Override DB path BEFORE requiring backend
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-min-32-characters!!';

// For testing, we'll use an in-memory database
process.env.DB_PATH = ':memory:';

// Express app (minimal setup for testing)
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { setupRoutes } = require('../routes');
const { initDatabase } = require('../db/database');

let app;
let adminToken = '';
let gameMasterToken = '';
let viewerToken = '';

/**
 * ============================================================================
 * SETUP - Initialiser l'app pour les tests
 * ============================================================================
 */
beforeAll(() => {
    // Créer l'app Express
    app = express();
    app.use(helmet());
    app.use(express.json());
    
    // Initialiser la DB
    initDatabase();
    
    // Setup routes
    setupRoutes(app);
});

/**
 * ============================================================================
 * TESTS PUBLICS (sans auth)
 * ============================================================================
 */
describe('Public Endpoints', () => {
    test('GET /api/health - Should return 200', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('GET /api/info - Should return version', async () => {
        const res = await request(app).get('/api/info');
        expect(res.status).toBe(200);
        expect(res.body.version).toBeDefined();
    });
});

/**
 * ============================================================================
 * TESTS AUTH (login, register)
 * ============================================================================
 */
describe('Authentication', () => {
    test('POST /api/auth/login - Admin login should return token', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin1234' });
        
        expect(res.status).toBe(200);
        expect(res.body.data.token).toBeDefined();
        expect(res.body.data.user.role).toBe('admin');
        
        // Store for later tests
        adminToken = res.body.data.token;
    });

    test('POST /api/auth/login - Wrong password should fail', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'wrongpassword' });
        
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    test('POST /api/auth/login - Non-existent user should fail', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'nonexistent', password: 'password' });
        
        expect(res.status).toBe(401);
    });

    test('POST /api/auth/register - Admin can create user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                username: 'testuser',
                password: 'password123',
                role: 'game_master'
            });
        
        expect(res.status).toBe(201);
        expect(res.body.data.username).toBe('testuser');
        expect(res.body.data.role).toBe('game_master');

        // Store game master token for later
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ username: 'testuser', password: 'password123' });
        
        if (loginRes.body.data && loginRes.body.data.token) {
            gameMasterToken = loginRes.body.data.token;
        }
    });

    test('GET /api/auth/me - Should return current user', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.status).toBe(200);
        expect(res.body.data.username).toBe('admin');
    });

    test('Protected endpoint - Missing token should return 401', async () => {
        const res = await request(app).get('/api/admin/users');
        expect(res.status).toBe(401);
    });

    test('Protected endpoint - Invalid token should return 401', async () => {
        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', 'Bearer invalid_token_here');
        expect(res.status).toBe(401);
    });
});

/**
 * ============================================================================
 * TESTS USER MANAGEMENT (admin only)
 * ============================================================================
 */
describe('User Management', () => {
    test('GET /api/admin/users - Admin can list users', async () => {
        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.users)).toBe(true);
        expect(res.body.data.users.length).toBeGreaterThan(0);
    });

    test('GET /api/admin/users/:id - Admin can get user details', async () => {
        // Get all users first
        const listRes = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${adminToken}`);
        
        const userId = listRes.body.data.users[0]?.id;
        
        if (!userId) return;

        const res = await request(app)
            .get(`/api/admin/users/${userId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(userId);
    });

    test('PATCH /api/admin/users/:id/role - Admin can change role', async () => {
        const listRes = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${adminToken}`);
        
        const userId = listRes.body.data.users.find(u => u.role === 'game_master')?.id;
        
        if (!userId) return;

        const res = await request(app)
            .patch(`/api/admin/users/${userId}/role`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ role: 'viewer' });
        
        expect(res.status).toBe(200);
        expect(res.body.data.role).toBe('viewer');
    });

    test('POST /api/admin/users/:id/disable - Admin can disable user', async () => {
        const listRes = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${adminToken}`);
        
        const userId = listRes.body.data.users.find(u => u.username === 'testuser')?.id;
        
        if (!userId) return;

        const res = await request(app)
            .patch(`/api/admin/users/${userId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ is_active: false });
        
        expect(res.status).toBe(200);
    });
});

/**
 * ============================================================================
 * TESTS RBAC (Role-Based Access Control)
 * ============================================================================
 */
describe('RBAC Protection', () => {
    test('Viewer cannot access user management', async () => {
        // Create a viewer first
        const registerRes = await request(app)
            .post('/api/auth/register')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                username: 'viewer_test',
                password: 'password123',
                role: 'viewer'
            });

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ username: 'viewer_test', password: 'password123' });

        viewerToken = loginRes.body.data.token;

        // Try to access admin endpoint
        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${viewerToken}`);
        
        expect(res.status).toBe(403);
    });

    test('Game Master has limited permissions', async () => {
        // Game Master should not access user management
        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${gameMasterToken}`);
        
        expect(res.status).toBe(403);
    });

    test('Admin has all permissions', async () => {
        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.status).toBe(200);
    });
});

/**
 * ============================================================================
 * TESTS SERVER MANAGEMENT
 * ============================================================================
 */
describe('Server Management', () => {
    let serverId;

    test('POST /api/servers-managed - Create server', async () => {
        const res = await request(app)
            .post('/api/servers-managed')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Test Server',
                port: 2401,
                config_json: '{}',
                mods: null
            });
        
        expect(res.status).toBe(201);
        expect(res.body.data.name).toBe('Test Server');
        serverId = res.body.data.id;
    });

    test('GET /api/servers-managed - List servers', async () => {
        const res = await request(app)
            .get('/api/servers-managed')
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.servers)).toBe(true);
    });

    test('GET /api/servers-managed/:id - Get server by ID', async () => {
        if (!serverId) return;

        const res = await request(app)
            .get(`/api/servers-managed/${serverId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(serverId);
    });

    test('PATCH /api/servers-managed/:id - Update server', async () => {
        if (!serverId) return;

        const res = await request(app)
            .patch(`/api/servers-managed/${serverId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Updated Server' });
        
        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(serverId);
    });

    test('POST /api/servers-managed/:id/lock - Lock server', async () => {
        if (!serverId) return;

        const res = await request(app)
            .post(`/api/servers-managed/${serverId}/lock`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.status).toBe(200);
        expect(res.body.data.locked).toBe(true);
    });

    test('DELETE locked server should fail', async () => {
        if (!serverId) return;

        const res = await request(app)
            .delete(`/api/servers-managed/${serverId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.status).toBe(400);
    });

    test('POST /api/servers-managed/:id/unlock - Unlock server', async () => {
        if (!serverId) return;

        const res = await request(app)
            .post(`/api/servers-managed/${serverId}/unlock`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.status).toBe(200);
        expect(res.body.data.locked).toBe(false);
    });

    test('DELETE /api/servers-managed/:id - Delete server', async () => {
        if (!serverId) return;

        const res = await request(app)
            .delete(`/api/servers-managed/${serverId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.status).toBe(200);
    });

    test('Viewer cannot access server management', async () => {
        const res = await request(app)
            .get('/api/servers-managed')
            .set('Authorization', `Bearer ${viewerToken}`);
        
        expect(res.status).toBe(403);
    });
});

/**
 * ============================================================================
 * ERROR HANDLING TESTS
 * ============================================================================
 */
describe('Error Handling', () => {
    test('POST /api/auth/register - Missing fields should fail', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ username: 'newuser' }); // Missing password
        
        expect(res.status).toBe(400);
    });

    test('GET /api/admin/users/999 - Non-existent ID should return 404', async () => {
        const res = await request(app)
            .get('/api/admin/users/999999')
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.status).toBe(404);
    });
});

/**
 * ============================================================================
 * CLEANUP
 * ============================================================================
 */
afterAll(() => {
    const testDbPath = path.join(__dirname, '../data/test.db');
    if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
    }
});
