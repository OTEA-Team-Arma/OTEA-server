# 🔄 Arma Reforger Version Detection

**Document:** Détection automatique des mises à jour Arma Reforger  
**Added:** v2.2  
**Status:** Production Ready

---

## 📋 Overview

OTEA v2.2 adds **automatic detection** of Arma Reforger server updates. Users are notified when a new version is available and can trigger updates directly from the admin panel.

---

## ✨ Features

### 1. Version Comparison
- **Installed version** → Read from `data/arma_version.json` cache
- **Available version** → Query via SteamCMD
- **Update available?** → Compared automatically

### 2. Auto-Notification
- **Badge appears** when update available
- **Yellow alert** with "Update Now" button
- **Auto-checks hourly** (configurable)

### 3. Manual Update Trigger
- Click "Mettre à jour maintenant" button
- Confirmation dialog before update
- Update runs via existing `/api/update-server` endpoint

### 4. Logging
- Version checks logged to `admin.log`
- Update actions logged with timestamps
- Errors captured for troubleshooting

---

## 🏗️ Architecture

### New Files

| File | Purpose |
|------|---------|
| `js/services/arma-version.service.js` | Version detection logic |
| `data/arma_version.json` | Cache of installed version |
| `docs/ARMA_VERSION_DETECTION.md` | This documentation |

### New Endpoint

**GET** `/api/arma-server/check-updates` (protected route)

**Request:** None (uses auth + config)

**Response:**
```json
{
  "installed": "Build 12345",
  "available": "Build 12346",
  "updateAvailable": true,
  "updateUrl": "/api/update-server"
}
```

### Updated Files

| File | Changes |
|------|---------|
| `js/server.js` | Added import + `/api/arma-server/check-updates` endpoint |
| `js/app.js` | Added `checkArmaUpdates()` + `triggerArmaUpdate()` functions |
| `index.html` | Added `<div id="updateBadge">` for notification |

---

## 🔧 How It Works

### 1. On Dashboard Load

```javascript
// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    checkArmaUpdates();            // ← Check now
    setInterval(checkArmaUpdates, 3600000);  // ← Every hour
});
```

### 2. Check Function

```javascript
async function checkArmaUpdates() {
    const response = await fetch('/api/arma-server/check-updates');
    const data = response.json();
    
    if (data.updateAvailable) {
        // Show yellow badge with button
        updateBadge.innerHTML = '🔔 Mise à jour disponible...';
    }
}
```

### 3. Backend (server.js)

```javascript
app.get('/api/arma-server/check-updates', authMiddleware, async (req, res) => {
    const installed = await armaVersionService.getInstalledVersion();
    const available = await armaVersionService.getAvailableVersion(config.steamCmdPath);
    const updateAvailable = await armaVersionService.isUpdateAvailable(config.steamCmdPath);
    
    res.json({ installed, available, updateAvailable });
});
```

### 4. Version Service

**getInstalledVersion():**
- Reads from `data/arma_version.json`
- Returns cached version

**getAvailableVersion():**
- Executes: `steamcmd +login anonymous +app_info_print 1874900 +quit`
- Parses `"buildid" "12345"` from output
- Returns `Build 12345`

**isUpdateAvailable():**
- Compares installed vs available
- Returns `true` if different

---

## 💾 Data Storage

### `data/arma_version.json`

Stores the installed version for quick access:

```json
{
  "version": "Build 12345",
  "lastUpdated": "2026-04-06T14:30:00Z"
}
```

**Updated when:**
- Update successful (after SteamCMD finishes)
- Would need manual update if user updates outside OTEA

**Reset when:**
- Delete file → will show "Unknown"
- Next update → will sync

---

## 🎯 Use Cases

### Scenario 1: Check for Updates
1. Admin opens OTEA dashboard
2. Badge automatically appears if update available
3. Shows: "🔔 Mise à jour disponible: Build 12346 (installée: Build 12345)"
4. Admin can click "Mettre à jour maintenant"

### Scenario 2: Scheduled Check
- Background job checks hourly for updates
- Users see badge on next page load/refresh
- No interruption to running servers

### Scenario 3: Manual Update
1. Admin clicks "Mettre à jour maintenant"
2. Confirmation dialog appears
3. SteamCMD update runs (may take minutes)
4. Version cache updated
5. Badge disappears
6. Log entry created

### Scenario 4: No SteamCMD Configured
- Shows "Unknown" for available version
- Badge never appears
- Users must update manually

---

## ⚙️ Configuration

### Requirements

- **SteamCMD configured** → `STEAMCMD_PATH` env var set
- **Arma server installed** → Binary must exist
- **Network access** → SteamCMD needs internet

### Optional Tuning

**Check frequency** - Edit `js/app.js`:
```javascript
// Change 3600000 (1 hour) to desired milliseconds
setInterval(checkArmaUpdates, 3600000);

// Examples:
// 300000    = 5 minutes
// 1800000   = 30 minutes
// 3600000   = 1 hour (default)
```

---

## 🔍 Troubleshooting

### Badge Never Appears

**Check 1: SteamCMD Configured?**
```bash
echo $STEAMCMD_PATH
# Should show path, not empty
```

**Check 2: Can SteamCMD run?**
```bash
"C:\SteamCMD\steamcmd.exe" +login anonymous +app_info_print 1874900 +quit
# Should complete without errors
```

**Check 3: Browser console errors?**
```javascript
// F12 → Console tab
// Look for: "[checkArmaUpdates] Failed: ..."
```

### SteamCMD Command Fails

**Reason 1:** Path incorrect
```bash
# Fix: Update .env
STEAMCMD_PATH=/correct/path/to/steamcmd
```

**Reason 2:** No internet
- SteamCMD requires outbound connection to Steam servers
- Check firewall rules

**Reason 3:** Invalid app ID
- Hard-coded as 1874900 (official)
- Only change if Bohemia updates

### Version Shows "Unknown"

**Reason 1:** Cache file missing
```bash
# Recreate file:
cp data/arma_version.json .backup
echo '{"version":"Unknown","lastUpdated":"now"}' > data/arma_version.json
```

**Reason 2:** Never updated
- First run always shows "Unknown"
- Will sync after first update

---

## 📊 Logging

### Admin Log Entries

```json
{
  "action": "check-updates",
  "user": "admin",
  "details": {
    "installed": "Build 12345",
    "available": "Build 12346",
    "updateAvailable": true
  }
},
{
  "action": "check-updates-error",
  "user": "admin",
  "details": {
    "error": "SteamCMD failed to run"
  }
}
```

### Server Logs

```
[arma-version] SteamCMD query failed: ENOENT
[arma-version] Failed to save version: Permission denied
```

---

## 🔐 Security

### Safe by Design

- ✅ Requires authentication (`authMiddleware`)
- ✅ SteamCMD runs with minimal permissions
- ✅ Version file is JSON (no shell injection)
- ✅ Update trigger goes through existing auth

### No Credentials Exposed

- SteamCMD uses anonymous login
- No password storage
- Safe to log

---

## 🚀 Future Enhancements (v2.3+)

- [ ] Auto-update on schedule (daily, weekly)
- [ ] Update history per server instance
- [ ] Rollback previous version option
- [ ] Update changelog display
- [ ] Notifications via Discord/Telegram
- [ ] Backup before update

---

## 📚 Related

- [REFACTORING_PLAN.md](REFACTORING_PLAN.md) - v2.2 tasks
- [INSTALL.md](INSTALL.md) - SteamCMD setup
- [FAQ.md](FAQ.md) - Q5: Do I need SteamCMD?
- [update_armar_ds.bat/sh](../update_armar_ds.bat) - Update scripts
