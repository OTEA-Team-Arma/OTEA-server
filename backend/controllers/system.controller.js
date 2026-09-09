/**
 * system.controller.js
 *
 * Contrôleur pour la gestion des chemins système
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'data', 'config.json');

/**
 * GET /api/system/paths
 * Retourne les chemins système depuis data/config.json avec vérification d'existence
 */
async function getSystemPaths(req, res) {
    try {
        // Lire le fichier de configuration
        let config = {};
        if (fsSync.existsSync(CONFIG_PATH)) {
            const content = await fs.readFile(CONFIG_PATH, 'utf8');
            config = JSON.parse(content);
        }

        // Construire les chemins
        const serverExecutablePath = config.serverRootPath
            ? path.join(config.serverRootPath, 'ArmaReforgerServer.exe')
            : '';
        const addonsDirPath = config.addonsDir || '';
        const serverProfilePath = config.profilePath || '';
        const steamCmdPath = config.steamCmdPath || '';

        // Vérifier l'existence et construire la réponse
        res.json({
            serverExecutable: {
                path: serverExecutablePath,
                exists: serverExecutablePath ? fsSync.existsSync(serverExecutablePath) : false
            },
            addonsDir: {
                path: addonsDirPath,
                exists: addonsDirPath ? fsSync.existsSync(addonsDirPath) : false
            },
            serverProfile: {
                path: serverProfilePath,
                exists: serverProfilePath ? fsSync.existsSync(serverProfilePath) : false
            },
            steamCmd: {
                path: steamCmdPath,
                exists: steamCmdPath ? fsSync.existsSync(steamCmdPath) : false
            }
        });

    } catch (error) {
        console.error('[system.controller] Error in getSystemPaths:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la lecture des chemins système',
            error: error.message
        });
    }
}

/**
 * PUT /api/system/paths
 * Sauvegarde les chemins système dans data/config.json
 */
async function updateSystemPaths(req, res) {
    try {
        const { serverPath, addonsDir, profilePath, steamCmdPath } = req.body;

        // Lire la config existante
        let config = {};
        if (fsSync.existsSync(CONFIG_PATH)) {
            const content = await fs.readFile(CONFIG_PATH, 'utf8');
            config = JSON.parse(content);
        }

        // Extraire serverRootPath depuis serverPath (retirer \ArmaReforgerServer.exe)
        let serverRootPath = '';
        if (serverPath) {
            serverRootPath = path.dirname(serverPath);
        }

        // Mettre à jour les chemins
        config.serverRootPath = serverRootPath;
        config.addonsDir = addonsDir || '';
        config.profilePath = profilePath || '';
        config.steamCmdPath = steamCmdPath || '';

        // Sauvegarder
        await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));

        console.log('[system.controller] Chemins système sauvegardés:', {
            serverRootPath,
            addonsDir,
            profilePath,
            steamCmdPath
        });

        res.json({
            success: true,
            message: 'Chemins système sauvegardés avec succès'
        });

    } catch (error) {
        console.error('[system.controller] Error in updateSystemPaths:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la sauvegarde des chemins système',
            error: error.message
        });
    }
}

/**
 * GET /api/system/app-config
 * Retourne la configuration de l'application (nom de team, etc.)
 */
async function getAppConfig(req, res) {
    try {
        const { APP } = require('../config');

        res.json({
            success: true,
            data: {
                teamName: APP.TEAM_NAME
            }
        });

    } catch (error) {
        console.error('[system.controller] Error in getAppConfig:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la lecture de la configuration',
            error: error.message
        });
    }
}

module.exports = {
    getSystemPaths,
    updateSystemPaths,
    getAppConfig
};
