// --- GESTION MODS TABLEAU ---
window.addModRow = function addModRow() {
    const tbody = document.getElementById('modsList');
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid #333';
    row.innerHTML = `
        <td style="padding:10px;"><input type="text" class="mod-id" placeholder="ID du mod" style="width:100%;padding:8px;background:#333;border:1px solid #444;color:white;border-radius:4px;box-sizing:border-box;"></td>
        <td style="padding:10px;"><input type="text" class="mod-name" placeholder="Nom du mod" style="width:100%;padding:8px;background:#333;border:1px solid #444;color:white;border-radius:4px;box-sizing:border-box;"></td>
        <td style="padding:10px;"><input type="text" class="mod-version" placeholder="Version" style="width:100%;padding:8px;background:#333;border:1px solid #444;color:white;border-radius:4px;box-sizing:border-box;"></td>
        <td style="padding:10px;text-align:center;"><button class="btn btn-delete" type="button" onclick="this.closest('tr').remove()">×</button></td>
    `;
    tbody.appendChild(row);
}

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
}

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
                <td style="padding:10px;text-align:center;"><button class="btn btn-delete" type="button" onclick="this.closest('tr').remove()">×</button></td>
            `;
            tbody.appendChild(row);
        });
    }
}

// --- GESTION PRESETS ---
window.updateJsonPreview = function updateJsonPreview() {
    if (typeof getPresetFromForm === 'function') {
        const preset = getPresetFromForm();
        document.getElementById('jsonPreview').textContent = JSON.stringify(preset, null, 2);
    }
}

window.getPresetFromForm = function getPresetFromForm() {
    return {
        id: document.getElementById('preset_title').dataset.id || ("preset_" + Date.now()),
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
}

// --- NAVIGATION ---
window.openTab = function(id) {
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
    if(id === 'dashboard') loadPresets();
    if(id === 'adminlog') loadAdminLog();
    if(id === 'armaServer') loadArmaServerInfo();
    if(id === 'logs') loadServersStatus();
}

// --- FONCTIONS UTILITAIRES ---
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (data) options.body = JSON.stringify(data);
        const response = await fetch(`/api${endpoint}`, options);
        return await response.json();
    } catch (e) {
        appendLog("Erreur connexion Backend : " + e.message);
    }
}

function appendLog(message) {
    const logContainer = document.getElementById('logConsole');
    const isScrolledToBottom = logContainer.scrollHeight - logContainer.clientHeight <= logContainer.scrollTop + 1;
    const time = new Date().toLocaleTimeString();
    let color = "#00ff00";
    if (message.includes("BAN") || message.includes("KICK")) color = "#ff4444";
    if (message.includes("Error")) color = "#ffaa00";
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
            <td>${p.port}</td>
            <td>${p.game.scenarioId.substring(0, 20)}...</td>
            <td>
                <button class="btn btn-start" onclick="launchServer('${p.id}')">Start</button>
                <button class="btn btn-delete" onclick="deletePreset('${p.id}')">Delete</button>
                <button class="btn btn-edit" onclick="stopServer('${p.id}')">Stop</button>
            </td>
        </tr>
    `).join('');
}

// Mise à jour de l'aperçu JSON en temps réel sur modification du formulaire preset
if (document.getElementById('presetForm')) {
    document.getElementById('presetForm').addEventListener('input', window.updateJsonPreview);
}

document.addEventListener('DOMContentLoaded', function() {
    updateJsonPreview();
    document.getElementById('defaultTab').click();
});

