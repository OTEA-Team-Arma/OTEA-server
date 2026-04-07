/**
 * presets.service.js
 * 
 * Service pour gérer les configurations presets du serveur Arma
 * Responsabilités:
 * - Charger les presets depuis fichiers
 * - Sauvegarder les presets
 * - Valider les configurations
 * - Lister les presets disponibles
 * - Exporter/importer presets
 * 
 * ⚠️ NOTE: Ce service n'a PAS de dépendances HTTP (req/res)
 * Il retourne des Promises et peut être utilisé n'importe où
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const LogService = require('./log.service');

const PRESETS_DIR = path.join(__dirname, '..', '..', 'presets');

/**
 * Schema de validation pour une configuration preset
 */
const PRESET_SCHEMA = {
    id: { required: true, type: 'string' },
    name: { required: true, type: 'string' },
    difficulty: { type: 'string' },
    maxPlayers: { type: 'number' },
    password: { type: 'string' },
    port: { type: 'number' }
};

/**
 * PresetsService
 * Gère les configurations prédéfinies de serveurs
 */
class PresetsService {
    /**
     * Initialise le répertoire des presets
     * 
     * @returns {Promise<void>}
     */
    static async init() {
        try {
            if (!fsSync.existsSync(PRESETS_DIR)) {
                await fs.mkdir(PRESETS_DIR, { recursive: true });
                console.log(`[PresetsService] Created presets directory: ${PRESETS_DIR}`);
            }
        } catch (error) {
            console.warn(`[PresetsService] Init failed: ${error.message}`);
        }
    }

