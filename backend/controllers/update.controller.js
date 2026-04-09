/**
 * update.controller.js
 * 
 * Contrôleur pour les opérations de mise à jour du serveur Arma
 * Orchestre UpdateService + LogService
 */

const UpdateService = require('../services/update.service');
const ArmaVersionService = require('../services/arma-version.service');
const LogService = require('../services/log.service');
const { success, error, validationError } = require('../models/responses');

class UpdateController {
    /**
     * POST /api/updates/trigger
     * Déclenche une mise à jour du serveur Arma
     */
    static async triggerUpdate(req, res) {
        try {
            const osAbstraction = req.app.locals.osAbstraction;
            
            if (!osAbstraction) {
                return res.status(500).json(
                    error('osAbstraction not available', 'SYSTEM_ERROR')
                );
            }

            const config = osAbstraction.getConfig();
            const steamCmdPath = config?.steamCmdPath;
            const armaPath = config?.serverRootPath;

            if (!steamCmdPath || !armaPath) {
                return res.status(400).json(
                    validationError(['Steam path or Arma path not configured'])
                );
            }

            await LogService.logAction('update-triggered', req.user?.name, {
                ip: req.ip,
                steamCmdPath,
                armaPath
            });

            // Déclencher la mise à jour
            const result = await UpdateService.triggerUpdateWithRetry(
                steamCmdPath,
                armaPath,
                { maxRetries: 3, retryDelay: 5000 }
            );

            await LogService.logAction('update-completed', req.user?.name, {
                ip: req.ip,
                version: result.version,
                attempt: result.attempt
            });

            return res.json(success(result, 'Update completed successfully'));
        } catch (err) {
            await LogService.logAction('update-error', req.user?.name, {
                ip: req.ip,
                error: err.message
            });
            return res.status(500).json(
                error('Failed to update server', 'UPDATE_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/updates/check
     * Vérifie si une mise à jour est disponible
     */
    static async checkForUpdates(req, res) {
        try {
            const osAbstraction = req.app.locals.osAbstraction;
            
            if (!osAbstraction) {
                return res.status(500).json(
                    error('osAbstraction not available', 'SYSTEM_ERROR')
                );
            }

            const config = osAbstraction.getConfig();
            const steamCmdPath = config?.steamCmdPath;

            if (!steamCmdPath) {
                return res.status(400).json(
                    error('Steam path not configured', 'MISSING_CONFIG')
                );
            }

            const updateAvailable = await ArmaVersionService.isUpdateAvailable(steamCmdPath);
            const installed = await ArmaVersionService.getInstalledVersion();
            const available = await ArmaVersionService.getAvailableVersion(steamCmdPath);

            await LogService.logAction('update-check', req.user?.name, {
                ip: req.ip,
                updateAvailable
            });

            return res.json(success(
                {
                    updateAvailable,
                    installed,
                    available
                },
                updateAvailable ? 'Update available' : 'Server is up to date'
            ));
        } catch (err) {
            return res.status(500).json(
                error('Failed to check updates', 'CHECK_ERROR', err.message)
            );
        }
    }

    /**
     * GET /api/updates/status
     * Récupère le statut de la dernière mise à jour
     */
    static async getUpdateStatus(req, res) {
        try {
            const installed = await ArmaVersionService.getInstalledVersion();

            return res.json(success(
                {
                    currentVersion: installed,
                    lastChecked: new Date().toISOString()
                },
                'Update status retrieved'
            ));
        } catch (err) {
            return res.status(500).json(
                error('Failed to get update status', 'STATUS_ERROR', err.message)
            );
        }
    }

    /**
     * POST /api/updates/verify
     * Valide qu'une mise à jour a réussi
     */
    static async verifyUpdate(req, res) {
        try {
            const { installed, expected } = req.body;

            if (!installed || !expected) {
                return res.status(400).json(
                    validationError(['installed and expected versions required'])
                );
            }

            const verified = UpdateService.verifyUpdate(installed, expected);

            await LogService.logAction('update-verified', req.user?.name, {
                ip: req.ip,
                verified,
                installed,
                expected
            });

            return res.json(success(
                { verified, installed, expected },
                verified ? 'Update verified successfully' : 'Update verification failed'
            ));
        } catch (err) {
            return res.status(500).json(
                error('Failed to verify update', 'VERIFY_ERROR', err.message)
            );
        }
    }
}

module.exports = UpdateController;