document.addEventListener('input', function(e) {
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
checkAdminLogTab();

async function loadAdminLog() {
    const tbody = document.getElementById('adminLogTable');
    tbody.innerHTML = '<tr><td colspan="5">Chargement...</td></tr>';
    try {
        const res = await fetch('/api/admin-log');
        const logs = await res.json();
        if (!Array.isArray(logs) || logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">Aucune activité enregistrée.</td></tr>';
            return;
        }
        tbody.innerHTML = logs.reverse().map(log => `
            <tr>
                <td>${log.date.replace('T', ' ').substring(0, 19)}</td>
                <td>${log.user}</td>
                <td>${log.action}</td>
                <td><pre style="white-space:pre-wrap;max-width:350px;">${JSON.stringify(log.details, null, 2)}</pre></td>
                <td>${log.ip || ''}</td>
            </tr>
        `).join('');
    } catch {
        tbody.innerHTML = '<tr><td colspan="5">Erreur de chargement du journal.</td></tr>';
    }
}

// --- CHANGEMENT DE MOT DE PASSE ---
async function checkDefaultPassword() {
    try {
        const res = await fetch('/admin');
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
    if (!preset) return;
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
    alert("Preset sauvegardé !");
    openTab('dashboard');
}

async function deletePreset(id) {
    if (confirm("Supprimer ce preset ?")) {
        await apiRequest(`/presets/${id}`, 'DELETE');
        loadPresets();
    }
}

async function launchServer(id) {
    const preset = (window._allPresets || []).find(p => p.id === id);
    if (!preset) return appendLog("Preset introuvable");
    appendLog("Lancement du serveur sur le port " + preset.port + "...");
    await apiRequest('/launch', 'POST', preset);
    renderPresetList();
}

async function stopServer(id) {
    const preset = (window._allPresets || []).find(p => p.id === id);
    if (!preset) return appendLog("Preset introuvable");
    appendLog("Arrêt du serveur sur le port " + preset.port + "...");
    await apiRequest('/stop', 'POST', { port: preset.port });
    renderPresetList();
}

// --- GESTION ARMA REFORGER SERVER ---
async function loadArmaServerInfo() {
    // Récupère version installée, version dispo, log
    const info = await apiRequest('/arma-server/info');
    if (!info) return;
    document.getElementById('armaInstalledVersion').textContent = info.installedVersion || 'Inconnue';
    // Indicateur nouvelle version
    if (info.latestVersion && info.installedVersion && info.latestVersion !== info.installedVersion) {
        document.getElementById('armaUpdateIndicator').style.display = '';
        document.getElementById('armaUpdateIndicator').textContent = `Nouvelle version disponible : ${info.latestVersion}`;
    } else {
        document.getElementById('armaUpdateIndicator').style.display = 'none';
    }
    // Log des mises à jour
    document.getElementById('armaUpdateLog').innerHTML = (info.updateLog || []).map(e =>
        `<div>[${e.date}] ${e.status} : ${e.message}</div>`
    ).join('') || '<span style="color:#888;">Aucune action enregistrée</span>';
}

async function updateArmaServer() {
    document.getElementById('armaUpdateBtn').disabled = true;
    document.getElementById('armaUpdateMsg').textContent = 'Mise à jour en cours...';
    try {
        const res = await apiRequest('/api/update-server', 'POST');
        document.getElementById('armaUpdateMsg').textContent = res && res.message ? res.message : 'Erreur lors de la mise à jour';
        showNotification('✓ Mise à jour du serveur Arma Reforger terminée !', 'success');
    } catch (e) {
        document.getElementById('armaUpdateMsg').textContent = 'Erreur : ' + e.message;
        showNotification('✗ Erreur lors de la mise à jour', 'error');
    }
    document.getElementById('armaUpdateBtn').disabled = false;
    loadArmaServerInfo();
}

async function restartOTEA() {
    if (!confirm("Êtes-vous sûr ? OTEA va redémarrer et sera temporairement indisponible.")) {
        return;
    }
    document.getElementById('otearestartBtn').disabled = true;
    document.getElementById('otearestartMsg').textContent = 'Redémarrage en cours...';
    try {
        const res = await apiRequest('/api/restart-otea', 'POST');
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
        const res = await apiRequest('/api/servers-status');
        if (!res || !Array.isArray(res)) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#888;">Aucun serveur en cours d\'exécution</td></tr>';
            return;
        }
        if (res.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#888;">Aucun serveur en cours d\'exécution</td></tr>';
            return;
        }
        tbody.innerHTML = res.map(server => {
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