    /**
     * Liste tous les presets disponibles
     * 
     * @returns {Promise<Array>} Liste des presets
     */
    static async listPresets() {
        try {
            await this.init();

            const files = await fs.readdir(PRESETS_DIR);
            const presets = [];

            for (const file of files) {
                if (!file.endsWith('.json')) {
                    continue;
                }

                try {
                    const preset = await this.loadPreset(file.replace('.json', ''));
                    presets.push(preset);
                } catch (error) {
                    console.warn(`[PresetsService] Failed to load ${file}: ${error.message}`);
                }
            }

            return presets;
        } catch (error) {
            console.warn(`[PresetsService] listPresets failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Charge un preset par ID
     * 
     * @param {string} presetId - ID du preset
     * @returns {Promise<Object>} Données du preset
     * @throws {Error} Si preset n'existe pas
     */
    static async loadPreset(presetId) {
        try {
            await this.init();

            const filePath = path.join(PRESETS_DIR, `${presetId}.json`);

            if (!fsSync.existsSync(filePath)) {
                throw new Error(`Preset not found: ${presetId}`);
            }

            const content = await fs.readFile(filePath, 'utf-8');
            const preset = JSON.parse(content);

            // Valider
            const validation = this._validatePreset(preset);
            if (!validation.valid) {
                throw new Error(`Invalid preset format: ${validation.errors.join(', ')}`);
            }

            return preset;
        } catch (error) {
            throw new Error(`Failed to load preset: ${error.message}`);
        }
    }

    /**
     * Sauvegarde un nouveau preset ou met à jour un existant
     * 
     * @param {string} presetId - ID unique du preset
     * @param {Object} config - Configuration du serveur
     * @param {Object} metadata - Métadonnées optionnelles
     * @returns {Promise<Object>} Preset sauvegardé
     * @throws {Error} Si validation échoue
     */
    static async savePreset(presetId, config, metadata = {}) {
        try {
            await this.init();

            // Valider config
            const validation = this._validatePreset(config);
            if (!validation.valid) {
                throw new Error(`Invalid preset: ${validation.errors.join(', ')}`);
            }

            // Créer preset complet
            const preset = {
                id: presetId,
                ...config,
                createdAt: metadata.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                description: metadata.description || ''
            };

            // Écrire fichier
            const filePath = path.join(PRESETS_DIR, `${presetId}.json`);
            await fs.writeFile(filePath, JSON.stringify(preset, null, 2));

            // Log
            const isNew = !fsSync.existsSync(filePath);
            await LogService.logAction(
                isNew ? 'preset-created' : 'preset-updated',
                'system',
                { presetId: presetId }
            );

            return preset;
        } catch (error) {
            await LogService.logAction('preset-save-error', 'system', {
                presetId: presetId,
                error: error.message
            });
            throw new Error(`Failed to save preset: ${error.message}`);
        }
    }

    /**
     * Supprime un preset
     * 
     * @param {string} presetId - ID du preset
     * @returns {Promise<Object>} { success, message }
     */
    static async deletePreset(presetId) {
        try {
            await this.init();

            const filePath = path.join(PRESETS_DIR, `${presetId}.json`);

            if (!fsSync.existsSync(filePath)) {
                throw new Error(`Preset not found: ${presetId}`);
            }

            await fs.unlink(filePath);

            await LogService.logAction('preset-deleted', 'system', {
                presetId: presetId
            });

            return {
                success: true,
                presetId: presetId,
                message: `Preset ${presetId} deleted`
            };
        } catch (error) {
            await LogService.logAction('preset-delete-error', 'system', {
                presetId: presetId,
                error: error.message
            });
            throw new Error(`Failed to delete preset: ${error.message}`);
        }
    }

    /**
     * Duplique un preset existant
     * Utile pour crear des variations
     * 
     * @param {string} sourceId - ID du preset source
     * @param {string} destId - ID du nouveau preset
     * @returns {Promise<Object>} Nouveau preset
     */
    static async duplicatePreset(sourceId, destId) {
        try {
            // Charger source
            const source = await this.loadPreset(sourceId);

            // Créer copie
            const copy = {
                ...source,
                id: destId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                name: `${source.name} (copy)`
            };

            // Sauvegarder
            return await this.savePreset(destId, copy);
        } catch (error) {
            throw new Error(`Failed to duplicate preset: ${error.message}`);
        }
    }

    /**
     * Importe un preset depuis file upload
     * 
     * @param {string} presetId - ID pour le nouveau preset
     * @param {Object} presetData - Données du preset
     * @returns {Promise<Object>} Preset importé
     */
    static async importPreset(presetId, presetData) {
        try {
            // Valider données
            const validation = this._validatePreset(presetData);
            if (!validation.valid) {
                throw new Error(`Invalid preset data: ${validation.errors.join(', ')}`);
            }

            // Sauvegarder
            return await this.savePreset(presetId, presetData, {
                description: `Imported from external source`
            });
        } catch (error) {
            throw new Error(`Failed to import preset: ${error.message}`);
        }
    }

    /**
     * Exporte un preset en JSON
     * 
     * @param {string} presetId - ID du preset
     * @returns {Promise<string>} JSON du preset
     */
    static async exportPreset(presetId) {
        try {
            const preset = await this.loadPreset(presetId);
            return JSON.stringify(preset, null, 2);
        } catch (error) {
            throw new Error(`Failed to export preset: ${error.message}`);
        }
    }

    /**
     * Récupe les statistiques des presets
     * 
     * @returns {Promise<Object>}
     */
    static async getStats() {
        try {
            const presets = await this.listPresets();
            const dirs = await fs.readdir(PRESETS_DIR);

            return {
                totalPresets: presets.length,
                totalFiles: dirs.length,
                presets: presets.map(p => ({
                    id: p.id,
                    name: p.name,
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt
                }))
            };
        } catch (error) {
            console.warn(`[PresetsService] getStats failed: ${error.message}`);
            return { error: error.message };
        }
    }

    /**
     * Recherche les presets par pattern
     * 
     * @param {string} pattern - Pattern à chercher (dans name, description, etc)
     * @returns {Promise<Array>} Presets matchant
     */
    static async search(pattern) {
        try {
            const presets = await this.listPresets();
            const regex = new RegExp(pattern, 'gi');

            return presets.filter(p =>
                regex.test(p.name)
                || regex.test(p.id)
                || regex.test(p.description || '')
            );
        } catch (error) {
            console.warn(`[PresetsService] search failed: ${error.message}`);
            return [];
        }
    }

    /**
     * HELPER: Valide une configuration preset
     * Vérifie que les champs requireds sont présents et du bon type
     * 
     * @private
     * @param {Object} preset - Preset à valider
     * @returns {Object} { valid: bool, errors: string[] }
     */
    static _validatePreset(preset) {
        const errors = [];

        if (!preset || typeof preset !== 'object') {
            return {
                valid: false,
                errors: ['Preset must be an object']
            };
        }

        // Vérifier required fields
        for (const [field, rules] of Object.entries(PRESET_SCHEMA)) {
            if (rules.required && !preset[field]) {
                errors.push(`Missing required field: ${field}`);
            }

            if (preset[field] && rules.type) {
                const actualType = typeof preset[field];
                if (actualType !== rules.type) {
                    errors.push(
                        `Field ${field} must be ${rules.type}, got ${actualType}`
                    );
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * HELPER: Crée un preset template par défaut
     * Utile pour montrer aux users le format
     * 
     * @returns {Object}
     */
    static createTemplate() {
        return {
            id: 'new_preset',
            name: 'My Server',
            difficulty: 'Regular',
            maxPlayers: 64,
            password: '',
            port: 2301,
            description: 'My custom preset'
        };
    }

    /**
     * Crée un preset d'exemple
     * 
     * @param {string} presetId - ID du preset
     * @returns {Promise<Object>}
     */
    static async createExample(presetId = 'example') {
        try {
            const template = this.createTemplate();
            template.id = presetId;
            template.name = `Example - ${presetId}`;

            return await this.savePreset(presetId, template, {
                description: 'Example configuration for reference'
            });
        } catch (error) {
            throw new Error(`Failed to create example: ${error.message}`);
        }
    }
}

module.exports = PresetsService;
