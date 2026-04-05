/**
 * osAbstraction.js
 * 
 * Couche d'abstraction cross-platform pour OTEA-server
 * Gère tous les détails OS-spécifiques (Windows/Linux) de manière centralisée
 * 
 * EXPORTS:
 * - init(configFromServer)        : Initialise le module au démarrage
 * - getServerExecutable()         : Retourne le chemin complet au binaire
 * - buildLaunchArgs(configPath, port) : Construit les args adaptés à l'OS
 * - getUpdateScript()             : Retourne le chemin au script de MAJ
 * - killProcessByPort(port)       : Tue un processus sur un port
 * - getPlatform()                 : Retourne la plateforme détectée
 * - getServerRootPath()           : Retourne le chemin racine du serveur
 * - getConfig()                   : Retourne la config chargée (debug)
 */

const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const os = require('os');

// ============================================================================
// SECTION 1: VARIABLES PRIVÉES (État du module)
// ============================================================================

let platformDetected = null;
let serverRootPath = null;
let executablePath = null;
let updateScriptPath = null;
let config = {};
let isInitialized = false;

// ============================================================================
// SECTION 2: FONCTIONS PRIVÉES HELPERS
// ============================================================================

/**
 * _loadConfigWithPriority()
 * Charge la configuration avec priorités: env vars > config.json > défauts
 */
function _loadConfigWithPriority() {
    let configData = {};
    
    // ÉTAPE 1: Tenter de charger data/config.json
    const configPath = path.join(__dirname, '..', 'data', 'config.json');
    try {
        if (fs.existsSync(configPath)) {
            const fileContent = fs.readFileSync(configPath, 'utf-8');
            configData = JSON.parse(fileContent);
            console.log(`[osAbstraction] ✅ Config file loaded: ${configPath}`);
        }
    } catch (err) {
        console.warn(`[osAbstraction] ⚠️ Warning reading config.json: ${err.message}`);
    }
    
    // ÉTAPE 2: Charger variables d'environnement (override config.json)
    const envVars = {
        serverRootPath: process.env.ARMA_SERVER_ROOT,
        steamCmdPath: process.env.STEAMCMD_PATH,
        backendLog: process.env.BACKEND_LOG ? process.env.BACKEND_LOG === 'true' : undefined
    };
    
    // Fusionner: env vars > config.json
    configData = {
        ...configData,
        ...Object.fromEntries(Object.entries(envVars).filter(([_, v]) => v !== undefined))
    };
    
    // ÉTAPE 3: Remplir les défauts manquants
    if (!configData.serverRootPath) {
        if (platformDetected === 'win32') {
            configData.serverRootPath = 'C:\\Arma3DS';
        } else if (platformDetected === 'linux') {
            configData.serverRootPath = '/home/arma/server';
        } else {
            configData.serverRootPath = './server';
        }
        console.log(`[osAbstraction] ℹ️  Using default serverRootPath: ${configData.serverRootPath}`);
    }
    
    if (configData.backendLog === undefined) {
        configData.backendLog = true;
    }
    
    if (!configData.maxInstances) {
        configData.maxInstances = 5;
    }
    
    if (!configData.defaultRegion) {
        configData.defaultRegion = 'EU';
    }
    
    configData.platform = platformDetected;
    
    return configData;
}

/**
 * _constructPaths(config, platform)
 * Construit les chemins complets vers binaires et scripts selon plateforme
 */
function _constructPaths(config, platform) {
    let paths = {
        executablePath: null,
        updateScriptPath: null,
        baseDir: config.serverRootPath
    };
    
    if (platform === 'win32') {
        paths.executablePath = path.join(config.serverRootPath, 'ArmaReforgerServer.exe');
        paths.updateScriptPath = path.join(config.serverRootPath, 'update_armar_ds.bat');
    } else if (platform === 'linux') {
        paths.executablePath = path.join(config.serverRootPath, 'ArmaReforgerServer');
        paths.updateScriptPath = path.join(config.serverRootPath, 'update_armar_ds.sh');
    } else {
        throw new Error(`Unsupported platform: ${platform}`);
    }
    
    return paths;
}

/**
 * _ensureExecutablePermissions(executablePath)
 * [Linux Only] Applique chmod +x si nécessaire
 */
