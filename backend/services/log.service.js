/**
 * log.service.js
 * 
 * Service pour gérer les logs d'admin et du serveur Arma
 * Responsabilités:
 * - Journaliser les actions admin (audit trail)
 * - Rotation automatique des logs
 * - Recherche et filtrage dans logs
 * - Sanitization des données sensibles
 * 
 * ⚠️ NOTE: Ce service n'a PAS de dépendances HTTP (req/res)
 * Il retourne des Promises et peut être utilisé n'importe où
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

/**
 * Configuration des logs
 */
const LOG_CONFIG = {
    adminLogFile: path.join(__dirname, '..', '..', 'data', 'admin.log'),
    adminLogDir: path.join(__dirname, '..', '..', 'data', 'logs'),
    maxLogSizeMb: 10,           // Archiver si fichier > 10 MB
    maxLogFiles: 5,             // Garder max 5 fichiers (50 MB total)
    maxLogAgeDays: 30,          // Supprimer logs > 30 jours
    sensitiveHeaders: [
        'authorization',
        'cookie',
        'x-api-key',
        'x-auth-token',
        'set-cookie'
    ]
};

/**
 * LogService
 * Gère les logs d'administration et d'audit
 */
class LogService {
    /**
     * Enregistre une action admin
     * 
     * @param {string} action - Action effectuée (ex: 'start-server', 'update-server')
     * @param {string} user - Utilisateur qui a effectué l'action
     * @param {Object} details - Détails additionnels (optionnel)
     * @returns {Promise<void>}
     */
    static async logAction(action, user, details = {}) {
        try {
            // Rotation si nécessaire
            await this._rotateIfNeeded();

            // Sanitizer les données sensibles
            const safeDetails = this._sanitizeDetails(details);

            // Créer l'entrée de log
            const entry = {
                date: new Date().toISOString(),
                user: user || 'unknown',
                action: action,
                details: safeDetails,
                ip: safeDetails.ip || undefined
            };

            // Lire logs existants
            let logs = [];
            try {
                const content = await fs.readFile(LOG_CONFIG.adminLogFile, 'utf-8');
                logs = JSON.parse(content);
            } catch {
                logs = [];
            }

            // Ajouter nouvelle entrée
            logs.push(entry);

            // Écrire logs
            await fs.writeFile(
                LOG_CONFIG.adminLogFile,
                JSON.stringify(logs, null, 2)
            );

            console.log(`[LogService] Action logged: ${action} by ${user}`);
        } catch (error) {
            console.error(`[LogService] Failed to log action: ${error.message}`);
            // Ne pas throw - les logs ne doivent pas briser l'app
        }
    }

    /**
     * Récupère les N dernières lignes du log
     * 
     * @param {number} lines - Nombre de lignes à retourner (défaut: 50)
     * @returns {Promise<Array>} Entrées de log
     */
    static async getTail(lines = 50) {
        try {
            const content = await fs.readFile(LOG_CONFIG.adminLogFile, 'utf-8');
            let logs = JSON.parse(content);

            // Retourner les N dernières
            return logs.slice(Math.max(0, logs.length - lines));
        } catch (error) {
            console.warn(`[LogService] Failed to read logs: ${error.message}`);
            return [];
        }
    }

