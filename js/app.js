// --- GESTION MODS TABLEAU ---
window.addModRow = function addModRow() {
    const tbody = document.getElementById('modsList');
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid #333';
    row.innerHTML = `
        <td style="padding:10px;"><input type="text" class="mod-id" placeholder="ID du mod" style="width:100%;padding:8px;background:#333;border:1px solid #444;color:white;border-radius:4px;box-sizing:border-box;"></td>
        <td style="padding:10px;"><input type="text" class="mod-name" placeholder="Nom du mod" style="width:100%;padding:8px;background:#333;border:1px solid #444;color:white;border-radius:4px;box-sizing:border-box;"></td>
        <td style="padding:10px;"><input type="text" class="mod-version" placeholder="Version" style="width:100%;padding:8px;background:#333;border:1px solid #444;color:white;border-radius:4px;box-sizing:border-box;"></td>
        <td style="padding:10px;text-align:center;">
            <button class="btn" type="button" onclick="moveModUp(this.closest('tr'))" style="background:#3498db;padding:6px 8px;margin-right:2px;cursor:pointer;">↑</button>
            <button class="btn" type="button" onclick="moveModDown(this.closest('tr'))" style="background:#3498db;padding:6px 8px;margin-right:2px;cursor:pointer;">↓</button>
            <button class="btn btn-delete" type="button" onclick="this.closest('tr').remove()">×</button>
        </td>
    `;
    tbody.appendChild(row);
};

window.moveModUp = function moveModUp(row) {
    const prevRow = row.previousElementSibling;
    if (prevRow) {
        row.parentNode.insertBefore(row, prevRow);
    }
};

window.moveModDown = function moveModDown(row) {
    const nextRow = row.nextElementSibling;
    if (nextRow) {
        row.parentNode.insertBefore(nextRow, row);
    }
};

window.getModsFromTable = function getModsFromTable() {
    const rows = document.querySelectorAll('#modsList tr');
    const mods = [];
    rows.forEach(row => {
        const modId = row.querySelector('.mod-id').value.trim();
        if (modId) {
            mods.push({
                modId: modId,
                name: row.querySelector('.mod-name').value.trim(),
                version: row.querySelector('.mod-version').value.trim()
            });
        }
    });
    return mods;
};

