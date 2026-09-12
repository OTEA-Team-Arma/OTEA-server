// ============================================================================
// JWT AUTHENTICATION MODULE INTEGRATION
// ============================================================================

/**
 * Variable globale pour le nom de la team (chargée depuis /api/system/app-config)
 */
let teamName = 'OTEA'; // Valeur par défaut

/**
 * Wrapper pour remplacer Basic Auth par JWT
 * Retourne les headers d'authentification JWT
 */
function getAuthHeaders() {
    try {
        return AUTH_MODULE.getAuthHeader();
    } catch (e) {
        console.error('Not authenticated:', e.message);
        showLoginModal();
        throw e;
    }
}

/**
 * Afficher le formulaire de connexion
 */
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Gérer la connexion
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername')?.value;
    const password = document.getElementById('loginPassword')?.value;
    const errorDiv = document.getElementById('loginError');
    
    if (!username || !password) {
        if (errorDiv) errorDiv.textContent = 'Username and password required';
        return;
    }
    
    const result = await AUTH_MODULE.login(username, password);
    
    if (result.success) {
        AUTH_MODULE.showNotification(`Welcome ${result.data.user.username}!`, 'success');
        document.getElementById('loginModal').style.display = 'none';
        location.reload(); // Recharger pour appliquer le JWT
    } else {
        if (errorDiv) errorDiv.textContent = result.message;
        AUTH_MODULE.showNotification(result.message, 'error');
    }
}

/**
 * Gérer la déconnexion
 */
function handleLogout() {
    AUTH_MODULE.logout();
    AUTH_MODULE.showNotification('Logged out successfully', 'success');
    setTimeout(() => location.reload(), 500);
}

/**
 * Initialiser l'UI au chargement
 */
window.addEventListener('load', async () => {
    // Vérifier l'authentification
    if (!AUTH_MODULE.isAuthenticated()) {
        showLoginModal();
        return;
    }

    // Charger le nom de la team depuis la config
    try {
        const appConfig = await apiRequest('/system/app-config', 'GET');
        if (appConfig?.data?.teamName) {
            teamName = appConfig.data.teamName;

            // Mettre à jour tous les éléments de l'UI
            const titleEl = document.getElementById('app-title');
            if (titleEl) titleEl.textContent = `${teamName} - Admin Panel`;

            const logsEl = document.getElementById('app-team-name-logs');
            if (logsEl) logsEl.textContent = teamName;

            const panelEl = document.getElementById('app-team-name-panel');
            if (panelEl) panelEl.textContent = teamName;
        }
    } catch (error) {
        console.error('[loadTeamName] Error:', error);
        // Garder la valeur par défaut 'OTEA' en cas d'erreur
    }

    // Afficher l'utilisateur connecté
    const user = AUTH_MODULE.getUser();
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay && user) {
        userDisplay.textContent = `${user.username} (${user.role})`;
    }

    // Vérifier si token expiré
    if (AUTH_MODULE.isTokenExpired()) {
        AUTH_MODULE.showNotification('Session expired, please login again', 'error');
        AUTH_MODULE.logout();
        showLoginModal();
    }
});

// ============================================================================
// DASHBOARD - NOUVEAU SYSTÈME
// ============================================================================

let dashboardRefreshInterval = null;

/**
 * Charge le dashboard complet
 */
async function loadDashboard() {
    await refreshDashboardServers();
    await loadDashboardSystemInfo();

    // Démarrer le rafraîchissement automatique toutes les 60 secondes
    if (dashboardRefreshInterval) {
        clearInterval(dashboardRefreshInterval);
    }
    dashboardRefreshInterval = setInterval(() => {
        refreshDashboardServers();
        loadDashboardSystemInfo();
    }, 60000);
}

/**
 * Rafraîchit la liste des serveurs
 */
async function refreshDashboardServers() {
    try {
        // Récupérer la liste des configurations
        const configsResponse = await apiRequest('/configs', 'GET');
        const configs = configsResponse?.data || [];

        // Récupérer le statut des serveurs
        const serversResponse = await apiRequest('/servers', 'GET');
        const servers = serversResponse?.data?.servers || [];

        const tbody = document.getElementById('dashboardServersList');
        if (!tbody) return;

        if (configs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">Aucune configuration disponible</td></tr>';
            return;
        }

        // Mapper les configs avec leur statut
        tbody.innerHTML = configs.map(config => {
            const server = servers.find(s => s.configFile === config.filename);
            const isRunning = !!server;
            const statusColor = isRunning ? '#27ae60' : '#c0392b';
            const statusText = isRunning ? '🟢 EN LIGNE' : '🔴 HORS LIGNE';
            const uptime = isRunning ? (server.uptime || '-') : '-';

            return `
                <tr style="border-bottom:1px solid #333;">
                    <td style="padding:12px;">${config.name || 'Sans nom'}</td>
                    <td style="padding:12px;color:var(--accent);font-weight:bold;">${config.port}</td>
                    <td style="padding:12px;"><span style="color:${statusColor};font-weight:bold;">${statusText}</span></td>
                    <td style="padding:12px;color:#999;">${uptime}</td>
                    <td style="padding:12px;text-align:center;">
                        ${!isRunning ? `<button class="btn btn-start" onclick="startServerDashboard('${config.filename}', ${config.port})" style="font-size:11px;padding:6px 12px;">▶ Lancer</button>` : ''}
                        ${isRunning ? `<button class="btn btn-delete" onclick="stopServerDashboard(${config.port})" style="font-size:11px;padding:6px 12px;">⏹ Arrêter</button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('[refreshDashboardServers] Error:', error);
        const tbody = document.getElementById('dashboardServersList');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#c0392b;">Erreur lors du chargement</td></tr>';
        }
    }
}

/**
 * Lance un serveur depuis le dashboard
 */
async function startServerDashboard(filename, port) {
    try {
        // Vérifier les conflits de port et l'état du serveur
        const serversCheck = await apiRequest('/servers', 'GET');
        const runningServers = serversCheck?.data?.servers || [];
        const portConflict = runningServers.find(s => s.port === port && s.configFile !== filename);
        if (portConflict) {
            showNotification(`Port ${port} déjà utilisé par "${portConflict.configFile.replace('ServerConfig_', '').replace('.json', '')}"`, 'error');
            return;
        }
        const alreadyRunning = runningServers.find(s => s.configFile === filename);
        if (alreadyRunning) {
            showNotification('Ce serveur est déjà en cours d\'exécution', 'error');
            return;
        }

        const response = await apiRequest('/servers/start', 'POST', { filename, port });

        if (response && response.success) {
            showNotification(`Serveur lancé sur le port ${port}`, 'success');
            refreshDashboardServers();
        } else {
            showNotification(response?.message || 'Erreur lors du lancement', 'error');
        }
    } catch (error) {
        console.error('[startServerDashboard] Error:', error);
        showNotification('Erreur lors du lancement du serveur', 'error');
    }
}

/**
 * Arrête un serveur depuis le dashboard
 */
async function stopServerDashboard(port) {
    if (!confirm(`Arrêter le serveur sur le port ${port} ?`)) {
        return;
    }

    try {
        const response = await apiRequest('/servers/stop', 'POST', { port });

        if (response && response.success) {
            showNotification(`Serveur arrêté (port ${port})`, 'success');
            refreshDashboardServers();
        } else {
            showNotification(response?.message || 'Erreur lors de l\'arrêt', 'error');
        }
    } catch (error) {
        console.error('[stopServerDashboard] Error:', error);
        showNotification('Erreur lors de l\'arrêt du serveur', 'error');
    }
}

/**
 * Charge les informations système
 */
async function loadDashboardSystemInfo() {
    try {
        // Version Arma - essayer d'abord system-info, puis updates/check
        const armaVersionEl = document.getElementById('dashboardArmaVersion');
        if (armaVersionEl) {
            try {
                const systemInfoResponse = await apiRequest('/admin/system-info', 'GET');
                console.log('[Dashboard] GET /api/admin/system-info:', systemInfoResponse);

                if (systemInfoResponse?.data?.armaVersion) {
                    armaVersionEl.textContent = systemInfoResponse.data.armaVersion;
                } else {
                    // Fallback sur updates/check
                    const updateResponse = await apiRequest('/updates/check', 'GET');
                    console.log('[Dashboard] GET /api/updates/check:', updateResponse);

                    const version = updateResponse?.installed || updateResponse?.data?.installed || '-';
                    armaVersionEl.textContent = version;
                }
            } catch (err) {
                console.error('[Dashboard] Error fetching Arma version:', err);
                armaVersionEl.textContent = '-';
            }
        }

        // Uptime serveur
        const infoResponse = await apiRequest('/info', 'GET');
        console.log('[Dashboard] GET /api/info:', infoResponse);
        const uptimeEl = document.getElementById('dashboardOteaUptime');
        if (uptimeEl && infoResponse?.data?.uptime) {
            const uptimeSeconds = Math.floor(infoResponse.data.uptime);
            const hours = Math.floor(uptimeSeconds / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            uptimeEl.textContent = `${hours}h ${minutes}m`;
        }

        // Derniers logs Arma
        const logsEl = document.getElementById('dashboardRecentLogs');
        if (logsEl) {
            try {
                // Récupérer le premier serveur en ligne
                const serversRes = await apiRequest('/servers', 'GET');
                console.log('[Dashboard] GET /api/servers:', serversRes);
                const servers = serversRes?.data?.servers || [];

                if (servers.length > 0) {
                    const runningServer = servers.find(s => s.running);

                    if (runningServer) {
                        const port = runningServer.port;

                        // Essayer l'endpoint logs
                        const logsResponse = await apiRequest('/logs/arma?limit=5', 'GET');
                        console.log('[Dashboard] GET /api/logs/arma?limit=5:', logsResponse);

                        if (logsResponse?.data && Array.isArray(logsResponse.data)) {
                            const logs = logsResponse.data.slice(-5); // 5 dernières lignes
                            if (logs.length > 0) {
                                logsEl.innerHTML = logs.map(log => {
                                    const time = log.date ? new Date(log.date).toLocaleTimeString('fr-FR') : '';
                                    const message = log.message || log.action || log.line || '';
                                    return `<span style="color:#888;">[${time}]</span> ${message}`;
                                }).join('<br>');
                            } else {
                                logsEl.innerHTML = '<span style="color:#888;">Aucun log récent</span>';
                            }
                        } else {
                            logsEl.innerHTML = '<span style="color:#888;">Logs non disponibles</span>';
                        }
                    } else {
                        logsEl.innerHTML = '<span style="color:#888;">Aucun serveur actif</span>';
                    }
                } else {
                    logsEl.innerHTML = '<span style="color:#888;">Aucun serveur actif</span>';
                }
            } catch (err) {
                console.error('[Dashboard] Error fetching logs:', err);
                logsEl.innerHTML = '<span style="color:#888;">Erreur chargement logs</span>';
            }
        }

    } catch (error) {
        console.error('[loadDashboardSystemInfo] Error:', error);
    }
}

// --- NAVIGATION ---
window.openTab = function (id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    // Activation du bouton correspondant
    const navButtons = document.querySelectorAll('nav button');
    navButtons.forEach(btn => {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`openTab('${id}')`)) {
            btn.classList.add('active');
        }
    });
    if(id === 'dashboard') {loadDashboard();}
    if(id === 'configuration') {loadConfigsList();}
    if(id === 'adminlog') {loadAdminLog();}
    if(id === 'armaServer') {loadArmaServerInfo();}
    if(id === 'logs') {loadServersStatus();}
    if(id === 'reference') {loadMissionsRefList(); loadModsRefList();}
    if(id === 'administration') {loadSystemPaths();}
};

