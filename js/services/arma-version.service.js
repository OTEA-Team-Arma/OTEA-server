/**
 * arma-version.service.js
 * Service pour détecter les versions Arma Reforger (installée vs disponible)
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Get version installed locally from cache file
 * @returns {Promise<string>} Version number or 'Unknown'
 */
async function getInstalledVersion() {
    return new Promise((resolve) => {
        const versionFile = path.join(__dirname, '..', 'data', 'arma_version.json');

        try {
            if (fs.existsSync(versionFile)) {
                const data = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
                resolve(data.version || 'Unknown');
            } else {
                resolve('Unknown');
            }
        } catch {
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
 * @returns {Promise<boolean>} True if newer version available
 */
async function isUpdateAvailable(steamCmdPath) {
    const installed = await getInstalledVersion();
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
