# Frequently Asked Questions (FAQ)

Common questions and troubleshooting for OTEA Server Manager.

---

## 📋 Table of Contents

1. [Installation Questions](#installation-questions)
2. [Server Management](#server-management)
3. [Configuration](#configuration)
4. [Player Management](#player-management)
5. [Troubleshooting](#troubleshooting)
6. [Security](#security)
7. [Performance](#performance)

---

## Installation Questions

### Q1: What are the minimum requirements?

**A:** 
- **OS:** Windows 10+ or modern Linux distro
- **Node.js:** 16.x or higher
- **RAM:** 512 MB minimum (2GB+ recommended)
- **Arma Reforger Server:** Must be installed separately

### Q2: How do I install on Windows?

**A:** See the [INSTALL.md](INSTALL.md) guide. Quick version:
1. Install Node.js
2. Clone repository
3. Run `npm install`
4. Edit `data/config.json` with your paths
5. Run `node js/server.js`

### Q3: Can I run OTEA on a VPS/Dedicated Server?

**A:** **Yes!** OTEA is designed for this. Follow the [Linux Installation](INSTALL.md#linux-installation) guide and set up as systemd service for auto-restart.

### Q4: Should I use Docker?

**A:** Recommended for production. Benefits:
- ✅ Isolation from system dependencies
- ✅ Easy updates and rollbacks
- ✅ Simple deployment to different servers
- ✅ Auto-restart on failure

See [Docker Installation](INSTALL.md#docker-installation).

### Q5: Do I need SteamCMD?

**A:** Depends on your setup:
- ✅ **With SteamCMD:** OTEA can auto-update your Arma server
- ✅ **Without SteamCMD:** You must update manually via Steam
- Set `steamCmdPath` in config.json accordingly

---

## Server Management

### Q6: How do I start a server?

**A:** Three options:

**Method 1:** Web Interface
1. Login to http://localhost:3000
2. Click "Launch" button

**Method 2:** API
```bash
curl -X POST -u admin:password123 http://localhost:3000/api/launch
```

**Method 3:** CLI
```bash
node js/server.js
```
Then use web interface or API.

### Q7: Arma Server won't start via OTEA - what do I check?

**A:** Troubleshooting checklist (for **Arma Reforger server**, not OTEA itself):

1. ❌ **Check paths in config.json:**
   ```bash
   ls -la /path/to/ArmaReforgerServer.exe  # Windows
   ls -la /path/to/ArmaReforgerServer      # Linux
   ```

2. ❌ **Check port availability:**
   ```bash
   netstat -an | grep 2302    # Linux
   netstat -ano | findstr 2302 # Windows
   ```

3. ❌ **Check permissions:**
   ```bash
   chmod +x /path/to/ArmaReforgerServer (Linux)
   ```
   ```

4. ❌ **Check logs:**
   ```bash
   tail -f data/admin.log  # Last 10 lines
   ```

5. ❌ **Verify file exists:**
   - Is ArmaReforgerServer.exe in the specified path?
   - Do file permissions allow execution?

### Q8: How do I stop a server?

**A:** 
- **Web UI:** Click "Stop" button
- **API:** `POST /api/stop`
- **Kill switch:** Ctrl+C (dangerous - prefer graceful stop)

### Q9: Can I run multiple server instances?

**A:** **Yes!** OTEA supports multi-instance management:
- Set `maxInstances` in config.json
- Each gets its own port (2302, 2303, 2304, etc.)
- Each gets its own data directory
- All managed from one admin panel

Example:
```json
{
  "maxInstances": 5
}
```

### Q10: What's the difference between Stop and Force Stop?

**A:**
- **Stop (Graceful):** Gives players 30 seconds notice, allows saves
- **Force Stop:** Immediate kill (Ctrl+C equivalent), may lose data
- Use Force Stop only if server is hung

---

## Configuration

### Q11: How do I change the web interface port?

**A:** Currently hardcoded to port 3000. To change, edit `js/server.js`:
```javascript
const PORT = 3000; // Change to your port
```

### Q12: Can I access OTEA Admin Panel from other machines?

**A:** **Yes, but with CRITICAL SECURITY WARNINGS!**

⚠️ **READ FIRST:** [SECURITY_PORT_3000.md](SECURITY_PORT_3000.md) - **This is important!**

#### Local Network (Safe ✅)
```
http://192.168.1.100:3000   # Internal network only
```
Requirements:
- Machine is on your internal network
- WiFi has WPA2+ encryption
- Firewall blocks internet access

#### Internet / Production (DANGEROUS ❌ without protection)
**Default configuration is NOT secure!**

```
❌ BAD:  http://yourdomain.com:3000  (Exposed!)
✅ GOOD: https://yourdomain.com:443 via Nginx reverse proxy
```

**Why it's dangerous:**
- Port 3000 = default Node.js (known attack target)
- HTTP = no encryption (credentials sent in plain text)
- No rate limiting on login attempts
- Subject to port scans + automated attacks

**How to do it safely:**
1. Use HTTPS + reverse proxy (Nginx/Apache)
2. Force HTTPS, block HTTP
3. Use Let's Encrypt (free SSL)
4. Keep strong passwords (20+ chars)

**See:** `deployment/nginx.conf` for secure reverse proxy setup

---

### Q13: OTEA Admin Panel won't start - what do I check?

**A:** If OTEA itself won't launch (not about Arma servers):

1. **Is Node.js installed?**
   ```bash
   node --version  # Should show v16+
   ```

2. **Are dependencies installed?**
   ```bash
   npm install
   ```

3. **Is port 3000 available?**
   ```bash
   netstat -ano | findstr :3000  # Windows
   lsof -i :3000                 # Linux
   ```
   
   If in use, either:
   - Stop the other process
   - Change OTEA port (set `OTEA_PORT` env var)

4. **Check logs:**
   ```bash
   node js/server.js  # Run in foreground to see errors
   ```

---

### Q14: How do I change the OTEA Admin Panel port?

**A:** Use environment variable (no code changes needed):

```bash
# Windows (PowerShell)
$env:OTEA_PORT = 5000
node js/server.js

# Linux/Mac (Bash)
export OTEA_PORT=5000
node js/server.js
```

Or hardcode in `js/server.js`:
```javascript
const PORT = process.env.OTEA_PORT || 3000;  // Change 3000 to your port
```

---

### Q15: How do I set up HTTPS?

**A:** Use deployment files:
1. Copy `deployment/nginx.conf`
2. Add SSL certificate paths
3. See [SECURITY_PLAN.md](../deployment/SECURITY_PLAN.md) for details
4. Or run Docker with `docker-compose -f deployment/docker-compose.yml up`

### Q14: How do I backup my configuration?

**A:** All data is in `data/` folder:
```bash
tar -czf backup-$(date +%Y%m%d).tar.gz data/
```

Restore:
```bash
tar -xzf backup-DATE.tar.gz
```

### Q15: Can I transfer settings between servers?

**A:** **Yes!** Use presets:
1. Save current config as preset
2. Transfer the JSON file
3. Load on new server

Or manually copy `data/config.json`

---

## Player Management

### Q16: How do I ban a player?

**A:** Three ways:

**Method 1:** Web Interface
1. Go to "Joueurs" (Players) tab
2. Find player in online list
3. Click "Ban" → Confirm

**Method 2:** API
```bash
curl -X POST -u admin:password123 \
  http://localhost:3000/api/players/ban \
  -d '{
    "playerId":"user123",
    "reason":"Griefing",
    "duration":"permanent"
  }'
```

**Method 3:** In-game command (implementation depends on mod)

### Q17: What's the difference between Kick and Ban?

**A:**
- **Kick:** Player is removed, can rejoin immediately
- **Ban:** Player cannot rejoin until unbanned

### Q18: Can I create a temporary ban?

**A:** **Yes!** Use duration in hours:
```bash
curl -X POST -u admin:password123 \
  http://localhost:3000/api/players/ban \
  -d '{
    "playerId":"user123",
    "reason":"Spam",
    "duration":24  # 24 hours
  }'
```

Auto-expires after duration.

### Q19: How do I see who's banned?

**A:** 
- **Web UI:** "Joueurs" tab → "Banned Players" section
- **API:** `GET /api/players/banned`

### Q20: Can I unban a player?

**A:** **Yes!**
- **Web UI:** Click "Unban" on player in ban list
- **API:** `POST /api/players/unban`

---

## Troubleshooting

### Q21: "Port 3000 already in use" error

**A:**

**Linux/macOS:**
```bash
lsof -i :3000
kill -9 <PID>
```

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Or change port in `js/server.js`

### Q22: "ArmaReforgerServer not found" error

**A:** 
1. Check file path in `data/config.json`
2. Verify absolute path (not relative):
   ```json
   "serverRootPath": "C:\\Arma3DS"  // Good
   "serverRootPath": "./arma"       // Bad
   ```
3. Check file permissions: is executable bit set?

### Q23: Server starts but crashes immediately

**A:** Check admin.log:
```bash
tail -50 data/admin.log
```

Common causes:
- ❌ Arma configuration invalid
- ❌ Port already in use
- ❌ Insufficient permissions
- ❌ Binary not executable

### Q24: Web interface won't load

**A:**
1. **Check Node.js running:**
   ```bash
   curl http://localhost:3000
   ```

2. **Check firewall:** Is port 3000 blocked?

3. **Restart OTEA:**
   ```bash
   Ctrl+C
   node js/server.js
   ```

4. **Check errors:**
   ```bash
   tail -20 data/admin.log
   ```

### Q25: Performance is slow with multiple instances

**A:** Check resources:
- **Memory:** `free -h` (Linux) or Task Manager (Windows)
- **CPU:** `top` (Linux) or Task Manager (Windows)
- **Disk:** `df -h` (Linux or `dir` Windows)

Solutions:
- ✅ Reduce `maxInstances` in config.json
- ✅ Lower player-per-instance limits
- ✅ Run on more powerful hardware
- ✅ Split instances across multiple machines

### Q26: Login not working

**A:**
1. **Check credentials:** Default is `admin` / `admin1234`
2. **Check firewall:** Is auth service reachable?
3. **Reset password:** Edit `data/users.json`:
   ```json
   [
     {
       "username": "admin",
       "password": "newpassword123"
     }
   ]
   ```
4. **Restart OTEA** for changes to take effect

### Q27: Player data not persisting

**A:** Check if `bans.json` file is writable:
```bash
ls -l data/bans.json    # Linux
```

Should be writable (`-rw-r-`):
```bash
chmod 664 data/bans.json
```

---

## Security

### Q28: Is OTEA secure enough for production?

**A:** It depends on your deployment:

✅ **Secure if:**
- Running over HTTPS (see deployment/)
- Admin password changed from default
- Firewall restricts access
- Regular security updates applied

⚠️ **Not recommended without:**
- SSL/TLS certificates
- Rate limiting (Nginx reverse proxy)
- Regular backups
- Network isolation

See [SECURITY_PLAN.md](../deployment/SECURITY_PLAN.md)

### Q29: How do I change the admin password?

**A:** Edit `data/users.json`:
```json
[
  {
    "username": "admin",
    "password": "MyNewSecurePassword123!"
  }
]
```

Then restart OTEA.

### Q30: Are passwords encrypted?

**A:** 
- ❌ **Not in data/users.json** (stored plaintext)
- ✅ **Encrypted in transit** (use HTTPS)
- ✅ **Never logged** (not in audit.log)

For production: hash passwords using bcrypt middleware.

### Q31: How do I view the audit log?

**A:**
- **Web UI:** Admin tab → "Console" section
- **File:** `data/admin.log` (JSON format)
- **API:** `GET /api/audit-log`

### Q32: Can I restrict access to specific IPs?

**A:** **Yes!** Use Nginx reverse proxy (see deployment/nginx.conf):
```nginx
geo $allow_access {
  default 0;
  192.168.1.0/24 1;    # Only internal network
  203.0.113.0/24 1;    # Specific office
}

if ($allow_access = 0) {
  return 403;
}
```

---

## Performance

### Q33: What's the maximum number of server instances?

**A:** Depends on hardware:
- **Min setup:** 2-3 instances (@512MB RAM each)
- **Standard:** 5-8 instances (@2GB RAM each)
- **Enterprise:** 20+ instances (requires load balancing)

Test on your hardware and set `maxInstances` accordingly.

### Q34: Does OTEA support load balancing?

**A:** Not built-in. For enterprise setup:
- ✅ Run OTEA on multiple machines
- ✅ Use Nginx upstream to balance traffic
- ✅ Sync configurations via shared storage
- ✅ Use external database for session storage

See ROADMAP in [FEATURES.md](FEATURES.md)

### Q35: How do I optimize for many concurrent players?

**A:**
1. **Server-side:**
   - Reduce tick rate in mission config
   - Limit client script complexity
   - Use async operations

2. **Network:**
   - Increase bandwidth allocation
   - Use dedicated server box
   - Enable network compression

3. **OTEA-level:**
   - Choose powerful host
   - Set appropriate `maxInstances`
   - Monitor audit logs for issues

---

## Getting Help

### Can't find answer here?

1. 📖 Check [INSTALL.md](INSTALL.md), [FEATURES.md](FEATURES.md), [API.md](API.md)
2. 📊 Review logs: `data/admin.log`
3. 🐛 Open GitHub issue with:
   - Your OS and Node.js version
   - Error message and steps to reproduce
   - Contents of `data/admin.log` (remove sensitive info)

**GitHub:** https://github.com/your-username/OTEA-server/issues

---

**Last Updated:** 2024-01-15