// --- FONCTIONS UTILITAIRES ---
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        };
        if (data) {options.body = JSON.stringify(data);}
        const response = await fetch(`/api${endpoint}`, options);
        return await response.json();
    } catch (e) {
        appendLog('Erreur connexion Backend : ' + e.message);
    }
}

function appendLog(message) {
    const logContainer = document.getElementById('logConsole');
    const isScrolledToBottom = logContainer.scrollHeight - logContainer.clientHeight <= logContainer.scrollTop + 1;
    const time = new Date().toLocaleTimeString();
    let color = '#00ff00';
    if (message.includes('BAN') || message.includes('KICK')) {color = '#ff4444';}
    if (message.includes('Error')) {color = '#ffaa00';}
    logContainer.innerHTML += `<div><span style="color: #555;">[${time}]</span> <span style="color:${color}">${message}</span></div>`;
    if (isScrolledToBottom) {
        logContainer.scrollTop = logContainer.scrollHeight;
    }
}

// --- SYSTÈME DE NOTIFICATIONS ---
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');

    let bgColor, borderColor;
    switch(type) {
    case 'success': bgColor = '#27ae60'; borderColor = '#229954'; break;
    case 'error': bgColor = '#c0392b'; borderColor = '#a93226'; break;
    case 'warning': bgColor = '#f39c12'; borderColor = '#d68910'; break;
    default: bgColor = '#3498db'; borderColor = '#2980b9';
    }

    notification.style.cssText = `
        background: ${bgColor};
        border-left: 4px solid ${borderColor};
        color: white;
        padding: 15px;
        margin-bottom: 10px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
        font-weight: bold;
    `;

    notification.textContent = message;
    container.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('defaultTab').click();
});

// --- ADMIN LOG ---
async function checkAdminLogTab() {
    try {
        const res = await fetch('/admin');
        if (res.ok) {
            document.getElementById('adminLogTab').style.display = '';
        }
    } catch {}
}

// --- GESTION DES LOGS (Admin OTEA vs Serveur Arma) ---
let currentLogTab = 'admin';
let currentArmaLogFilter = null;
let currentArmaLogPreset = null;

window.switchLogTab = function switchLogTab(tab) {
    currentLogTab = tab;
    document.getElementById('logTabAdmin').style.background = tab === 'admin' ? 'var(--accent)' : '#555';
    document.getElementById('logTabAdmin').style.color = tab === 'admin' ? 'black' : 'white';
    document.getElementById('logTabArma').style.background = tab === 'arma' ? 'var(--accent)' : '#555';
    document.getElementById('logTabArma').style.color = tab === 'arma' ? 'black' : 'white';
    document.getElementById('logRefreshBtn').textContent = tab === 'admin' ? 'Rafraîchir Admin Log' : 'Rafraîchir Logs Arma';
    
    // Afficher/cacher les filtres Arma
    document.getElementById('armaLogFilters').style.display = tab === 'arma' ? 'block' : 'none';

    if (tab === 'admin') {
        loadAdminLog();
    } else {
        loadArmaServerLog();
    }
};

window.loadArmaServerLog = async function loadArmaServerLog() {
    const logConsole = document.getElementById('logConsole');
    logConsole.innerHTML = '⏳ Chargement des logs du serveur Arma...\n';
    try {
        // Récupérer le premier serveur en ligne
        const serversRes = await apiRequest('/servers');
        const servers = serversRes.data?.servers || [];
        if (!servers || servers.length === 0) {
            logConsole.innerHTML = '❌ Aucun serveur Arma en cours d\'exécution';
            return;
        }
        
        const port = servers[0].port;
        
        // Charger les logs du serveur
        let url = `/servers/${port}/logs/stream?since=5`;
        const res = await apiRequest(url);
        
        if (res && res.data && Array.isArray(res.data.logs)) {
            displayArmaLogs(res.data.logs);
        } else {
            logConsole.innerHTML = '❌ Erreur: Impossible de charger les logs du serveur Arma';
        }
    } catch (err) {
        logConsole.innerHTML = `❌ Erreur réseau: ${err.message}`;
    }
};

function displayArmaLogs(logs) {
    const logConsole = document.getElementById('logConsole');
    if (!logs || logs.length === 0) {
        logConsole.innerHTML = '📭 Aucun log à afficher';
        return;
    }
    
    const lines = logs.map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString('fr-FR');
        const text = log.line || '';
        const level = log.level || 'INFO';
        
        // Colorer selon le niveau
        let color = '#00ff00'; // INFO = vert
        if (level === 'ERROR') color = '#ff3333';
        else if (level === 'WARN') color = '#ffff00';
        else if (level === 'DEBUG') color = '#888888';
        
        return `<span style="color:#888;">[${time}]</span> <span style="color:${color};">${text}</span>`;
    }).join('\n');
    
    logConsole.innerHTML = lines;
    logConsole.scrollTop = logConsole.scrollHeight;
}