window.fillModsTable = function fillModsTable(mods) {
    const tbody = document.getElementById('modsList');
    tbody.innerHTML = '';
    if (mods && Array.isArray(mods)) {
        mods.forEach(mod => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #333';
            row.innerHTML = `
                <td style="padding:10px;"><input type="text" class="mod-id" value="${mod.modId || ''}" placeholder="ID du mod" style="width:100%;padding:8px;background:#333;border:1px solid #444;color:white;border-radius:4px;box-sizing:border-box;"></td>
                <td style="padding:10px;"><input type="text" class="mod-name" value="${mod.name || ''}" placeholder="Nom du mod" style="width:100%;padding:8px;background:#333;border:1px solid #444;color:white;border-radius:4px;box-sizing:border-box;"></td>
                <td style="padding:10px;"><input type="text" class="mod-version" value="${mod.version || ''}" placeholder="Version" style="width:100%;padding:8px;background:#333;border:1px solid #444;color:white;border-radius:4px;box-sizing:border-box;"></td>
                <td style="padding:10px;text-align:center;">
                    <button class="btn" type="button" onclick="moveModUp(this.closest('tr'))" style="background:#3498db;padding:6px 8px;margin-right:2px;cursor:pointer;">↑</button>
                    <button class="btn" type="button" onclick="moveModDown(this.closest('tr'))" style="background:#3498db;padding:6px 8px;margin-right:2px;cursor:pointer;">↓</button>
                    <button class="btn btn-delete" type="button" onclick="this.closest('tr').remove()">×</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
};

// --- GESTION PRESETS ---
window.updateJsonPreview = function updateJsonPreview() {
    if (typeof getPresetFromForm === 'function') {
        const preset = getPresetFromForm();
        document.getElementById('jsonPreview').textContent = JSON.stringify(preset, null, 2);
    }
};

window.getPresetFromForm = function getPresetFromForm() {
    return {
        id: document.getElementById('preset_title').dataset.id || ('preset_' + Date.now()),
        title: document.getElementById('preset_title').value,
        port: document.getElementById('srv_port').value,
        game: {
            name: document.getElementById('srv_name').value,
            maxPlayers: parseInt(document.getElementById('srv_players').value),
            scenarioId: document.getElementById('mission_id').value,
            scenarioName: document.getElementById('mission_name').value,
            mods: getModsFromTable()
        }
    };
};

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
    if(id === 'dashboard') {loadPresets();}
    if(id === 'adminlog') {loadAdminLog();}
    if(id === 'armaServer') {loadArmaServerInfo();}
    if(id === 'logs') {loadServersStatus();}
};

// --- FONCTIONS UTILITAIRES ---
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const auth = btoa('admin:admin1234');
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
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

// --- GESTION PRESETS ---
async function loadPresets() {
    const presets = await apiRequest('/presets');
    window._allPresets = presets || [];
    renderPresetList();
}

function renderPresetList() {
    const presets = (window._allPresets || []);
    const tbody = document.getElementById('presetList');
    if (!presets.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#888;">Aucun preset enregistré</td></tr>';
        return;
    }
    tbody.innerHTML = presets.map(p => `
        <tr>
            <td><a href="#" onclick="fillPresetForm(window._allPresets.find(x=>x.id==='${p.id}'))">${p.title}</a></td>
            <td><span style="background:#3a4a5a;padding:4px 8px;border-radius:3px;font-weight:bold;color:var(--accent);">:${p.port}</span><br><small style="color:#888;font-size:11px;margin-top:3px;display:block;">➜ Configurable</small></td>
            <td>${p.game.scenarioId.substring(0, 20)}...</td>
            <td>
                <button class="btn btn-start" onclick="launchServer('${p.id}')" title="Clique pour configurer le port">▶ Start</button>
                <button class="btn btn-delete" onclick="deletePreset('${p.id}')">Delete</button>
                <button class="btn btn-edit" onclick="stopServer('${p.id}')">Stop</button>
            </td>
        </tr>
    `).join('');
}

// Mise à jour de l'aperçu JSON en temps réel sur modification du formulaire preset
// Désactivé: l'élément jsonPreview n'existe pas dans le HTML
// if (document.getElementById('presetForm')) {
//     document.getElementById('presetForm').addEventListener('input', window.updateJsonPreview);
// }

document.addEventListener('DOMContentLoaded', function () {
    // updateJsonPreview();  // Disabled - element doesn't exist
    document.getElementById('defaultTab').click();
});

document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'searchPreset') {
        renderPresetList();
    }
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
        const auth = btoa('admin:admin1234');
        const res = await fetch('/api/logs', {
            headers: { 'Authorization': `Basic ${auth}` }
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
        const auth = btoa('admin:admin1234');
        const res = await fetch('/api/admin/health', {
            headers: { 'Authorization': `Basic ${auth}` }
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

// --- ACTIONS PRESETS ---
async function fillPresetForm(preset) {
    if (!preset) {return;}
    document.getElementById('preset_title').value = preset.title;
    document.getElementById('preset_title').dataset.id = preset.id;
    document.getElementById('srv_name').value = preset.game.name;
    document.getElementById('srv_port').value = preset.port;
    document.getElementById('srv_players').value = preset.game.maxPlayers;
    document.getElementById('mission_id').value = preset.game.scenarioId;
    document.getElementById('mission_name').value = preset.game.scenarioName || '';
    fillModsTable(preset.game.mods);
    openTab('settings');
}

async function saveSettings() {
    const preset = getPresetFromForm();
    await apiRequest('/presets', 'POST', preset);
    alert('Preset sauvegardé !');
    openTab('dashboard');
}

async function deletePreset(id) {
    if (confirm('Supprimer ce preset ?')) {
        await apiRequest(`/presets/${id}`, 'DELETE');
        loadPresets();
    }
}

// Montrer le modal de configuration du port
function showPortConfigModal(id) {
    const preset = (window._allPresets || []).find(p => p.id === id);
    if (!preset) {return appendLog('Preset introuvable');}

    // Stocker le preset ID temporairement
    window._pendingLaunchId = id;

    // Remplir le modal
    document.getElementById('modalServerName').textContent = preset.title || preset.id;
    document.getElementById('modalOriginalPort').textContent = preset.port || 2001;
    document.getElementById('modalPortInput').value = preset.port || 2001;

    // Afficher le modal
    document.getElementById('portConfigModal').style.display = 'flex';

    // Focus sur le champ port
    setTimeout(() => document.getElementById('modalPortInput').focus(), 100);
}

function closePortModal() {
    document.getElementById('portConfigModal').style.display = 'none';
    window._pendingLaunchId = null;
}

// Valider et lancer avec le port configuré
async function confirmPortAndLaunch() {
    const presetId = window._pendingLaunchId;
    const newPort = parseInt(document.getElementById('modalPortInput').value);

    // Validation du port
    if (!newPort || newPort < 1024 || newPort > 65535) {
        alert('⚠️ Port invalide! Utilisez un port entre 1024 et 65535.');
        return;
    }

    const preset = (window._allPresets || []).find(p => p.id === presetId);
    if (!preset) {return appendLog('Preset introuvable');}

    // Mettre à jour le port du preset temporairement
    preset.port = newPort;

    closePortModal();

    appendLog(`🚀 Lancement du serveur "${preset.title}" sur le port ${newPort}...`);
    const result = await apiRequest('/servers', 'POST', {port: newPort, name: preset.title});

    if (result && result.success) {
        appendLog(`✅ Serveur lancé avec succès sur le port ${newPort}!`);
    }

    renderPresetList();
}

async function launchServer(id) {
    // Lancer directement sans modal
    const preset = (window._allPresets || []).find(p => p.id === id);
    if (!preset) {return appendLog('Preset introuvable');}

    appendLog(`🚀 Lancement du serveur "${preset.title}" sur le port ${preset.port}...`);
    const result = await apiRequest('/servers', 'POST', {port: preset.port, name: preset.title});

    if (result && result.success) {
        appendLog(`✅ Serveur lancé avec succès sur le port ${preset.port}!`);
    }

    renderPresetList();
}

async function stopServer(id) {
    const preset = (window._allPresets || []).find(p => p.id === id);
    if (!preset) {return appendLog('Preset introuvable');}
    appendLog('Arrêt du serveur sur le port ' + preset.port + '...');
    await apiRequest(`/servers/${preset.port}`, 'DELETE');
    renderPresetList();
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
    if (!confirm('Êtes-vous sûr ? OTEA va redémarrer et sera temporairement indisponible.')) {
        return;
    }
    document.getElementById('otearestartBtn').disabled = true;
    document.getElementById('otearestartMsg').textContent = 'Redémarrage en cours...';
    try {
        const res = await apiRequest('/admin/restart-all', 'POST');
        document.getElementById('otearestartMsg').textContent = 'Redémarrage initié. La page va se rafraîchir...';
        showNotification('⟳ Redémarrage d\'OTEA en cours...', 'warning');
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
        const auth = btoa('admin:admin1234');
        const response = await fetch('/api/updates/check', {
            headers: { 'Authorization': `Basic ${auth}` }
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
};