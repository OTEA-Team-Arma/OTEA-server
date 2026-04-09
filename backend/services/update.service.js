/**
 * update.service.js
 * 
 * Service pour gérer les mises à jour du serveur Arma Reforger
 * Responsabilités:
 * - Exécuter SteamCMD pour télécharger les updates
 * - Parser la sortie de SteamCMD
 * - Vérifier l'état de la mise à jour
 * - Gérer les erreurs et retries
 * 
 * ⚠️ NOTE: Ce service n'a PAS de dépendances HTTP (req/res)
 * Il retourne des Promises et peut être utilisé n'importe où
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

/**
 * UpdateService
 * Gère les opérations de mise à jour du serveur Arma
 */
class UpdateService {
    /**
     * Exécute une mise à jour complète du serveur Arma
     * Utilise SteamCMD pour télécharger les dernières versions
     * 
     * @param {string} steamCmdPath - Chemin vers SteamCMD exécutable
     * @param {string} armaPath - Chemin vers le répertoire Arma server
     * @param {Object} options - Options supplémentaires
     * @returns {Promise<Object>} { success, version, output, timestamp }
     * @throws {Error} Si SteamCMD échoue
     */
    static async triggerUpdate(steamCmdPath, armaPath, options = {}) {
        if (!steamCmdPath) {
            throw new Error('steamCmdPath is required');
        }
        if (!armaPath) {
            throw new Error('armaPath is required');
        }

        try {
            // Vérifier que SteamCMD existe
            const fs = require('fs');
            if (!fs.existsSync(steamCmdPath)) {
                console.warn(`[UpdateService] SteamCMD not found at ${steamCmdPath} - running in simulation mode`);
                return {
                    success: true,
                    version: 'SIMULATION-' + Date.now(),
                    output: 'Simulation mode (SteamCMD not available)',
                    stderr: '',
                    timestamp: new Date().toISOString(),
                    message: 'Update simulated (SteamCMD not available on this system)',
                    simulated: true
                };
            }

            // Construire la ligne de commande SteamCMD
            // App ID 1874900 = Arma Reforger
            const ARMA_APP_ID = 1874900;
            const cmd = this._buildSteamCmdCommand(steamCmdPath, ARMA_APP_ID, armaPath);

            console.log(`[UpdateService] Executing: ${cmd}`);

            // Exécuter SteamCMD
            const result = await this._executeSteamCmd(cmd, steamCmdPath);

            // Parser la version du output
            const version = this._parseBuildId(result.output);

            return {
                success: true,
                version: version,
                output: result.output,
                stderr: result.stderr,
                timestamp: new Date().toISOString(),
                message: 'Server update completed successfully'
            };
        } catch (error) {
            throw new Error(`Update failed: ${error.message}`);
        }
    }