window.filterArmaLogs = async function filterArmaLogs(preset) {
    const logConsole = document.getElementById('logConsole');
    logConsole.innerHTML = '⏳ Filtrage des logs...\n';
    try {
        // Récupérer le premier serveur en ligne
        const serversRes = await apiRequest('/servers');
        const servers = serversRes.data?.servers || [];
        if (!servers || servers.length === 0) {
            logConsole.innerHTML = '❌ Aucun serveur Arma en cours d\'exécution';
            return;
        }
        
        const port = servers[0].port;
        
        // Construire l'URL avec le preset
        let url = `/servers/${port}/logs/stream?since=10`;
        if (preset) {
            url += `&preset=${preset}`;
            currentArmaLogPreset = preset;
            currentArmaLogFilter = null;
        } else {
            currentArmaLogPreset = null;
            currentArmaLogFilter = null;
        }
        
        const res = await apiRequest(url);
        
        if (res && res.data && Array.isArray(res.data.logs)) {
            displayArmaLogs(res.data.logs);
        } else {
            logConsole.innerHTML = '❌ Erreur lors du filtrage des logs';
        }
    } catch (err) {
        logConsole.innerHTML = `❌ Erreur réseau: ${err.message}`;
    }
};

window.searchArmaLogs = async function searchArmaLogs() {
    const searchInput = document.getElementById('armaLogFilter');
    const filterText = searchInput.value.trim();

    if (!filterText) {
        alert('Veuillez entrer un texte de recherche');
        return;
    }

    const logConsole = document.getElementById('logConsole');
    logConsole.innerHTML = '⏳ Recherche des logs...\n';
    try {
        // Récupérer le premier serveur en ligne
        const serversRes = await apiRequest('/servers');
        const servers = serversRes.data?.servers || [];
        if (!servers || servers.length === 0) {
            logConsole.innerHTML = '❌ Aucun serveur Arma en cours d\'exécution';
            return;
        }
        
        const port = servers[0].port;
        
        // Construire l'URL avec le filtre de recherche
        const url = `/servers/${port}/logs/stream?filter=${encodeURIComponent(filterText)}&since=30`;
        
        const res = await apiRequest(url);
        
        if (res && res.data && Array.isArray(res.data.logs)) {
            currentArmaLogFilter = filterText;
            currentArmaLogPreset = null;
            displayArmaLogs(res.data.logs);
            if (res.data.logs.length === 0) {
                document.getElementById('logConsole').innerHTML = `📭 Aucun log trouvé contenant: <strong>${filterText}</strong>`;
            }
        } else {
            logConsole.innerHTML = '❌ Erreur lors de la recherche';
        }
    } catch (err) {
        logConsole.innerHTML = `❌ Erreur réseau: ${err.message}`;
    }
};

window.loadAdminLog = async function loadAdminLog() {
    const logConsole = document.getElementById('logConsole');
    logConsole.innerHTML = 'Chargement...';
    try {
        const res = await fetch('/api/logs', {
            headers: getAuthHeaders()
        });
        const data = await res.json();
        const logs = data.data && Array.isArray(data.data) ? data.data : [];
        if (!Array.isArray(logs) || logs.length === 0) {
            logConsole.innerHTML = 'Aucune activité enregistrée.';
            return;
        }
        
        // Format pour affichage en console (pas en tableau)
        const lines = logs.reverse().map(log => {
            const time = log.date ? log.date.replace('T', ' ').substring(0, 19) : '';
            return `[${time}] ${log.user} : ${log.action}`;
        }).join('\n');
        
        logConsole.innerHTML = lines;
        logConsole.scrollTop = logConsole.scrollHeight;
    } catch (err) {
        logConsole.innerHTML = `Erreur: ${err.message}`;
    }
};

// --- CHANGEMENT DE MOT DE PASSE ---
async function checkDefaultPassword() {
    try {
        const res = await fetch('/api/admin/health', {
            headers: getAuthHeaders()
        });
        if (res.ok) {
            document.getElementById('defaultPwdWarning').style.display = '';
        }
    } catch {}
}
checkDefaultPassword();

async function changePassword(event) {
    event.preventDefault();
    const oldPassword = document.getElementById('old_pwd').value;
    const newPassword = document.getElementById('new_pwd').value;
    const msgDiv = document.getElementById('changePwdMsg');
    msgDiv.textContent = '';
    try {
        const res = await fetch('/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPassword, newPassword })
        });
        if (res.ok) {
            msgDiv.style.color = 'var(--success)';
            msgDiv.textContent = 'Mot de passe modifié !';
            document.getElementById('changePwdForm').reset();
        } else {
            const txt = await res.text();
            msgDiv.style.color = 'var(--danger)';
            msgDiv.textContent = 'Erreur : ' + txt;
        }
    } catch (e) {
        msgDiv.style.color = 'var(--danger)';
        msgDiv.textContent = 'Erreur réseau.';
    }
    return false;
}

