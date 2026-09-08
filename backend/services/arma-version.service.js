/**
 * arma-version.service.js
 * Service pour détecter les versions Arma Reforger (installée vs disponible)
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Get version from disk (steam manifest or exe metadata)
 * @param {string} armaPath - Path to Arma Reforger Server directory
 * @returns {Promise<string>} Version number or 'Unknown'
 */
async function getVersionFromDisk(armaPath) {
    return new Promise((resolve) => {
        if (!armaPath) {
            resolve('Unknown');
            return;
        }

        try {
            // Stratégie 1: Lire steam_appmanifest_1874900.acf (buildid)
            const manifestPath = path.join(armaPath, 'appmanifest_1874900.acf');

            if (fs.existsSync(manifestPath)) {
                const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
                const buildidMatch = manifestContent.match(/"buildid"\s+"(\d+)"/);
                if (buildidMatch && buildidMatch[1]) {
                    const version = `Build ${buildidMatch[1]}`;
                    console.log('[arma-version] Version from manifest:', version);
                    resolve(version);
                    return;
                }
            }

            // Stratégie 2: Lire FileVersion de ArmaReforgerServer.exe via PowerShell
            const exePath = path.join(armaPath, 'ArmaReforgerServer.exe');
            if (fs.existsSync(exePath)) {
                const cmd = `powershell -Command "(Get-Item \\"${exePath}\\").VersionInfo.FileVersion"`;

                exec(cmd, { timeout: 5000 }, (error, stdout) => {
                    if (!error && stdout && stdout.trim()) {
                        const version = stdout.trim();
                        console.log('[arma-version] Version from exe:', version);
                        resolve(version);
                    } else {
                        console.warn('[arma-version] Failed to read exe version:', error?.message);
                        resolve('Unknown');
                    }
                });
                return;
            }

            // Stratégie 3: Aucune méthode n'a fonctionné
            console.warn('[arma-version] No version detection method succeeded');
            resolve('Unknown');
        } catch (err) {
            console.error('[arma-version] getVersionFromDisk error:', err.message);
            resolve('Unknown');
        }
    });
}

/**
 * Get version installed locally from cache file
 * Falls back to disk detection if cache is Unknown or missing
 * @param {string} armaPath - Path to Arma Reforger Server directory (optional)
 * @returns {Promise<string>} Version number or 'Unknown'
 */
async function getInstalledVersion(armaPath = null) {
    return new Promise(async (resolve) => {
        const versionFile = path.join(__dirname, '..', 'data', 'arma_version.json');

        try {
            let cachedVersion = 'Unknown';

            // Lire le cache
            if (fs.existsSync(versionFile)) {
                const data = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
                cachedVersion = data.version || 'Unknown';
            } else {
                // Initialisation : créer le fichier avec "Unknown" uniquement s'il n'existe pas
                const initialData = {
                    version: 'Unknown',
                    lastUpdated: new Date().toISOString()
                };
                try {
                    fs.writeFileSync(versionFile, JSON.stringify(initialData, null, 2));
                } catch (err) {
                    console.warn('[arma-version] Failed to initialize version file:', err.message);
                }
            }

            // Si cache est "Unknown" et armaPath fourni → lire depuis le disque
            if (cachedVersion === 'Unknown' && armaPath) {
                console.log('[arma-version] Cache is Unknown, checking disk...');
                const diskVersion = await getVersionFromDisk(armaPath);

                if (diskVersion !== 'Unknown') {
                    // Écrire dans le cache
                    try {
                        const data = {
                            version: diskVersion,
                            lastUpdated: new Date().toISOString()
                        };
                        fs.writeFileSync(versionFile, JSON.stringify(data, null, 2));
                        console.log('[arma-version] Updated cache with disk version:', diskVersion);
                    } catch (err) {
                        console.warn('[arma-version] Failed to update cache:', err.message);
                    }
                    resolve(diskVersion);
                    return;
                }
            }

            resolve(cachedVersion);
        } catch (err) {
            console.error('[arma-version] getInstalledVersion error:', err.message);
            resolve('Unknown');
        }
    });
}

/**
 * Check available version from Steam
 * Uses SteamCMD to query latest build
 * @param {string} steamCmdPath - Path to steamcmd executable
 * @returns {Promise<string>} Latest version or 'Unknown'
 */
async function getAvailableVersion(steamCmdPath) {
    return new Promise((resolve) => {
        if (!steamCmdPath) {
            resolve('Unknown');
            return;
        }

        // Query SteamCMD for app info
        const cmd = `"${steamCmdPath}" +login anonymous +app_info_update 1 +app_info_print 1874900 +quit`;

        exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
            try {
                if (error) {
                    console.warn('[arma-version] SteamCMD query failed:', error.message);
                    resolve('Unknown');
                    return;
                }

                // Parse buildid from SteamCMD output
                // Output format: ... "buildid" "12345" ...
                const match = stdout.match(/"buildid"\s+"(\d+)"/);
                if (match && match[1]) {
                    resolve(`Build ${match[1]}`);
                } else {
                    resolve('Unknown');
                }
            } catch {
                resolve('Unknown');
            }
        });
    });
}

/**
 * Check if update is available
 * @param {string} steamCmdPath - Path to steamcmd executable
 * @param {string} armaPath - Path to Arma Reforger Server directory (optional)
 * @returns {Promise<boolean>} True if newer version available
 */
async function isUpdateAvailable(steamCmdPath, armaPath = null) {
    const installed = await getInstalledVersion(armaPath);
    const available = await getAvailableVersion(steamCmdPath);

    // Simple comparison: if versions different → update available
    return installed !== available && available !== 'Unknown';
}

/**
 * Save version after successful update
 * Called after SteamCMD finishes
 * @param {string} version - Version to save
 */
async function saveVersion(version) {
    const versionFile = path.join(__dirname, '..', 'data', 'arma_version.json');
    const data = {
        version,
        lastUpdated: new Date().toISOString()
    };

    try {
        fs.writeFileSync(versionFile, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('[arma-version] Failed to save version:', err.message);
    }
}

module.exports = {
    getInstalledVersion,
    getAvailableVersion,
    isUpdateAvailable,
    saveVersion
};
