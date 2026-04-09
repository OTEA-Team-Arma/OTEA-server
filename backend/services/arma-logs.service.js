/**
 * arma-logs.service.js
 * 
 * Service pour capturer, filtrer et streamr les logs du serveur Arma Reforger
 * Responsabilités:
 * - Capturer stdout/stderr du process Arma
 * - Buffer circulaire des logs (derniers N messages)
 * - Filtrer par regex/pattern
 * - Parser les logs (timestamps, niveaux, mods)
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Configuration des logs
 */
const LOGS_CONFIG = {
    bufferSize: 1000,           // Garder dernier 1000 logs en mémoire
    maxLogAge: 24 * 60 * 60,    // 24h
    logDir: path.join(__dirname, '..', '..', 'data', 'arma_logs'),
    // Presets pour le filtrage simple (case-insensitive)
    filterPresets: {
        tilw: 'TILW',
        debugIA: '[Debug IA LOD]',
        error: 'ERROR',
        warning: 'WARNING',
        script: 'SCRIPT'
    }
};

/**
 * Logs buffers par port
 * Structure: { port: [ { timestamp, line, mod, level } ] }
 */
const logsBuffer = {};

/**
 * ArmaLogsService
 * Gère la capture et le filtrage des logs Arma
 */
class ArmaLogsService {
    /**
     * Initialize le buffer pour un port
     * 
     * @param {number} port - Port du serveur
     */
    static initBuffer(port) {
        if (!logsBuffer[port]) {
            logsBuffer[port] = [];
        }
    }

    /**
     * Attacher la capture de logs à un process Arma
     * 
     * @param {ChildProcess} proc - Processus Arma spawné
     * @param {number} port - Port du serveur
     */
    static attachLogger(proc, port) {
        this.initBuffer(port);

        if (!proc || !proc.stdout || !proc.stderr) {
            console.warn(`[ArmaLogs] Cannot attach logger to process - no streams`);
            return;
        }

        // Capturer stdout
        proc.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    this._addLog(port, line.trim());
                }
            });
        });

        // Capturer stderr
        proc.stderr.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    this._addLog(port, `[ERROR] ${line.trim()}`);
                }
            });
        });

        console.log(`[ArmaLogs] Logger attached to port ${port}`);
    }

    /**
     * Ajouter une ligne aux logs
     * 
     * @private
     * @param {number} port - Port du serveur
     * @param {string} line - Ligne du log
     */
    static _addLog(port, line) {
        if (!logsBuffer[port]) {
            this.initBuffer(port);
        }

        // Détecter le niveau
        let level = 'INFO';
        if (line.toUpperCase().includes('ERROR')) level = 'ERROR';
        else if (line.toUpperCase().includes('WARNING') || line.toUpperCase().includes('WARN')) level = 'WARN';
        else if (line.toUpperCase().includes('DEBUG')) level = 'DEBUG';

        const logEntry = {
            timestamp: new Date().toISOString(),
            line: line,
            mod: mod,
            level: level
        };

        // Garder dernier N logs
        logsBuffer[port].push(logEntry);
        if (logsBuffer[port].length > LOGS_CONFIG.bufferSize) {
            logsBuffer[port].shift();
        }
    }

    /**
     * Récupérer les logs filtrés
     * 
     * @param {number} port - Port du serveur
     * @param {Object} options - Options de filtrage
     * @param {string} options.filter - Pattern simple texte (case-insensitive)
     * @param {string} options.preset - Preset prédéfini (tilw, debugIA, error, warning, script)
     * @param {number} options.limit - Nombre max de logs à retourner
     * @param {string} options.level - Filtrer par niveau (ERROR, WARN, INFO, DEBUG)
     * @returns {Array} Logs filtrés
     */
    static getLogs(port, options = {}) {
        if (!logsBuffer[port]) {
            return [];
        }

        let logs = [...logsBuffer[port]];

        // Filtrer par preset
        if (options.preset) {
            const presetFilter = LOGS_CONFIG.filterPresets[options.preset.toLowerCase()];
            if (presetFilter) {
                logs = logs.filter(log => 
                    log.line.toUpperCase().includes(presetFilter.toUpperCase())
                );
            }
        }

        // Filtrer par pattern simple (texte, case-insensitive)
        if (options.filter && !options.preset) {
            const filterUpper = options.filter.toUpperCase();
            logs = logs.filter(log => log.line.toUpperCase().includes(filterUpper));
        }

        // Filtrer par niveau
        if (options.level) {
            logs = logs.filter(log => log.level === options.level.toUpperCase());
        }

        // Limiter
        const limit = Math.min(options.limit || 100, 500);
        logs = logs.slice(-limit);

        return logs;
    }

    /**
     * Récupérer les logs depuis X minutes
     * 
     * @param {number} port - Port du serveur
     * @param {number} minutes - Nombre de minutes en arrière
     * @param {Object} options - Options de filtrage
     * @returns {Array} Logs filtrés
     */
    static getLogsSince(port, minutes = 5, options = {}) {
        if (!logsBuffer[port]) {
            return [];
        }

        const since = Date.now() - (minutes * 60 * 1000);
        let logs = logsBuffer[port].filter(log => {
            return new Date(log.timestamp).getTime() >= since;
        });

        // Appliquer autres filtres
        if (options.preset) {
            const presetFilter = LOGS_CONFIG.filterPresets[options.preset.toLowerCase()];
            if (presetFilter) {
                logs = logs.filter(log => 
                    log.line.toUpperCase().includes(presetFilter.toUpperCase())
                );
            }
        }

        if (options.filter && !options.preset) {
            const filterUpper = options.filter.toUpperCase();
            logs = logs.filter(log => log.line.toUpperCase().includes(filterUpper));
        }

        if (options.level) {
            logs = logs.filter(log => log.level === options.level.toUpperCase());
        }

        return logs;
    }

    /**
     * Obtenir les presets de filtrage disponibles
     * 
     * @returns {Array} Liste des presets
     */
    static getFilterPresets() {
        return Object.entries(LOGS_CONFIG.filterPresets).map(([key, value]) => ({
            id: key,
            label: value,
            name: value
        }));
    }

    /**
     * Nombre de logs en mémoire pour un port
     * 
     * @param {number} port - Port du serveur
     * @returns {number} Nombre de logs
     */
    static getBufferSize(port) {
        return logsBuffer[port] ? logsBuffer[port].length : 0;
    }

    /**
     * Vider le buffer pour un port
     * 
     * @param {number} port - Port du serveur
     */
    static clearBuffer(port) {
        if (logsBuffer[port]) {
            logsBuffer[port] = [];
        }
    }

    /**
     * Obtenir stats des logs
     * 
     * @param {number} port - Port du serveur
     * @returns {Object} Stats
     */
    static getStats(port) {
        if (!logsBuffer[port]) {
            return { total: 0, byMod: {}, byLevel: {}, oldestLog: null, newestLog: null };
        }

        const logs = logsBuffer[port];
        const stats = {
            total: logs.length,
            byMod: {},
            byLevel: {},
            oldestLog: logs.length > 0 ? logs[0].timestamp : null,
            newestLog: logs.length > 0 ? logs[logs.length - 1].timestamp : null
        };

        logs.forEach(log => {
            stats.byMod[log.mod] = (stats.byMod[log.mod] || 0) + 1;
            stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
        });

        return stats;
    }
}

module.exports = ArmaLogsService;