// --- AJOUT UTILISATEUR ---
async function addUser(event) {
    event.preventDefault();
    const username = document.getElementById('new_username').value;
    const password = document.getElementById('new_password').value;
    const role = document.getElementById('new_role').value;
    const msgDiv = document.getElementById('addUserMsg');
    msgDiv.textContent = '';
    try {
        const res = await fetch('/add-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });
        if (res.ok) {
            msgDiv.style.color = 'var(--success)';
            msgDiv.textContent = 'Utilisateur ajouté !';
            document.getElementById('addUserForm').reset();
        } else {
            const txt = await res.text();
            msgDiv.style.color = 'var(--danger)';
            msgDiv.textContent = 'Erreur : ' + txt;
        }
    } catch (e) {
        msgDiv.style.color = 'var(--danger)';
        msgDiv.textContent = 'Erreur réseau.';
    }
    return false;
}

// --- GESTION ARMA REFORGER SERVER ---
async function loadArmaServerInfo() {
    // Récupère version installée, version dispo, log
    const info = await apiRequest('/admin/arma-version');
    if (!info || !info.data) {return;}
    document.getElementById('armaInstalledVersion').textContent = info.data.installedVersion || 'Inconnue';
    // Indicateur nouvelle version
    if (info.data.updateAvailable) {
        document.getElementById('armaUpdateIndicator').style.display = '';
        document.getElementById('armaUpdateIndicator').textContent = `Nouvelle version disponible : ${info.data.latestVersion}`;
    } else {
        document.getElementById('armaUpdateIndicator').style.display = 'none';
    }
    // Log des mises à jour  
    document.getElementById('armaUpdateLog').innerHTML = '<span style="color:#888;">Log actualisé</span>';
}

async function updateArmaServer() {
    document.getElementById('armaUpdateBtn').disabled = true;
    document.getElementById('armaUpdateMsg').textContent = 'Mise à jour en cours...';
    try {
        const res = await apiRequest('/updates/trigger', 'POST', {});
        document.getElementById('armaUpdateMsg').textContent = res && res.message ? res.message : 'Mise à jour lancée';
        showNotification('✓ Mise à jour du serveur Arma Reforger terminée !', 'success');
    } catch (e) {
        document.getElementById('armaUpdateMsg').textContent = 'Erreur : ' + e.message;
        showNotification('✗ Erreur lors de la mise à jour', 'error');
    }
    document.getElementById('armaUpdateBtn').disabled = false;
    loadArmaServerInfo();
}

async function restartOTEA() {
    if (!confirm(`Êtes-vous sûr ? ${teamName} va redémarrer et sera temporairement indisponible.`)) {
        return;
    }
    document.getElementById('otearestartBtn').disabled = true;
    document.getElementById('otearestartMsg').textContent = 'Redémarrage en cours...';
    try {
        const res = await apiRequest('/admin/restart-all', 'POST');
        document.getElementById('otearestartMsg').textContent = 'Redémarrage initié. La page va se rafraîchir...';
        showNotification(`⟳ Redémarrage de ${teamName} en cours...`, 'warning');
        setTimeout(() => {
            location.reload();
        }, 2000);
    } catch (e) {
        document.getElementById('otearestartMsg').textContent = 'Erreur lors du redémarrage.';
        showNotification('✗ Erreur lors du redémarrage', 'error');
        document.getElementById('otearestartBtn').disabled = false;
    }
}

// --- MONITORING SERVEURS ---
async function loadServersStatus() {
    const tbody = document.getElementById('serversStatusTable');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#888;">Chargement...</td></tr>';
    try {
        const res = await apiRequest('/servers');
        const serversList = res.data && res.data.servers ? res.data.servers : [];
        if (!serversList || serversList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#888;">Aucun serveur en cours d\'exécution</td></tr>';
            return;
        }
        tbody.innerHTML = serversList.map(server => {
            const statusColor = server.running ? '#27ae60' : '#c0392b';
            const statusText = server.running ? '🟢 EN LIGNE' : '🔴 OFFLINE';
            return `
                <tr style="border-bottom:1px solid #333;">
                    <td style="padding:12px;color:var(--accent);">${server.port}</td>
                    <td style="padding:12px;"><span style="color:${statusColor};font-weight:bold;">${statusText}</span></td>
                    <td style="padding:12px;">${server.uptime || '-'}</td>
                    <td style="padding:12px;font-size:12px;color:#999;">${server.lastAction || '-'}</td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#c0392b;">Erreur lors du chargement du statut</td></tr>';
    }
}

// ============================================================================
// PLAYER MANAGEMENT FUNCTIONS
// ============================================================================

// Charger les joueurs connectés
async function loadPlayersConnected() {
    const port = document.getElementById('playerServerPort')?.value;
    if (!port) {
        showNotification('⚠️ Veuillez sélectionner un serveur', 'warning');
        return;
    }

    const tbody = document.getElementById('onlinePlayersList');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">Chargement...</td></tr>';

    try {
        const res = await apiRequest('/api/players/list?port=' + port);
        if (!res || !Array.isArray(res)) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">Aucun joueur trouvé</td></tr>';
            return;
        }

        if (res.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">Aucun joueur connecté</td></tr>';
            return;
        }

        tbody.innerHTML = res.map(player => `
            <tr style="border-bottom:1px solid #333;">
                <td style="padding:12px;">${player.id}</td>
                <td style="padding:12px;">${player.name}</td>
                <td style="padding:12px;color:var(--accent);">${port}</td>
                <td style="padding:12px;font-size:11px;color:#999;">${player.ip || '-'}</td>
                <td style="padding:12px;text-align:center;">
                    <button class="btn btn-edit" onclick="kickPlayer(${player.id}, '${player.name}', ${port})" style="font-size:10px;padding:4px 6px;">Kick</button>
                    <button class="btn btn-delete" onclick="banPlayer(${player.id}, '${player.name}', ${port})" style="font-size:10px;padding:4px 6px;">Ban</button>
                </td>
            </tr>
        `).join('');

        appendLog(`✓ ${res.length} joueur(s) connecté(s) sur le port ${port}`);
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#c0392b;">Erreur lors du chargement</td></tr>';
        appendLog('Erreur lors du chargement des joueurs');
    }
}

// Expulser un joueur
async function kickPlayer(playerId, playerName, port) {
    if (!confirm(`Êtes-vous sûr de vouloir expulser ${playerName} ?`)) {
        return;
    }

    try {
        const res = await apiRequest('/api/players/kick', 'POST', {
            playerId: playerId,
            playerName: playerName,
            port: port,
            reason: 'Kicked by admin'
        });

        showNotification(`✓ ${playerName} a été expulsé`, 'success');
        appendLog(`🤐 KICK: ${playerName} expulsé du port ${port}`);
        loadPlayersConnected();
    } catch (e) {
        showNotification('✗ Erreur lors du kick', 'error');
        appendLog('Erreur lors du kick de ' + playerName);
    }
}

// Bannir un joueur
async function banPlayer(playerId, playerName, port) {
    const reason = prompt(`Raison du ban pour ${playerName} :`, 'Behavior');
    if (!reason) {return;}

    try {
        const res = await apiRequest('/api/players/ban', 'POST', {
            playerName: playerName,
            port: port,
            reason: reason,
            duration: 30,
            type: 'temporary'
        });

        showNotification(`✓ ${playerName} a été banni`, 'success');
        appendLog(`⛔ BAN: ${playerName} banni (${reason})`);
        loadPlayersConnected();
    } catch (e) {
        showNotification('✗ Erreur lors du ban', 'error');
        appendLog('Erreur lors du ban de ' + playerName);
    }
}

// Charger la liste des joueurs bannés
async function loadBannedList() {
    const tbody = document.getElementById('bannedPlayersList');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">Chargement...</td></tr>';

    try {
        const res = await apiRequest('/api/players/banned');
        if (!res || !Array.isArray(res)) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">Aucun joueur banni</td></tr>';
            return;
        }

        if (res.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">Aucun joueur banni</td></tr>';
            return;
        }

        tbody.innerHTML = res.map(ban => {
            const banDate = new Date(ban.bannedAt).toLocaleDateString('fr-FR');
            const duration = ban.type === 'permanent' ? '∞' : ban.duration + 'j';
            return `
                <tr style="border-bottom:1px solid #333;">
                    <td style="padding:12px;">${ban.playerName}</td>
                    <td style="padding:12px;font-size:11px;">${banDate}</td>
                    <td style="padding:12px;font-size:11px;">${ban.reason}</td>
                    <td style="padding:12px;text-align:center;color:var(--accent);font-weight:bold;">${duration}</td>
                    <td style="padding:12px;text-align:center;">
                        <button class="btn btn-start" onclick="unbanPlayer(${ban.id}, '${ban.playerName}')" style="font-size:10px;padding:4px 6px;">Débanner</button>
                    </td>
                </tr>
            `;
        }).join('');

        appendLog(`✓ ${res.length} joueur(s) banni(s) chargé(s)`);
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#c0392b;">Erreur lors du chargement</td></tr>';
        appendLog('Erreur lors du chargement des bans');
    }
}

// Débanner un joueur
async function unbanPlayer(banId, playerName) {
    if (!confirm(`Êtes-vous sûr de vouloir débanner ${playerName} ?`)) {
        return;
    }

    try {
        const res = await apiRequest('/api/players/unban', 'POST', {
            banId: banId,
            playerName: playerName
        });

        showNotification(`✓ ${playerName} a été débanni`, 'success');
        appendLog(`✓ UNBAN: ${playerName} débanni`);
        loadBannedList();
    } catch (e) {
        showNotification('✗ Erreur lors du déban', 'error');
        appendLog('Erreur lors du déban de ' + playerName);
    }
}

// Bannir manuellement un joueur
async function manualBanPlayer() {
    const playerName = document.getElementById('manualBanPlayerName').value.trim();
    const reason = document.getElementById('manualBanReason').value.trim();
    const duration = parseInt(document.getElementById('manualBanDuration').value) || 30;
    const type = document.getElementById('manualBanType').value;

    if (!playerName) {
        showNotification('⚠️ Entrez le pseudo du joueur', 'warning');
        return;
    }

    try {
        const res = await apiRequest('/api/players/ban', 'POST', {
            playerName: playerName,
            reason: reason || 'Raison non spécifiée',
            duration: duration,
            type: type
        });

        showNotification(`✓ ${playerName} a été banni (${type})`, 'success');
        appendLog(`⛔ BAN MANUEL: ${playerName} banni (${type} - ${duration}j)`);

        // Réinitialiser le formulaire
        document.getElementById('manualBanPlayerName').value = '';
        document.getElementById('manualBanReason').value = '';
        document.getElementById('manualBanDuration').value = '30';
        document.getElementById('manualBanType').value = 'temporary';
        document.getElementById('manualBanMsg').textContent = '✓ Joueur banni avec succès';

        // Recharger la liste des bans
        setTimeout(loadBannedList, 500);
    } catch (e) {
        showNotification('✗ Erreur lors du ban', 'error');
        document.getElementById('manualBanMsg').textContent = '✗ Erreur: ' + (e.message || 'Erreur');
        appendLog('Erreur lors du ban de ' + playerName);
    }
}

// Charger les serveurs disponibles pour le sélecteur
async function loadServerPortsForPlayers() {
    try {
        const presets = await apiRequest('/presets');
        if (!presets || !Array.isArray(presets)) {return;}

        const select = document.getElementById('playerServerPort');
        presets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.port;
            option.textContent = `${preset.title} (Port ${preset.port})`;
            select.appendChild(option);
        });
    } catch (e) {
        console.error('Erreur lors du chargement des ports', e);
    }
}

// Initialiser au chargement de la page
window.addEventListener('DOMContentLoaded', function () {
    loadServerPortsForPlayers();
    checkArmaUpdates();
    // Check for updates every hour
    setInterval(checkArmaUpdates, 3600000);
});

// ============================================================================
// NEW: Arma Version Update Detection
// ============================================================================

/**
 * Check for Arma Reforger updates
 */
async function checkArmaUpdates() {
    try {
        const response = await fetch('/api/updates/check', {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            throw new Error('Failed to check updates');
        }

        const data = await response.json();

        const updateBadge = document.getElementById('updateBadge');
        if (!updateBadge) {
            console.warn('[updateBadge] Element not found in DOM');
            return;
        }

        if (data.updateAvailable) {
            updateBadge.style.display = 'block';
            updateBadge.innerHTML = `
                <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 12px 15px; margin: 10px 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #333; font-weight: bold;">
                        🔔 Mise à jour disponible: ${data.available} (installée: ${data.installed})
                    </span>
                    <button class="btn" style="background: #ffc107; color: #333; padding: 8px 15px; cursor: pointer; border: none; border-radius: 3px; font-weight: bold;" onclick="triggerArmaUpdate()">
                        Mettre à jour maintenant
                    </button>
                </div>
            `;
        } else {
            updateBadge.style.display = 'none';
        }
    } catch (err) {
        console.error('[checkArmaUpdates] Failed:', err);
    }
}

/**
 * Trigger Arma server update
 */
window.triggerArmaUpdate = function triggerArmaUpdate() {
    if (confirm('Êtes-vous sûr? Cela va télécharger la mise à jour via SteamCMD.')) {
        // Call the existing update endpoint
        apiRequest('/api/update-server', {
            method: 'POST'
        }).then(() => {
            alert('Mise à jour lancée! Consultez les logs pour plus de détails.');
            // Refresh check in 30 seconds
            setTimeout(checkArmaUpdates, 30000);
        }).catch((err) => {
            alert(`Erreur lors du lancement de la mise à jour: ${err.message}`);
        });
    }
};// ============================================================================
// GESTION DES CONFIGURATIONS SERVEUR (Architecture Config Directe)
// ============================================================================

// État global de l'éditeur de config
let currentConfigEditing = null;
let configFormMode = 'create'; // 'create' ou 'edit'

// Liste des missions vanilla Arma Reforger
const VANILLA_MISSIONS = [
    { name: 'GM Eden', scenarioId: '{59AD59368755F41A}Missions/21_GM_Eden.conf' },
    { name: 'GM Arland', scenarioId: '{2BBBE828037C6F4B}Missions/22_GM_Arland.conf' },
    { name: 'GM Cain', scenarioId: '{F45C6C15D31252E6}Missions/27_GM_Cain.conf' },
    { name: 'CombatOps', scenarioId: '{DAA03C6E6099D50F}Missions/24_CombatOps.conf' },
    { name: 'CombatOps Everon', scenarioId: '{DFAC5FABD11F2390}Missions/26_CombatOpsEveron.conf' },
    { name: 'Conflict East', scenarioId: '{8C8EDD6FAE093FFF}Missions/Conflict_East.conf' },
    { name: 'Conflict West', scenarioId: '{23FD7E11B1EEED40}Missions/Conflict_West.conf' },
    { name: 'Campaign Arland', scenarioId: '{C41618FD18E9D714}Missions/23_Campaign_Arland.conf' },
    { name: 'Campaign Cain', scenarioId: '{9C6054B42A044DEC}Missions/23_Campaign_Cain.conf' },
    { name: 'Campaign Everon', scenarioId: '{0220741028718E7F}Missions/23_Campaign_HQC_Everon.conf' }
];

// Liste des mods de référence
const REFERENCE_MODS = [
    { name: 'GameMasterEnhanced', modId: '5964E0B3BB7410CE' },
    { name: 'GameMasterFX', modId: '5994AD5A9F33BE57' },
    { name: 'RHS ContentPack01', modId: '1337C0DE5DABBEEF' },
    { name: 'RHS ContentPack02', modId: 'BADC0DEDABBEDA5E' },
    { name: 'RHS StatusQuo', modId: '595F2BF2F44836FB' },
    { name: 'Zimnitrita', modId: '597697D81A1EA202' },
    { name: 'ZimnitritaArmedForces', modId: '61073D5134A9ACC2' },
    { name: 'ACE Core', modId: '60C4CE4888FF4621' },
    { name: 'MapGeneratorPro', modId: '6A3B0A83308240C2' }
];

/**
 * Charge et affiche la liste des configurations
 */
async function loadConfigsList() {
    try {
        const response = await apiRequest('/configs', 'GET');
        console.log('[loadConfigsList] API Response:', response);
        console.log('[loadConfigsList] Réponse complète GET /api/configs:', JSON.stringify(response, null, 2));

        if (!response || !response.data) {
            console.error('[loadConfigsList] Invalid response:', response);
            showNotification('Erreur lors du chargement des configs', 'error');
            return;
        }

        const configs = response.data;
        console.log('[loadConfigsList] Configs loaded:', configs.length);

        // Récupérer le statut des serveurs
        const serversResponse = await apiRequest('/servers', 'GET');
        const servers = serversResponse?.data?.servers || [];

        const listContainer = document.getElementById('configsList');

        if (!listContainer) return;

        if (configs.length === 0) {
            listContainer.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;padding:20px;color:#888;">
                        Aucune configuration disponible. Créez-en une !
                    </td>
                </tr>
            `;
            return;
        }

        listContainer.innerHTML = configs.map(config => {
            const server = servers.find(s => s.configFile === config.filename);
            const isRunning = !!server;

            return `
            <tr>
                <td style="padding:12px;">${config.name || 'Sans nom'}</td>
                <td style="padding:12px;">${config.port || '-'}</td>
                <td style="padding:12px;">${config.scenarioId ? config.scenarioId.split('/').pop() : '-'}</td>
                <td style="padding:12px;">${config.maxPlayers || 0}</td>
                <td style="padding:12px;">${config.mods === 0 ? '-' : config.mods}</td>
                <td style="padding:12px;">
                    ${isRunning
                        ? `<button class="btn btn-delete" onclick="stopServerDashboard(${config.port})" style="min-width:80px;">⏹ Arrêter</button>`
                        : `<button class="btn btn-start" onclick="startServerFromConfig('${config.filename}', ${config.port})" style="min-width:80px;">▶ Lancer</button>`
                    }
                    <button class="btn btn-edit" onclick="editConfig('${config.filename}')">Modifier</button>
                    <button class="btn btn-delete" onclick="deleteConfig('${config.filename}')">Supprimer</button>
                </td>
            </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('loadConfigsList error:', error);
        showNotification('Erreur lors du chargement des configs', 'error');
    }
}

/**
 * Affiche le formulaire de création de config
 */
function showCreateConfigForm() {
    configFormMode = 'create';
    currentConfigEditing = null;

    // Réinitialiser le formulaire
    document.getElementById('config_name').value = '';
    document.getElementById('config_port').value = '2001';
    document.getElementById('config_serverName').value = '';
    document.getElementById('config_password').value = '';
    document.getElementById('config_scenarioId').value = '';
    document.getElementById('config_maxPlayers').value = '16';
    document.getElementById('config_visible').checked = true;
    document.getElementById('config_crossPlatform').checked = false;

    // Réinitialiser gameProperties
    document.getElementById('config_gp_viewDistance').value = '1600';
    document.getElementById('config_gp_grassDistance').value = '0';
    document.getElementById('config_gp_networkDistance').value = '500';
    document.getElementById('config_gp_disableThirdPerson').checked = false;
    document.getElementById('config_gp_fastValidation').checked = true;
    document.getElementById('config_gp_battlEye').checked = true;

    // Réinitialiser rcon
    document.getElementById('config_rcon_port').value = '19999';
    document.getElementById('config_rcon_password').value = '';
    document.getElementById('config_rcon_maxClients').value = '16';

    // Réinitialiser launchParams
    document.getElementById('config_launch_maxFPS').value = '60';
    document.getElementById('config_launch_logStats').value = '10';

    // Vider la liste des mods
    document.getElementById('configModsList').innerHTML = '';

    // Afficher le formulaire
    document.getElementById('configFormContainer').style.display = 'block';
    document.getElementById('configFormTitle').textContent = 'Créer une nouvelle configuration';
    document.getElementById('configSaveBtn').textContent = 'Créer la configuration';
}

/**
 * Charge une config pour édition
 */
async function editConfig(filename) {
    try {
        const response = await apiRequest(`/configs/${filename}`, 'GET');

        if (!response || !response.data) {
            showNotification('Erreur lors du chargement de la config', 'error');
            return;
        }

        const config = response.data;
        configFormMode = 'edit';
        currentConfigEditing = filename;

        // Remplir le formulaire
        document.getElementById('config_name').value = config.game?.name || '';
        document.getElementById('config_port').value = config.bindPort || 2001;
        document.getElementById('config_serverName').value = config.game?.name || '';
        document.getElementById('config_password').value = config.game?.password || '';
        document.getElementById('config_scenarioId').value = config.game?.scenarioId || '';
        document.getElementById('config_maxPlayers').value = config.game?.maxPlayers || 16;
        document.getElementById('config_visible').checked = config.game?.visible !== false;
        document.getElementById('config_crossPlatform').checked = config.game?.crossPlatform === true;

        // Remplir gameProperties
        document.getElementById('config_gp_viewDistance').value = config.gameProperties?.serverMaxViewDistance || 1600;
        document.getElementById('config_gp_grassDistance').value = config.gameProperties?.serverMinGrassDistance || 0;
        document.getElementById('config_gp_networkDistance').value = config.gameProperties?.networkViewDistance || 500;
        document.getElementById('config_gp_disableThirdPerson').checked = config.gameProperties?.disableThirdPerson === true;
        document.getElementById('config_gp_fastValidation').checked = config.gameProperties?.fastValidation !== false;
        document.getElementById('config_gp_battlEye').checked = config.gameProperties?.battlEye !== false;

        // Remplir rcon
        document.getElementById('config_rcon_port').value = config.rcon?.port || 19999;
        document.getElementById('config_rcon_password').value = config.rcon?.password || '';
        document.getElementById('config_rcon_maxClients').value = config.rcon?.maxClients || 16;

        // Remplir launchParams
        document.getElementById('config_launch_maxFPS').value = config.launchParams?.maxFPS || 60;
        document.getElementById('config_launch_logStats').value = config.launchParams?.logStats || 10;

        // Remplir la liste des mods
        fillConfigModsList(config.game?.mods || []);

        // Afficher le formulaire
        document.getElementById('configFormContainer').style.display = 'block';
        document.getElementById('configFormTitle').textContent = `Modifier: ${config.game?.name || filename}`;
        document.getElementById('configSaveBtn').textContent = 'Enregistrer les modifications';

    } catch (error) {
        console.error('editConfig error:', error);
        showNotification('Erreur lors du chargement de la config', 'error');
    }
}

/**
 * Sauvegarde une configuration (create ou update)
 */
async function saveConfig() {
    try {
        // Récupérer les données du formulaire
        const scenarioId = document.getElementById('config_scenarioId').value.trim();

        const configData = {
            name: document.getElementById('config_name').value.trim(),
            port: parseInt(document.getElementById('config_port').value),
            scenarioId: scenarioId,
            maxPlayers: parseInt(document.getElementById('config_maxPlayers').value),
            password: document.getElementById('config_password').value,
            admins: [], // TODO: ajouter gestion des admins
            mods: getConfigModsFromForm(),
            gameProperties: {
                serverMaxViewDistance: parseInt(document.getElementById('config_gp_viewDistance').value),
                serverMinGrassDistance: parseInt(document.getElementById('config_gp_grassDistance').value),
                networkViewDistance: parseInt(document.getElementById('config_gp_networkDistance').value),
                disableThirdPerson: document.getElementById('config_gp_disableThirdPerson').checked,
                fastValidation: document.getElementById('config_gp_fastValidation').checked,
                battlEye: document.getElementById('config_gp_battlEye').checked
            },
            rcon: {
                address: '0.0.0.0',
                port: parseInt(document.getElementById('config_rcon_port').value),
                password: document.getElementById('config_rcon_password').value,
                maxClients: parseInt(document.getElementById('config_rcon_maxClients').value)
            },
            launchParams: {
                maxFPS: parseInt(document.getElementById('config_launch_maxFPS').value) || 60,
                logStats: parseInt(document.getElementById('config_launch_logStats').value) || 10
            }
        };

        // Logger la valeur de scenarioId avant l'envoi
        console.log('[saveConfig] scenarioId à envoyer:', scenarioId);

        // Validation
        if (!configData.name) {
            showNotification('Le nom du serveur est requis', 'error');
            return;
        }

        if (!configData.port || configData.port < 1024) {
            showNotification('Le port doit être supérieur ou égal à 1024', 'error');
            return;
        }

        if (!configData.scenarioId) {
            showNotification('Le scénario est requis', 'error');
            return;
        }

        // Validation gameProperties: serverMinGrassDistance minimum 50
        if (configData.gameProperties.serverMinGrassDistance < 50) {
            configData.gameProperties.serverMinGrassDistance = 50;
            showNotification('serverMinGrassDistance ajusté à 50 (minimum requis par Arma)', 'warning');
        }

        // Enregistrer
        let endpoint = '/configs';
        let method = 'POST';

        if (configFormMode === 'edit' && currentConfigEditing) {
            endpoint = `/configs/${currentConfigEditing}`;
            method = 'PUT';
        }

        console.log('[saveConfig] Sending:', { endpoint, method, configData });
        const response = await apiRequest(endpoint, method, configData);
        console.log('[saveConfig] API Response:', response);

        if (response && response.success) {
            showNotification(
                configFormMode === 'create' ? 'Configuration créée avec succès' : 'Configuration mise à jour',
                'success'
            );

            // Masquer le formulaire et recharger la liste
            cancelConfigForm();
            loadConfigsList();
        } else {
            console.error('[saveConfig] Error:', response);
            showNotification(response?.message || 'Erreur lors de l\'enregistrement', 'error');
        }

    } catch (error) {
        console.error('saveConfig error:', error);
        showNotification('Erreur lors de l\'enregistrement de la config', 'error');
    }
}

/**
 * Supprime une configuration
 */
async function deleteConfig(filename) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la configuration "${filename}" ?`)) {
        return;
    }

    try {
        console.log('[deleteConfig] Deleting:', filename);
        const response = await apiRequest(`/configs/${filename}`, 'DELETE');
        console.log('[deleteConfig] API Response:', response);

        if (response && response.success) {
            showNotification('Configuration supprimée', 'success');
            loadConfigsList();
        } else {
            console.error('[deleteConfig] Error:', response);
            showNotification(response?.message || 'Erreur lors de la suppression', 'error');
        }

    } catch (error) {
        console.error('[deleteConfig] Exception:', error);
        showNotification('Erreur lors de la suppression de la config', 'error');
    }
}

/**
 * Lance un serveur depuis une config
 */
async function startServerFromConfig(filename, port) {
    try {
        // Vérifier les conflits de port et l'état du serveur
        const serversCheck = await apiRequest('/servers', 'GET');
        const runningServers = serversCheck?.data?.servers || [];
        const portConflict = runningServers.find(s => s.port === port && s.configFile !== filename);
        if (portConflict) {
            showNotification(`Port ${port} déjà utilisé par "${portConflict.configFile.replace('ServerConfig_', '').replace('.json', '')}"`, 'error');
            return;
        }
        const alreadyRunning = runningServers.find(s => s.configFile === filename);
        if (alreadyRunning) {
            showNotification('Ce serveur est déjà en cours d\'exécution', 'error');
            return;
        }

        const response = await apiRequest('/servers/start', 'POST', { filename, port });

        if (response && response.success) {
            showNotification(`Serveur lancé sur le port ${port}`, 'success');
            // Recharger l'état des serveurs
            if (typeof loadServersStatus === 'function') {
                setTimeout(loadServersStatus, 1000);
            }
        } else {
            showNotification(response?.message || 'Erreur lors du lancement', 'error');
        }

    } catch (error) {
        console.error('startServerFromConfig error:', error);
        showNotification('Erreur lors du lancement du serveur', 'error');
    }
}

/**
 * Arrête un serveur
 */
async function stopServerByPort(port) {
    if (!confirm(`Arrêter le serveur sur le port ${port} ?`)) {
        return;
    }

    try {
        const response = await apiRequest('/servers/stop', 'POST', { port });

        if (response && response.success) {
            showNotification(`Serveur arrêté (port ${port})`, 'success');
            if (typeof loadServersStatus === 'function') {
                setTimeout(loadServersStatus, 1000);
            }
        } else {
            showNotification(response?.message || 'Erreur lors de l\'arrêt', 'error');
        }

    } catch (error) {
        console.error('stopServerByPort error:', error);
        showNotification('Erreur lors de l\'arrêt du serveur', 'error');
    }
}

/**
 * Annule le formulaire de config
 */
function cancelConfigForm() {
    document.getElementById('configFormContainer').style.display = 'none';
    currentConfigEditing = null;
    configFormMode = 'create';
}

/**
 * Ajoute un mod au formulaire
 */
function addConfigMod() {
    const list = document.getElementById('configModsList');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td style="padding:8px;">
            <input type="text" class="config-mod-id" placeholder="ModID (ex: 5964E0B3BB7410CE)"
                   style="width:100%;padding:8px;background:#333;border:1px solid #444;color:white;border-radius:4px;">
        </td>
        <td style="padding:8px;">
            <input type="text" class="config-mod-name" placeholder="Nom du mod"
                   style="width:100%;padding:8px;background:#333;border:1px solid #444;color:white;border-radius:4px;">
        </td>
        <td style="padding:8px;text-align:center;">
            <button class="btn btn-delete" type="button" onclick="this.closest('tr').remove()">×</button>
        </td>
    `;
    list.appendChild(row);
}

/**
 * Remplit la liste des mods depuis un tableau
 */
function fillConfigModsList(mods) {
    const list = document.getElementById('configModsList');
    list.innerHTML = '';

    if (mods && Array.isArray(mods)) {
        mods.forEach(mod => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding:8px;">
                    <input type="text" class="config-mod-id" value="${mod.modId || ''}" placeholder="ModID"
                           style="width:100%;padding:8px;background:#333;border:1px solid #444;color:white;border-radius:4px;">
                </td>
                <td style="padding:8px;">
                    <input type="text" class="config-mod-name" value="${mod.name || ''}" placeholder="Nom"
                           style="width:100%;padding:8px;background:#333;border:1px solid #444;color:white;border-radius:4px;">
                </td>
                <td style="padding:8px;text-align:center;">
                    <button class="btn btn-delete" type="button" onclick="this.closest('tr').remove()">×</button>
                </td>
            `;
            list.appendChild(row);
        });
    }
}

