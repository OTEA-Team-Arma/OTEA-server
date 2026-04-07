/**
 * presets.controller.js
 * 
 * Contrôleur pour la gestion des presets de serveur
 * Orchestre PresetsService + LogService
 */

const PresetsService = require('../services/presets.service');
const LogService = require('../services/log.service');
const { success, error, validationError } = require('../models/responses');

class PresetsController {
    /**
     * GET /api/presets
     * Liste tous les presets disponibles
     */
    static async listPresets(req, res) {
        try {
            const presets = await PresetsService.listPresets();

            return res.json(success(
                { count: presets.length, presets },
                `Retrieved ${presets.length} preset(s)`
            ));
        } catch (err) {
            return res.status(500).json(
                error('Failed to list presets', 'LIST_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/presets/:id
     * Charge un preset spécifique
     */
    static async loadPreset(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json(
                    error('Preset ID is required', 'MISSING_ID')
                );
            }

            const preset = await PresetsService.loadPreset(id);

            return res.json(success(preset, 'Preset loaded successfully'));
        } catch (err) {
            if (err.message.includes('not found')) {
                return res.status(404).json(
                    error('Preset not found', 'NOT_FOUND', err.message)
                );
            }
            return res.status(500).json(
                error('Failed to load preset', 'LOAD_ERROR', err.message)
            );
        }
    }

    /**
     * POST /api/presets
     * Crée ou met à jour un preset
     */
    static async savePreset(req, res) {
        try {
            const { id, ...config } = req.body;

            if (!id || !config) {
                return res.status(400).json(
                    validationError(['id and config are required'])
                );
            }

            const preset = await PresetsService.savePreset(id, config, {
                description: req.body.description
            });

            await LogService.logAction('preset-saved', req.user?.name, {
                ip: req.ip,
                presetId: id
            });

            return res.json(success(preset, 'Preset saved successfully'));
        } catch (err) {
            if (err.message.includes('Invalid')) {
                return res.status(400).json(
                    validationError([err.message])
                );
            }
            await LogService.logAction('preset-save-error', req.user?.name, {
                ip: req.ip,
                error: err.message
            });
            return res.status(500).json(
                error('Failed to save preset', 'SAVE_ERROR', err.message)
            );
        }
    }

    /**
     * DELETE /api/presets/:id
     * Supprime un preset
     */
    static async deletePreset(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json(
                    error('Preset ID is required', 'MISSING_ID')
                );
            }

            const result = await PresetsService.deletePreset(id);

            await LogService.logAction('preset-deleted', req.user?.name, {
                ip: req.ip,
                presetId: id
            });

            return res.json(success(result, 'Preset deleted successfully'));
        } catch (err) {
            if (err.message.includes('not found')) {
                return res.status(404).json(
                    error('Preset not found', 'NOT_FOUND')
                );
            }
            await LogService.logAction('preset-delete-error', req.user?.name, {
                ip: req.ip,
                presetId: req.params.id,
                error: err.message
            });
            return res.status(500).json(
                error('Failed to delete preset', 'DELETE_ERROR', err.message)
            );
        }
    }

    /**
     * POST /api/presets/:sourceId/duplicate/:destId
     * Duplique un preset existant
     */
    static async duplicatePreset(req, res) {
        try {
            const { sourceId, destId } = req.params;

            if (!sourceId || !destId) {
                return res.status(400).json(
                    error('Source and destination IDs required', 'MISSING_ID')
                );
            }

            const duplicated = await PresetsService.duplicatePreset(sourceId, destId);

            await LogService.logAction('preset-duplicated', req.user?.name, {
                ip: req.ip,
                from: sourceId,
                to: destId
            });

            return res.json(success(duplicated, 'Preset duplicated successfully'));
        } catch (err) {
            await LogService.logAction('preset-duplicate-error', req.user?.name, {
                ip: req.ip,
                error: err.message
            });
            return res.status(500).json(
                error('Failed to duplicate preset', 'DUPLICATE_ERROR', err.message)
            );
        }
    }

    /**
     * POST /api/presets/import
     * Importe un preset depuis des données externes
     */
    static async importPreset(req, res) {
        try {
            const { id, data } = req.body;

            if (!id || !data) {
                return res.status(400).json(
                    validationError(['id and data are required'])
                );
            }

            const preset = await PresetsService.importPreset(id, data);

            await LogService.logAction('preset-imported', req.user?.name, {
                ip: req.ip,
                presetId: id
            });

            return res.json(success(preset, 'Preset imported successfully'));
        } catch (err) {
            await LogService.logAction('preset-import-error', req.user?.name, {
                ip: req.ip,
                error: err.message
            });
            return res.status(500).json(
                error('Failed to import preset', 'IMPORT_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/presets/:id/export
     * Exporte un preset en JSON
     */
    static async exportPreset(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json(
                    error('Preset ID is required', 'MISSING_ID')
                );
            }

            const json = await PresetsService.exportPreset(id);

            res.set('Content-Type', 'application/json');
            res.set('Content-Disposition', `attachment; filename="preset-${id}.json"`);
            res.send(json);
        } catch (err) {
            return res.status(500).json(
                error('Failed to export preset', 'EXPORT_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/presets/search
     * Recherche les presets par pattern
     */
    static async searchPresets(req, res) {
        try {
            const { query } = req.query;

            if (!query) {
                return res.status(400).json(
                    error('Search query required', 'MISSING_QUERY')
                );
            }

            const results = await PresetsService.search(query);

            return res.json(success(
                { count: results.length, results },
                `Found ${results.length} preset(s)`
            ));
        } catch (err) {
            return res.status(500).json(
                error('Search failed', 'SEARCH_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/presets/stats
     * Récupère les statistiques des presets
     */
    static async getStats(req, res) {
        try {
            const stats = await PresetsService.getStats();

            return res.json(success(stats, 'Preset stats retrieved'));
        } catch (err) {
            return res.status(500).json(
                error('Failed to get stats', 'STATS_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/presets/template
     * Récupère un template par défaut
     */
    static async getTemplate(req, res) {
        try {
            const template = PresetsService.createTemplate();

            return res.json(success(template, 'Template retrieved'));
        } catch (err) {
            return res.status(500).json(
                error('Failed to get template', 'TEMPLATE_ERROR', err.message)
            );
        }
    }
}

module.exports = PresetsController;