function _ensureExecutablePermissions(executablePath) {
    if (platformDetected !== 'linux') {
        return; // Pas besoin sur Windows
    }
    
    try {
        if (fs.existsSync(executablePath)) {
            const stats = fs.statSync(executablePath);
            // Vérifier si fichier est exécutable (mode & 0o111)
            const isExecutable = (stats.mode & parseInt('111', 8)) !== 0;
            
            if (!isExecutable) {
                fs.chmodSync(executablePath, 0o755);
                console.log(`[osAbstraction] ✅ chmod +x applied to: ${executablePath}`);
            } else {
                console.log(`[osAbstraction] ✅ Already executable: ${executablePath}`);
            }
        }
    } catch (err) {
        console.error(`[osAbstraction] ❌ Error setting permissions: ${err.message}`);
        throw err;
    }
}

/**
 * _validateBinaries(executablePath, updateScriptPath, platform)
 * Valide l'existence des binaires et scripts
 * Retourne: true si OK, false si erreur critique
 */
function _validateBinaries(executablePath, updateScriptPath, platform) {
    console.log(`[osAbstraction] 🔍 Validating binaries for platform: ${platform}`);
    
    // Vérification 1: Binaire principal DOIT exister
    if (!fs.existsSync(executablePath)) {
        console.error(`[osAbstraction] ❌ CRITICAL: Binary not found at: ${executablePath}`);
        return false;
    }
    console.log(`[osAbstraction] ✅ Binary found: ${executablePath}`);
    
    // Vérification 2: Script de MAJ (WARNING seulement)
    if (!fs.existsSync(updateScriptPath)) {
        console.warn(`[osAbstraction] ⚠️  Update script not found: ${updateScriptPath}`);
        console.warn(`[osAbstraction] ⚠️  Server will run but updates may fail`);
    } else {
        console.log(`[osAbstraction] ✅ Update script found: ${updateScriptPath}`);
    }
    
    // Vérification 3: Permissions Linux
    if (platform === 'linux') {
        try {
            _ensureExecutablePermissions(executablePath);
        } catch (err) {
            return false;
        }
    }
    
    return true;
}

/**
 * _killProcessWindows(port)
 * [Windows] Tue un processus utilisant un port spécifique
 */
function _killProcessWindows(port) {
    return new Promise((resolve) => {
        exec(`netstat -ano | findstr :${port}`, (err, stdout, stderr) => {
            if (err || !stdout) {
                console.log(`[osAbstraction] ℹ️  No process found on port ${port}`);
                resolve(false);
                return;
            }
            
            try {
                const lines = stdout.trim().split('\n');
                let killed = false;
                let pidList = [];
                
                lines.forEach(line => {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[4];
                    if (pid && !pidList.includes(pid)) {
                        pidList.push(pid);
                    }
                });
                
                if (pidList.length === 0) {
                    resolve(false);
                    return;
                }
                
                let completed = 0;
                pidList.forEach(pid => {
                    exec(`taskkill /PID ${pid} /F`, (error) => {
                        if (!error) {
                            killed = true;
                            console.log(`[osAbstraction] ✅ Killed process PID ${pid}`);
                        }
                        completed++;
                        if (completed === pidList.length) {
                            resolve(killed);
                        }
                    });
                });
            } catch (parseErr) {
                console.error(`[osAbstraction] ❌ Error parsing netstat output: ${parseErr.message}`);
                resolve(false);
            }
        });
    });
}

/**
 * _killProcessLinux(port)
 * [Linux] Tue un processus utilisant un port spécifique
 */
function _killProcessLinux(port) {
    return new Promise((resolve) => {
        exec(`lsof -i :${port} -t`, (err, stdout, stderr) => {
            if (err || !stdout) {
                console.log(`[osAbstraction] ℹ️  No process found on port ${port}`);
                resolve(false);
                return;
            }
            
            try {
                const pidList = stdout.trim().split('\n').filter(p => p);
                
                if (pidList.length === 0) {
                    resolve(false);
                    return;
                }
                
                let completed = 0;
                let killed = false;
                
                pidList.forEach(pid => {
                    exec(`kill -9 ${pid}`, (error) => {
                        if (!error) {
                            killed = true;
                            console.log(`[osAbstraction] ✅ Killed process PID ${pid}`);
                        }
                        completed++;
                        if (completed === pidList.length) {
                            resolve(killed);
                        }
                    });
                });
            } catch (parseErr) {
                console.error(`[osAbstraction] ❌ Error parsing lsof output: ${parseErr.message}`);
                resolve(false);
            }
        });
    });
}

// ============================================================================
// SECTION 3: EXPORTS PUBLIQUES
// ============================================================================

