#!/usr/bin/env node
/**
 * test-imports.js
 * Validation des imports pour v2.3 MVC Architecture
 * 
 * ✅ Vérifie que tous les modules se chargent correctement
 * ✅ Valide la structure sans lancer le serveur
 */

const path = require('path');
const fs = require('fs');

console.log('\n🧪 OTEA-Server v2.3 - Import Validation Test\n');
console.log('=' .repeat(60));

// Test counters
let passed = 0;
let failed = 0;

// Helper function
function testImport(name, modulePath) {
    try {
        require(modulePath);
        console.log(`✅ ${name.padEnd(40)} PASS`);
        passed++;
    } catch (err) {
        console.log(`❌ ${name.padEnd(40)} FAIL: ${err.message}`);
        failed++;
    }
}

console.log('\n📦 Testing Services...\n');
testImport('ArmaServerService', './js/services/arma-server.service');
testImport('UpdateService', './js/services/update.service');
testImport('AdminService', './js/services/admin.service');
testImport('PresetsService', './js/services/presets.service');
testImport('LogService', './js/services/log.service');
testImport('ArmaVersionService', './js/services/arma-version.service');

console.log('\n🎮 Testing Controllers...\n');
testImport('ArmaServerController', './js/controllers/arma-server.controller');
testImport('UpdateController', './js/controllers/update.controller');
testImport('AdminController', './js/controllers/admin.controller');
testImport('PresetsController', './js/controllers/presets.controller');
testImport('LogController', './js/controllers/log.controller');

console.log('\n🛣️  Testing Routes...\n');
testImport('servers.routes', './js/routes/arma-server.routes');
testImport('updates.routes', './js/routes/updates.routes');
testImport('admin.routes', './js/routes/admin.routes');
testImport('presets.routes', './js/routes/presets.routes');
testImport('logs.routes', './js/routes/logs.routes');
testImport('routes/index', './js/routes/index');

console.log('\n🧩 Testing Models & Middleware...\n');
testImport('responses model', './js/models/responses');
testImport('validators model', './js/models/validators');
testImport('constants model', './js/models/constants');
testImport('osAbstraction', './js/osAbstraction');

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Results: ${passed} PASS, ${failed} FAIL\n`);

if (failed === 0) {
    console.log('✅ All imports validated successfully!');
    console.log('🚀 Server is ready for startup.\n');
    process.exit(0);
} else {
    console.log(`❌ ${failed} import(s) failed!`);
    console.log('🔧 Fix errors before running server.\n');
    process.exit(1);
}
