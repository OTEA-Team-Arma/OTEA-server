/**
 * configs.controller.js
 *
 * Contrôleur pour les configurations serveur (Architecture Config Directe)
 * Gère les endpoints CRUD pour les fichiers ServerConfig_*.json
 */

const ArmaServerService = require('../services/arma-server.service');
const { success, error } = require('../models/responses');

class ConfigsController {
    /**
     * GET /api/configs
     * Liste toutes les configurations disponibles
     */
    static async listConfigs(req, res) {
        try {
            const configs = await ArmaServerService.listConfigs();

            return res.json(success(configs, `${configs.length} configuration(s) found`));
        } catch (err) {
            console.error('[ConfigsController] listConfigs error:', err);
            return res.status(500).json(
                error('Failed to list configs', 'LIST_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/configs/:filename
     * Charge une configuration spécifique
     */
    static async loadConfig(req, res) {
        try {
            const { filename } = req.params;

            if (!filename) {
                return res.status(400).json(
                    error('Filename required', 'MISSING_FILENAME')
                );
            }

            const config = await ArmaServerService.loadConfig(filename);

            return res.json(success(config, 'Config loaded'));
        } catch (err) {
            console.error('[ConfigsController] loadConfig error:', err);
            return res.status(500).json(
                error('Failed to load config', 'LOAD_ERROR', err.message)
            );
        }
    }

    /**
     * POST /api/configs
     * Crée une nouvelle configuration
     */
    static async createConfig(req, res) {
        try {
            const configData = req.body;

            if (!configData || !configData.name) {
                return res.status(400).json(
                    error('Config name required', 'MISSING_NAME')
                );
            }

            const result = await ArmaServerService.saveConfig(configData);

            return res.json(success(result, 'Config created successfully'));
        } catch (err) {
            console.error('[ConfigsController] createConfig error:', err);
            return res.status(500).json(
                error('Failed to create config', 'CREATE_ERROR', err.message)
            );
        }
    }

    /**
     * PUT /api/configs/:filename
     * Met à jour une configuration existante
     */
    static async updateConfig(req, res) {
        try {
            const { filename } = req.params;
            const configData = req.body;

            if (!filename) {
                return res.status(400).json(
                    error('Filename required', 'MISSING_FILENAME')
                );
            }

            if (!configData || !configData.name) {
                return res.status(400).json(
                    error('Config name required', 'MISSING_NAME')
                );
            }

            // Supprimer l'ancienne config
            await ArmaServerService.deleteConfig(filename);

            // Créer la nouvelle (qui peut avoir un nom de fichier différent)
            const result = await ArmaServerService.saveConfig(configData);

            return res.json(success(result, 'Config updated successfully'));
        } catch (err) {
            console.error('[ConfigsController] updateConfig error:', err);
            return res.status(500).json(
                error('Failed to update config', 'UPDATE_ERROR', err.message)
            );
        }
    }

    /**
     * DELETE /api/configs/:filename
     * Supprime une configuration
     */
    static async deleteConfig(req, res) {
        try {
            const { filename } = req.params;

            if (!filename) {
                return res.status(400).json(
                    error('Filename required', 'MISSING_FILENAME')
                );
            }

            const result = await ArmaServerService.deleteConfig(filename);

            return res.json(success(result, 'Config deleted successfully'));
        } catch (err) {
            console.error('[ConfigsController] deleteConfig error:', err);
            return res.status(500).json(
                error('Failed to delete config', 'DELETE_ERROR', err.message)
            );
        }
    }
}

module.exports = ConfigsController;
