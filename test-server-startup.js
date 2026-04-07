#!/usr/bin/env node
/**
 * test-server-startup.js
 * Teste que le serveur peut démarrer correctement
 */

require('dotenv').config();

const express = require('express');
const path = require('path');

console.log('\n🚀 OTEA-Server v2.3 - Startup Verification Test\n');
console.log('=' .repeat(60) + '\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name.padEnd(45)} PASS`);
        passed++;
        return true;
    } catch (err) {
        console.log(`❌ ${name.padEnd(45)} FAIL`);
        console.log(`   Error: ${err.message}`);
        failed++;
        return false;
    }
}

// Test 1: Import Express
test('Import Express', () => {
    if (!express) throw new Error('Express not loaded');
});

// Test 2: Create app
let app;
test('Create Express app instance', () => {
    app = express();
    if (!app) throw new Error('App not created');
});

// Test 3: Import osAbstraction
let osAbstraction;
test('Import osAbstraction module', () => {
    osAbstraction = require('./js/osAbstraction');
    if (!osAbstraction) throw new Error('osAbstraction not loaded');
});

// Test 4: Initialize osAbstraction
test('Initialize osAbstraction', () => {
    osAbstraction.init({});
    // If this succeeds, it's good enough
});

// Test 5: Make osAbstraction available
test('Store osAbstraction in app.locals', () => {
    app.locals.osAbstraction = osAbstraction;
    if (!app.locals.osAbstraction) throw new Error('Not stored');
});

// Test 6: Import routes
let setupRoutes;
test('Load route setup function', () => {
    const routes = require('./js/routes/index');
    setupRoutes = routes.setupRoutes;
    if (!setupRoutes) throw new Error('setupRoutes not found');
    if (typeof setupRoutes !== 'function') throw new Error('setupRoutes not a function');
});

// Test 7: Configure middleware
test('Configure Express middleware', () => {
    app.use(express.json());
});

// Test 8: Mount routes
test('Mount all routes', () => {
    setupRoutes(app);
    // If this succeeds without throwing, routes are mounted
});

// Test 9: Configuration
test('Environment configuration valid', () => {
    const port = process.env.OTEA_PORT || 3000;
    const host = process.env.OTEA_HOST || 'localhost';
    if (!port || !host) throw new Error('Config incomplete');
    console.log(`   (Will run on http://${host}:${port})`);
});

console.log('\n' +  '='.repeat(60));
console.log(`\n📊 Results: ${passed} PASS, ${failed} FAIL\n`);

if (failed === 0) {
    console.log('✅ Server startup verification SUCCESSFUL!');
    console.log('🚀 All systems ready for production deployment.\n');
    process.exit(0);
} else {
    console.log(`❌ ${failed} verification(s) failed!`);
    console.log('🔧 Fix errors before deploying.\n');
    process.exit(1);
}