/**
 * Récupère les mods depuis le formulaire
 */
function getConfigModsFromForm() {
    const rows = document.querySelectorAll('#configModsList tr');
    const mods = [];

    rows.forEach(row => {
        const modId = row.querySelector('.config-mod-id')?.value.trim();
        const modName = row.querySelector('.config-mod-name')?.value.trim();

        if (modId) {
            mods.push({
                modId: modId,
                name: modName || modId
            });
        }
    });

    return mods;
}

// ============================================================================
// MODALES: MISSIONS ET MODS DE RÉFÉRENCE
// ============================================================================

/**
 * Ouvre la modale des missions vanilla et remplit la liste
 */
function openMissionsModal() {
    const modal = document.getElementById('missionsModal');
    const list = document.getElementById('missionsList');

    // Vider et remplir la liste depuis localStorage
    list.innerHTML = '';
    const missions = loadMissionsFromStorage();
    missions.forEach(mission => {
        const button = document.createElement('button');
        button.className = 'btn btn-edit';
        button.style.cssText = 'width:100%;text-align:left;padding:12px;font-size:13px;display:flex;justify-content:space-between;align-items:center;';
        button.innerHTML = `
            <span style="font-weight:bold;color:#ffffff;">${mission.name}</span>
            <span style="color:#ffffff;font-size:11px;font-family:monospace;">${mission.scenarioId}</span>
        `;
        button.onclick = () => selectMission(mission.scenarioId);
        list.appendChild(button);
    });

    // Afficher la modale
    modal.style.display = 'flex';
}