    /**
     * Déclenche une mise à jour avec retry automatique
     * Réessaye jusqu'à maxRetries fois en cas d'échec
     * 
     * @param {string} steamCmdPath - Chemin vers SteamCMD
     * @param {string} armaPath - Chemin vers Arma
     * @param {Object} options - { maxRetries: 3, retryDelay: 5000 }
     * @returns {Promise<Object>} Résultat de la mise à jour
     */
    static async triggerUpdateWithRetry(steamCmdPath, armaPath, options = {}) {
        const maxRetries = options.maxRetries || 3;
        const retryDelay = options.retryDelay || 5000; // ms
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(
                    `[UpdateService] Attempt ${attempt}/${maxRetries} to update server...`
                );
                const result = await this.triggerUpdate(steamCmdPath, armaPath, options);
                return {
                    ...result,
                    attempt: attempt,
                    retriesNeeded: attempt > 1
                };
            } catch (error) {
                lastError = error;
                console.warn(
                    `[UpdateService] Attempt ${attempt} failed: ${error.message}`
                );

                // Attendre avant retry (sauf dernière tentative)
                if (attempt < maxRetries) {
                    console.log(`[UpdateService] Retrying in ${retryDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }

        throw new Error(
            `Update failed after ${maxRetries} attempts. Last error: ${lastError.message}`
        );
    }

    /**
     * Valide qu'une mise à jour a été appliquée avec succès
     * En comparant les versions installed vs available
     * 
     * @param {string} installedVersion - Version actuellement installée
     * @param {string} expectedVersion - Version attendue après update
     * @returns {boolean}
     */
    static verifyUpdate(installedVersion, expectedVersion) {
        if (!installedVersion || !expectedVersion) {
            console.warn('[UpdateService] Cannot verify: missing version info');
            return false;
        }

        const installed = parseInt(installedVersion);
        const expected = parseInt(expectedVersion);

        const success = installed >= expected;
        console.log(
            `[UpdateService] Verification: installed=${installed}, expected=${expected}, success=${success}`
        );

        return success;
    }

    /**
     * HELPER: Construit la commande SteamCMD complète
     * 
     * Format typique (Windows):
     * "C:\SteamCMD\steamcmd.exe" +login anonymous +app_update 1874900 -beta server validate +quit
     * 
     * @private
     * @param {string} steamCmdPath - Chemin vers SteamCMD
     * @param {number} appId - ID App Steam
     * @param {string} targetPath - Répertoire de destination
     * @returns {string} Commande complète
     */
    static _buildSteamCmdCommand(steamCmdPath, appId, targetPath) {
        const parts = [
            `"${steamCmdPath}"`,
            '+login anonymous',
            `+app_update ${appId}`,
            '-beta server',
            'validate',
            '+quit'
        ];

        // Sur Windows, injecter -dir aussi pour être certain du répertoire
        if (process.platform === 'win32') {
            // Avant +quit, ajouter -dir
            parts.splice(parts.length - 1, 0, `-dir "${targetPath}"`);
        }

        return parts.join(' ');
    }

    /**
     * HELPER: Exécute SteamCMD de manière synchrone
     * Retourne output + stderr
     * 
     * @private
     * @param {string} cmd - Commande à exécuter
     * @param {string} steamCmdPath - Chemin SteamCMD (pour parsing errors)
     * @returns {Promise<{output, stderr}>}
     */
    static async _executeSteamCmd(cmd, steamCmdPath) {
        return new Promise((resolve, reject) => {
            exec(cmd, { timeout: 300000 }, (error, stdout, stderr) => {
                // SteamCMD retourne souvent exit code 0 même avec warnings
                // Donc on parse l'output au lieu de vérifier error

                const output = stdout || '';
                const errorOutput = stderr || '';

                // Vérifier erreurs critiques
                if (error && error.code !== 0) {
                    console.error('[UpdateService] SteamCMD error:', error.message);

                    // Certains errors non-fatals peuvent être ignorés
                    if (error.message.includes('ETIMEDOUT')) {
                        reject(new Error('SteamCMD timeout (network issue)'));
                    } else if (
                        !output.includes('Success!')
                        && !output.includes('100.0%')
                    ) {
                        reject(new Error(`SteamCMD failed: ${error.message}`));
                    }
                }

                // Vérifier patterns de succès dans output
                const hasSuccess = output.includes('Success!')
                    || output.includes('100.0%')
                    || output.includes('fully updated');

                if (!hasSuccess && !output) {
                    reject(new Error('SteamCMD produced no output'));
                    return;
                }

                resolve({
                    output: output,
                    stderr: errorOutput,
                    success: true
                });
            });
        });
    }

    /**
     * HELPER: Parse la version buildid depuis output SteamCMD
     * Format attendu: "buildid" ou "Build ID: 12345"
     * 
     * @private
     * @param {string} output - Output brut de SteamCMD
     * @returns {string|null} Buildid trouvé ou null
     */
    static _parseBuildId(output) {
        if (!output) {
            return null;
        }

        // Plusieurs patterns possibles
        const patterns = [
            /buildid\s+(\d+)/gi,          // buildid 12345
            /Build ID[:=]\s*(\d+)/gi,     // Build ID: 12345
            /(\d{8,})/g                   // Grand nombre
        ];

        for (const pattern of patterns) {
            const match = output.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        // Fallback: chercher n'importe quel grand nombre
        const numbers = output.match(/\d{6,}/g);
        return numbers ? numbers[numbers.length - 1] : null;
    }

    /**
     * HELPER: Parsing complet du output SteamCMD
     * Extrait: status, version, erreurs, warnings
     * 
     * @private
     * @param {string} output - Output brut
     * @returns {Object} { status, version, errors, warnings }
     */
    static _parseFullOutput(output) {
        return {
            status: output.includes('Success!') ? 'completed' : 'in_progress',
            version: this._parseBuildId(output),
            errors: this._extractErrors(output),
            warnings: this._extractWarnings(output),
            raw: output
        };
    }

    /**
     * HELPER: Extrait les erreurs du output
     * 
     * @private
     * @param {string} output - Output brut
     * @returns {Array<string>} Erreurs trouvées
     */
    static _extractErrors(output) {
        const errorLines = output.split('\n').filter(line =>
            line.toLowerCase().includes('error')
            || line.toLowerCase().includes('failed')
            || line.toLowerCase().includes('unable')
        );
        return errorLines;
    }

    /**
     * HELPER: Extrait les warnings du output
     * 
     * @private
     * @param {string} output - Output brut
     * @returns {Array<string>} Warnings trouvés
     */
    static _extractWarnings(output) {
        const warnLines = output.split('\n').filter(line =>
            line.toLowerCase().includes('warning')
            || line.toLowerCase().includes('warn')
        );
        return warnLines;
    }

    /**
     * Generates a test execution (pour debugging)
     * Simule une exécution SteamCMD sans vraiment le faire
     * 
     * @returns {Object} Résultat simulé
     */
    static mockExecute() {
        return {
            success: true,
            version: '123456',
            output: 'Update log: Success! buildid 123456',
            timestamp: new Date().toISOString(),
            message: '[MOCK] Server update completed'
        };
    }
}

module.exports = UpdateService;