    /**
     * Recherche dans les logs par pattern
     * 
     * @param {RegExp|string} pattern - Pattern à chercher (regex ou string)
     * @param {Object} options - { field: 'action', limit: 100 }
     * @returns {Promise<Array>} Résultats trouvés
     */
    static async search(pattern, options = {}) {
        try {
            const content = await fs.readFile(LOG_CONFIG.adminLogFile, 'utf-8');
            let logs = JSON.parse(content);

            const regex = typeof pattern === 'string'
                ? new RegExp(pattern, 'gi')
                : pattern;

            const field = options.field || 'action';
            const limit = options.limit || 100;

            // Filtrer
            let results = logs.filter(log => {
                if (!field || field === '*') {
                    // Chercher partout
                    return JSON.stringify(log).match(regex);
                }
                return log[field] && String(log[field]).match(regex);
            });

            return results.slice(0, limit);
        } catch (error) {
            console.warn(`[LogService] Search failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Filtre les logs par utilisateur
     * 
     * @param {string} user - Utilisateur à filtrer
     * @param {number} limit - Nombre max de résultats
     * @returns {Promise<Array>}
     */
    static async filterByUser(user, limit = 100) {
        try {
            const content = await fs.readFile(LOG_CONFIG.adminLogFile, 'utf-8');
            let logs = JSON.parse(content);

            return logs
                .filter(log => log.user === user)
                .slice(-limit);
        } catch (error) {
            console.warn(`[LogService] Filter failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Filtre les logs par action
     * 
     * @param {string} action - Action à filtrer
     * @param {number} limit - Nombre max de résultats
     * @returns {Promise<Array>}
     */
    static async filterByAction(action, limit = 100) {
        try {
            const content = await fs.readFile(LOG_CONFIG.adminLogFile, 'utf-8');
            let logs = JSON.parse(content);

            return logs
                .filter(log => log.action === action)
                .slice(-limit);
        } catch (error) {
            console.warn(`[LogService] Filter failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Récupère le statut des logs (taille, nombre, age)
     * 
     * @returns {Promise<Object>}
     */
    static async getStatus() {
        try {
            await this._ensureLogDir();

            const currentStats = fsSync.existsSync(LOG_CONFIG.adminLogFile)
                ? fsSync.statSync(LOG_CONFIG.adminLogFile)
                : null;

            // Backups
            const backupDir = LOG_CONFIG.adminLogDir;
            const backupFiles = fsSync.existsSync(backupDir)
                ? fsSync.readdirSync(backupDir).filter(f => f.startsWith('admin.log.'))
                : [];

            const backups = backupFiles.map(f => ({
                name: f,
                size: fsSync.statSync(path.join(backupDir, f)).size,
                sizeMb: (fsSync.statSync(path.join(backupDir, f)).size / (1024 * 1024)).toFixed(2)
            }));

            const totalBackupSize = backups.reduce((sum, b) => sum + b.size, 0);

            return {
                currentLog: {
                    path: LOG_CONFIG.adminLogFile,
                    exists: currentStats ? true : false,
                    sizeMb: currentStats ? (currentStats.size / (1024 * 1024)).toFixed(2) : 0,
                    lastModified: currentStats ? currentStats.mtime.toISOString() : null
                },
                backupLogs: backups,
                totalBackupSizeMb: (totalBackupSize / (1024 * 1024)).toFixed(2),
                configuration: {
                    maxLogSizeMb: LOG_CONFIG.maxLogSizeMb,
                    maxLogFiles: LOG_CONFIG.maxLogFiles,
                    maxLogAgeDays: LOG_CONFIG.maxLogAgeDays
                }
            };
        } catch (error) {
            console.warn(`[LogService] getStatus failed: ${error.message}`);
            return { error: error.message };
        }
    }

    /**
     * Nettoie manuellement les logs
     * Supprime les fichiers trop vieux et l'excédent
     * 
     * @returns {Promise<Object>} Résultats du cleanup
     */
    static async cleanup() {
        try {
            await this._ensureLogDir();

            const logDir = LOG_CONFIG.adminLogDir;
            const files = fsSync.readdirSync(logDir);
            const now = Date.now();
            let deleted = 0;

            // Supprimer les fichiers > maxLogAgeDays
            for (const file of files) {
                if (!file.startsWith('admin.log.')) {
                    continue;
                }

                const filePath = path.join(logDir, file);
                const stats = fsSync.statSync(filePath);
                const ageInDays = (now - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

                if (ageInDays > LOG_CONFIG.maxLogAgeDays) {
                    await fs.unlink(filePath);
                    console.log(
                        `[LogService] Deleted old log: ${file} (${ageInDays.toFixed(1)} days old)`
                    );
                    deleted++;
                }
            }

            // Garder seulement les maxLogFiles les plus récents
            const sorted = files
                .filter(f => f.startsWith('admin.log.'))
                .sort()
                .reverse();

            for (let i = LOG_CONFIG.maxLogFiles; i < sorted.length; i++) {
                const filePath = path.join(logDir, sorted[i]);
                await fs.unlink(filePath);
                console.log(`[LogService] Deleted excess backup: ${sorted[i]}`);
                deleted++;
            }

            return {
                success: true,
                deleted: deleted,
                message: `Cleanup completed: ${deleted} files deleted`
            };
        } catch (error) {
            console.warn(`[LogService] Cleanup failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Export logs en JSON ou CSV
     * 
     * @param {string} format - 'json' ou 'csv'
     * @param {number} limit - Nombre max d'entrées
     * @returns {Promise<string>} Données formatées
     */
    static async export(format = 'json', limit = 10000) {
        try {
            const content = await fs.readFile(LOG_CONFIG.adminLogFile, 'utf-8');
            let logs = JSON.parse(content);

            logs = logs.slice(Math.max(0, logs.length - limit));

            if (format === 'csv') {
                return this._toCsv(logs);
            }

            return JSON.stringify(logs, null, 2);
        } catch (error) {
            console.warn(`[LogService] Export failed: ${error.message}`);
            return '';
        }
    }

    /**
     * HELPER: Rotation automatique si fichier trop gros
     * 
     * @private
     * @returns {Promise<void>}
     */
    static async _rotateIfNeeded() {
        try {
            await this._ensureLogDir();

            if (!fsSync.existsSync(LOG_CONFIG.adminLogFile)) {
                await fs.writeFile(LOG_CONFIG.adminLogFile, JSON.stringify([], null, 2));
                return;
            }

            const stats = fsSync.statSync(LOG_CONFIG.adminLogFile);
            const fileSizeMb = stats.size / (1024 * 1024);

            if (fileSizeMb > LOG_CONFIG.maxLogSizeMb) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const archivePath = path.join(
                    LOG_CONFIG.adminLogDir,
                    `admin.log.${timestamp}.bak`
                );

                await fs.rename(LOG_CONFIG.adminLogFile, archivePath);
                await fs.writeFile(LOG_CONFIG.adminLogFile, JSON.stringify([], null, 2));

                console.log(`[LogService] Rotated log to ${path.basename(archivePath)}`);

                // Cleanup old files
                await this.cleanup();
            }
        } catch (error) {
            console.warn(`[LogService] Rotation error: ${error.message}`);
        }
    }

    /**
     * HELPER: Crée le répertoire de logs s'il n'existe pas
     * 
     * @private
     * @returns {Promise<void>}
     */
    static async _ensureLogDir() {
        const logDir = LOG_CONFIG.adminLogDir;
        if (!fsSync.existsSync(logDir)) {
            await fs.mkdir(logDir, { recursive: true });
        }
    }

    /**
     * HELPER: Sanitize les détails des logs
     * Masque les données sensibles (headers, tokens, etc)
     * 
     * @private
     * @param {Object} details - Détails bruts
     * @returns {Object} Détails sanitizés
     */
    static _sanitizeDetails(details = {}) {
        const sanitized = { ...details };

        // Sanitizer les headers de requête
        if (sanitized.req && typeof sanitized.req === 'object') {
            sanitized.req = {
                ip: sanitized.req.ip,
                url: sanitized.req.url,
                method: sanitized.req.method,
                headers: this._sanitizeHeaders(sanitized.req.headers || {})
            };
        }

        // Supprimer les données complètes de requête
        if (sanitized.body) {
            if (sanitized.body.password) {
                sanitized.body.password = '[REDACTED]';
            }
            if (sanitized.body.token) {
                sanitized.body.token = '[REDACTED]';
            }
        }

        return sanitized;
    }

    /**
     * HELPER: Sanitize les headers
     * 
     * @private
     * @param {Object} headers - Headers bruts
     * @returns {Object} Headers sanitizés
     */
    static _sanitizeHeaders(headers = {}) {
        const sanitized = { ...headers };
        LOG_CONFIG.sensitiveHeaders.forEach(key => {
            if (sanitized[key]) {
                sanitized[key] = '[REDACTED]';
            }
        });
        return sanitized;
    }

    /**
     * HELPER: Convertit logs en CSV
     * 
     * @private
     * @param {Array} logs - Logs à convertir
     * @returns {string} Format CSV
     */
    static _toCsv(logs) {
        if (!logs || logs.length === 0) {
            return 'No logs';
        }

        // Headers
        const headers = ['date', 'user', 'action', 'ip', 'details'];
        let csv = headers.join(',') + '\n';

        // Rows
        for (const log of logs) {
            const row = [
                `"${log.date || ''}"`,
                `"${log.user || ''}"`,
                `"${log.action || ''}"`,
                `"${log.ip || ''}"`,
                `"${JSON.stringify(log.details || {}).replace(/"/g, '\\"')}"` // Escape quotes
            ];
            csv += row.join(',') + '\n';
        }

        return csv;
    }
}

module.exports = LogService;