/**
 * Ferme la modale des missions
 */
function closeMissionsModal() {
    document.getElementById('missionsModal').style.display = 'none';
}

/**
 * Sélectionne une mission et remplit le champ scenarioId
 */
function selectMission(scenarioId) {
    document.getElementById('config_scenarioId').value = scenarioId;
    closeMissionsModal();
    showNotification('Mission sélectionnée', 'success');
}

/**
 * Ouvre la modale des mods de référence et remplit la liste
 */
function openModsModal() {
    const modal = document.getElementById('modsModal');
    const list = document.getElementById('modsList');

    // Vider et remplir la liste depuis localStorage
    list.innerHTML = '';
    const mods = loadModsFromStorage();
    mods.forEach(mod => {
        const button = document.createElement('button');
        button.className = 'btn btn-start';
        button.style.cssText = 'width:100%;text-align:left;padding:12px;font-size:13px;display:flex;justify-content:space-between;align-items:center;';
        button.innerHTML = `
            <span style="font-weight:bold;">${mod.name}</span>
            <span style="color:#ddd;font-size:11px;font-family:monospace;">${mod.modId}</span>
        `;
        button.onclick = () => addReferenceMod(mod.modId, mod.name);
        list.appendChild(button);
    });

    // Afficher la modale
    modal.style.display = 'flex';
}