/**
 * init(configFromServer)
 * Initialise complètement le module au démarrage
 * DOIT être appelé avant toute autre fonction
 */
function init(configFromServer = {}) {
    console.log('[osAbstraction] 🚀 Initializing osAbstraction module...');
    
    // ÉTAPE 1: Détecter l'OS
    platformDetected = process.platform;
    console.log(`[osAbstraction] 🖥️  Platform detected: ${platformDetected}`);
    
    // ÉTAPE 2: Charger la configuration avec priorités
    config = _loadConfigWithPriority();
    serverRootPath = config.serverRootPath;
    console.log(`[osAbstraction] 📁 Server root path: ${serverRootPath}`);
    
    // ÉTAPE 3: Construire les chemins complets
    const paths = _constructPaths(config, platformDetected);
    executablePath = paths.executablePath;
    updateScriptPath = paths.updateScriptPath;
    
    // ÉTAPE 4: Valider les binaires (CRITICAL CHECK)
    const valid = _validateBinaries(executablePath, updateScriptPath, platformDetected);
    
    if (!valid) {
        const errorMsg = `FATAL: Initialization failed. Binary not found or validation error.\n` +
                        `Expected binary at: ${executablePath}\n` +
                        `Please ensure the Arma Reforger Server binary is installed correctly.`;
        console.error(`[osAbstraction] ❌ ${errorMsg}`);
        throw new Error(errorMsg);
    }
    
    // ÉTAPE 5: Marquer comme initialisé
    isInitialized = true;
    console.log(`[osAbstraction] ✅ osAbstraction ready for ${platformDetected}`);
    console.log(`[osAbstraction] ========================================`);
}

/**
 * getServerExecutable()
 * Retourne le chemin complet au binaire
 */
function getServerExecutable() {
    if (!isInitialized) {
        throw new Error('osAbstraction not initialized. Call init() first.');
    }
    return executablePath;
}

/**
 * buildLaunchArgs(configPath, port)
 * Construit les arguments adaptés à l'OS pour lancer le serveur
 */
function buildLaunchArgs(configPath, port) {
    if (!isInitialized) {
        throw new Error('osAbstraction not initialized. Call init() first.');
    }
    
    const args = [
        '-config', configPath,
        '-port', String(port),
        '-update'
    ];
    
    // Ajouter -backendlog sur Linux
    if (platformDetected === 'linux' && config.backendLog) {
        args.push('-backendlog');
    }
    
    console.log(`[osAbstraction] 🎯 Launch args for port ${port}: ${args.join(' ')}`);
    return args;
}

/**
 * getUpdateScript()
 * Retourne le chemin complet au script de mise à jour
 */
function getUpdateScript() {
    if (!isInitialized) {
        throw new Error('osAbstraction not initialized. Call init() first.');
    }
    return updateScriptPath;
}

/**
 * killProcessByPort(port)
 * Tue un processus utilisant un port spécifique
 * Retourne: Promise<Boolean>
 */
function killProcessByPort(port) {
    if (!isInitialized) {
        throw new Error('osAbstraction not initialized. Call init() first.');
    }
    
    console.log(`[osAbstraction] 💀 Attempting to kill process on port ${port}...`);
    
    if (platformDetected === 'win32') {
        return _killProcessWindows(port);
    } else if (platformDetected === 'linux') {
        return _killProcessLinux(port);
    } else {
        return Promise.reject(new Error(`Unsupported platform: ${platformDetected}`));
    }
}

/**
 * getPlatform()
 * Retourne la plateforme détectée
 */
function getPlatform() {
    if (!isInitialized) {
        throw new Error('osAbstraction not initialized. Call init() first.');
    }
    return platformDetected;
}

/**
 * getServerRootPath()
 * Retourne le chemin racine du serveur
 */
function getServerRootPath() {
    if (!isInitialized) {
        throw new Error('osAbstraction not initialized. Call init() first.');
    }
    return serverRootPath;
}

/**
 * getConfig()
 * Retourne la configuration chargée (pour debug)
 */
function getConfig() {
    if (!isInitialized) {
        throw new Error('osAbstraction not initialized. Call init() first.');
    }
    return { ...config };
}

/**
 * isReady()
 * Retourne true si module est initialisé
 */
function isReady() {
    return isInitialized;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    init,
    getServerExecutable,
    buildLaunchArgs,
    getUpdateScript,
    killProcessByPort,
    getPlatform,
    getServerRootPath,
    getConfig,
    isReady
};