/**
 * Ferme la modale des mods
 */
function closeModsModal() {
    document.getElementById('modsModal').style.display = 'none';
}

/**
 * Ajoute un mod de référence à la liste des mods du formulaire
 */
function addReferenceMod(modId, modName) {
    // Vérifier si le mod n'est pas déjà présent
    const existingRows = document.querySelectorAll('#configModsList tr');
    let alreadyExists = false;

    existingRows.forEach(row => {
        const existingModId = row.querySelector('.config-mod-id')?.value.trim();
        if (existingModId === modId) {
            alreadyExists = true;
        }
    });

    if (alreadyExists) {
        showNotification('Ce mod est déjà dans la liste', 'warning');
        return;
    }

    // Ajouter le mod à la liste
    const list = document.getElementById('configModsList');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td style="padding:8px;">
            <input type="text" class="config-mod-id" value="${modId}" placeholder="ModID"
                   style="width:100%;padding:8px;background:#333;border:1px solid #444;color:white;border-radius:4px;">
        </td>
        <td style="padding:8px;">
            <input type="text" class="config-mod-name" value="${modName}" placeholder="Nom"
                   style="width:100%;padding:8px;background:#333;border:1px solid #444;color:white;border-radius:4px;">
        </td>
        <td style="padding:8px;text-align:center;">
            <button class="btn btn-delete" type="button" onclick="this.closest('tr').remove()">×</button>
        </td>
    `;
    list.appendChild(row);

    showNotification(`Mod "${modName}" ajouté`, 'success');
}

// ============================================================================
// GESTION RÉFÉRENCE: MISSIONS ET MODS (localStorage)
// ============================================================================

/**
 * Charge les missions depuis localStorage ou initialise avec les valeurs par défaut
 */
function loadMissionsFromStorage() {
    const stored = localStorage.getItem('otea_missions_ref');
    if (stored) {
        return JSON.parse(stored);
    }
    // Initialiser avec les missions vanilla par défaut
    return VANILLA_MISSIONS;
}

/**
 * Sauvegarde les missions dans localStorage
 */
function saveMissionsToStorage(missions) {
    localStorage.setItem('otea_missions_ref', JSON.stringify(missions));
}

/**
 * Charge les mods depuis localStorage ou initialise avec les valeurs par défaut
 */
function loadModsFromStorage() {
    const stored = localStorage.getItem('otea_mods_ref');
    if (stored) {
        return JSON.parse(stored);
    }
    // Initialiser avec les mods de référence par défaut
    return REFERENCE_MODS;
}

/**
 * Sauvegarde les mods dans localStorage
 */
function saveModsToStorage(mods) {
    localStorage.setItem('otea_mods_ref', JSON.stringify(mods));
}

/**
 * Affiche la liste des missions de référence
 */
function loadMissionsRefList() {
    const missions = loadMissionsFromStorage();
    const tbody = document.getElementById('missionsRefList');

    if (!tbody) return;

    if (missions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:20px;color:#888;">Aucune mission enregistrée</td></tr>';
        return;
    }

    tbody.innerHTML = missions.map((mission, index) => `
        <tr>
            <td style="padding:12px;">${mission.name}</td>
            <td style="padding:12px;font-family:monospace;font-size:12px;">${mission.scenarioId}</td>
            <td style="padding:12px;text-align:center;">
                <button class="btn btn-delete" onclick="deleteMission(${index})" style="font-size:11px;padding:4px 8px;">Supprimer</button>
            </td>
        </tr>
    `).join('');
}

/**
 * Ajoute une mission
 */
function addMission() {
    const nameInput = document.getElementById('new_mission_name');
    const idInput = document.getElementById('new_mission_id');

    const name = nameInput.value.trim();
    const scenarioId = idInput.value.trim();

    if (!name || !scenarioId) {
        showNotification('Veuillez remplir tous les champs', 'warning');
        return;
    }

    const missions = loadMissionsFromStorage();
    missions.push({ name, scenarioId });
    saveMissionsToStorage(missions);

    nameInput.value = '';
    idInput.value = '';

    loadMissionsRefList();
    showNotification('Mission ajoutée', 'success');
}

/**
 * Supprime une mission
 */
function deleteMission(index) {
    if (!confirm('Supprimer cette mission ?')) return;

    const missions = loadMissionsFromStorage();
    missions.splice(index, 1);
    saveMissionsToStorage(missions);

    loadMissionsRefList();
    showNotification('Mission supprimée', 'success');
}

/**
 * Affiche la liste des mods de référence
 */
function loadModsRefList() {
    const mods = loadModsFromStorage();
    const tbody = document.getElementById('modsRefList');

    if (!tbody) return;

    if (mods.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:20px;color:#888;">Aucun mod enregistré</td></tr>';
        return;
    }

    tbody.innerHTML = mods.map((mod, index) => `
        <tr>
            <td style="padding:12px;">${mod.name}</td>
            <td style="padding:12px;font-family:monospace;font-size:12px;">${mod.modId}</td>
            <td style="padding:12px;text-align:center;">
                <button class="btn btn-delete" onclick="deleteMod(${index})" style="font-size:11px;padding:4px 8px;">Supprimer</button>
            </td>
        </tr>
    `).join('');
}

/**
 * Ajoute un mod
 */
function addMod() {
    const nameInput = document.getElementById('new_mod_name');
    const idInput = document.getElementById('new_mod_id');

    const name = nameInput.value.trim();
    const modId = idInput.value.trim();

    if (!name || !modId) {
        showNotification('Veuillez remplir tous les champs', 'warning');
        return;
    }

    const mods = loadModsFromStorage();
    mods.push({ name, modId });
    saveModsToStorage(mods);

    nameInput.value = '';
    idInput.value = '';

    loadModsRefList();
    showNotification('Mod ajouté', 'success');
}

/**
 * Supprime un mod
 */
function deleteMod(index) {
    if (!confirm('Supprimer ce mod ?')) return;

    const mods = loadModsFromStorage();
    mods.splice(index, 1);
    saveModsToStorage(mods);

    loadModsRefList();
    showNotification('Mod supprimé', 'success');
}

// ============================================================================
// GESTION SYSTÈME: CHEMINS
// ============================================================================

/**
 * Charge les chemins système depuis le backend
 */
async function loadSystemPaths() {
    try {
        const response = await apiRequest('/system/paths', 'GET');
        console.log('[loadSystemPaths] API Response:', response);

        if (!response) {
            console.error('[loadSystemPaths] Invalid response:', response);
            return;
        }

        // Remplir les champs depuis le nouveau format de réponse
        document.getElementById('system_serverPath').value = response.serverExecutable?.path || '';
        document.getElementById('system_addonsDir').value = response.addonsDir?.path || '';
        document.getElementById('system_profilePath').value = response.serverProfile?.path || '';
        document.getElementById('system_steamCmdPath').value = response.steamCmd?.path || '';

        // Mettre à jour les indicateurs
        document.getElementById('status_serverPath').textContent = response.serverExecutable?.exists ? '✅' : '❌';
        document.getElementById('status_addonsDir').textContent = response.addonsDir?.exists ? '✅' : '❌';
        document.getElementById('status_profilePath').textContent = response.serverProfile?.exists ? '✅' : '❌';
        document.getElementById('status_steamCmdPath').textContent = response.steamCmd?.exists ? '✅' : '❌';

        // Charger la configuration de l'application
        const appConfig = await apiRequest('/system/app-config', 'GET');
        if (appConfig?.data?.teamName) {
            document.getElementById('system_teamName').value = appConfig.data.teamName;
        }

    } catch (error) {
        console.error('[loadSystemPaths] Error:', error);
        showNotification('Erreur lors du chargement des chemins système', 'error');
    }
}

/**
 * Sauvegarde les chemins système
 */
async function saveSystemPaths() {
    try {
        const data = {
            serverPath: document.getElementById('system_serverPath').value.trim(),
            addonsDir: document.getElementById('system_addonsDir').value.trim(),
            profilePath: document.getElementById('system_profilePath').value.trim(),
            steamCmdPath: document.getElementById('system_steamCmdPath').value.trim(),
            teamName: document.getElementById('system_teamName').value.trim()
        };

        console.log('[saveSystemPaths] Sending:', data);

        const response = await apiRequest('/system/paths', 'PUT', data);
        console.log('[saveSystemPaths] API Response:', response);

        if (response && response.success) {
            showNotification('Chemins système sauvegardés', 'success');
            // Recharger pour mettre à jour les indicateurs
            loadSystemPaths();
        } else {
            showNotification(response?.message || 'Erreur lors de la sauvegarde', 'error');
        }

    } catch (error) {
        console.error('[saveSystemPaths] Error:', error);
        showNotification('Erreur lors de la sauvegarde des chemins', 'error');
    }
}

/**
 * Génère une nouvelle clé JWT
 */
async function generateJwtSecret() {
    if (!confirm('⚠️ Générer une nouvelle clé JWT ?\nTous les utilisateurs connectés seront déconnectés immédiatement.')) {
        return;
    }
    try {
        const response = await apiRequest('/system/generate-jwt-secret', 'POST');
        if (response && response.success) {
            showNotification('✅ Nouvelle clé JWT générée. Reconnectez-vous.', 'success');
            setTimeout(() => {
                AUTH_MODULE.logout();
            }, 2000);
        } else {
            showNotification('Erreur lors de la génération', 'error');
        }
    } catch (err) {
        showNotification('Erreur lors de la génération', 'error');
    }
}


// Initialisation au chargement de la page
window.addEventListener('load', () => {
    // Charger la liste des configs au démarrage si l'onglet est actif
    if (document.getElementById('configuration')?.classList.contains('active')) {
        loadConfigsList();
    }
    // Charger les listes de référence si l'onglet Référence est actif
    if (document.getElementById('reference')?.classList.contains('active')) {
        loadMissionsRefList();
        loadModsRefList();
    }
});
