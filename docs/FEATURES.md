# Features - OTEA Server Manager

Complete feature documentation and usage guide.

---

## 📋 Table of Contents

1. [Dashboard](#dashboard)
2. [Server Configuration](#server-configuration)
3. [Administration](#administration)
4. [Player Management](#player-management)
5. [Preset System](#preset-system)
6. [Multi-Instance Support](#multi-instance-support)
7. [Audit Logging](#audit-logging)
8. [Security Features](#security-features)

---

## Dashboard

### Real-time Server Status

Monitor all your Arma Reforger server instances from one screen.

**Displays:**
- Server name and status (🟢 Running / 🔴 Stopped)
- Connected player count
- Memory usage
- CPU usage
- Uptime
- Port number

**Actions:**
- **Start Server** - Launch new instance
- **Stop Server** - Graceful shutdown
- **Restart Server** - Full restart with reconnect for players
- **View Logs** - Real-time console output

```
Monitor Dashboard
┌─────────────────────────────────────────┐
│ Server Status                            │
├─────────────────────────────────────────┤
│ 🟢 GameMaster - 45/100 players         │
│    Memory: 2.4 GB | CPU: 18%            │
│    Uptime: 5d 3h 24m | Port: 2302      │
└─────────────────────────────────────────┘
```

---

## Server Configuration

### Configuration Management

Create and manage multiple server configurations from the web interface.

**Available Settings:**
- **Server Name** - Display name for administration
- **Game Type** - Mission mode or custom scenario
- **Max Players** - 1-100 players
- **Password** - Server-side authentication
- **Difficulty Settings**
  - Damage
  - Friendly Fire
  - Stamina
  - Sway
- **Game Rules** - PvE, PvP, Mixed
- **Region** - Server location (EU, US, AS, etc.)

### Configuration Presets

Save and restore configurations instantly.

```json
{
  "name": "GameMaster-EU-Standard",
  "serverName": "GameMaster Server EU",
  "gameType": "coop",
  "maxPlayers": 64,
  "difficulty": {
    "damage": 1,
    "friendlyFire": true,
    "stamina": true
  },
  "region": "EU"
}
```

**Preset Features:**
- ✅ Save current configuration as preset
- ✅ Load preset to apply settings
- ✅ Clone preset with new name
- ✅ Delete unused presets
- ✅ Export/Import (JSON format)

---

## Administration

### Server Management

Comprehensive server lifecycle management.

#### Available Commands

| Command | Effect | Notes |
|---------|--------|-------|
| **Launch** | Start server instance | Loads active config |
| **Stop** | Stop server cleanly | Players notified |
| **Restart** | Stop then start | Config reload |
| **Force Stop** | SIGKILL(immediate) | Use if stuck |
| **Update Server** | Check Steam updates | Via SteamCMD |
| **Clear Cache** | Remove mission cache | Frees disk space |

#### Process Monitoring

Shows all running Arma processes with details:
- Process ID (PID)
- Port number
- Memory usage
- Start time
- Status

### Maintenance

**Available Tasks:**
- 🔄 SteamCMD update check
- 🗑️ Cache cleanup
- 📊 Log rotation
- 🔧 Configuration validation
- 🛡️ Security check

---

## Player Management

### Online Players

View and manage players currently connected to servers.

**Player List Shows:**
- 👤 Player name/ID
- ⏱️ Connection time
- 🔗 IP address
- 🎮 Current activity
- 📊 Data usage

**Available Actions:**
- **Kick Player** - Remove from server (can rejoin)
- **Ban Player** - Permanent ban (requires unban to rejoin)
- **Send Message** - In-game notification
- **View History** - Past connections

### Player Banning

Sophisticated ban management system.

#### Ban Types

```
┌─────────────────────────────────────┐
│ Ban Management                      │
├─────────────────────────────────────┤
│ Permanent Ban                       │
│ ├─ By Player ID                     │
│ ├─ By Username                      │
│ └─ Reason: griefing | cheating      │
│                                     │
│ Temporary Ban                       │
│ ├─ Duration: 1h, 24h, 1w, custom   │
│ ├─ Auto-removeafter expiry          │
│ └─ Reason logged                    │
└─────────────────────────────────────┘
```

#### Ban Database

Persistent storage of all bans:
```json
{
  "playerId": "user123",
  "playerName": "PlayerName",
  "banType": "permanent",
  "reason": "Griefing",
  "bannedAt": "2024-01-15T10:30:00Z",
  "bannedBy": "admin",
  "expiresAt": null
}
```

#### Unban Process

- Manual unban from admin panel
- Automatic expiry for temp bans
- Audit log entry for all unban events

---

## Preset System

### Purpose

Presets allow you to:
- Save server configurations
- Apply configurations instantly
- Share configurations between instances
- Version control server setups

### Workflow

```
1. Configure Server
   ├─ Set all parameters
   └─ Test configuration
      │
2. Save as Preset
   ├─ Name: e.g. "EU-Standard-64p"
   └─ Add description
      │
3. Deploy Preset
   ├─ Load on existing server
   ├─ Use for new instance
   └─ Share with team
      │
4. Update as Needed
   └─ Modify and re-save
```

### Built-in Presets

**preset_GameMaster.json** - Reference configuration for co-op gameplay

### File Format

```json
{
  "name": "My-Config",
  "description": "EU server for testing",
  "serverName": "Test Server",
  "gameType": "coop",
  "maxPlayers": 32,
  "difficulty": {
    "damage": 1.0,
    "friendlyFire": true,
    "stamina": true
  },
  "region": "EU",
  "mods": [
    "mod1.pbp",
    "mod2.pbp"
  ]
}
```

---

## Multi-Instance Support

### Running Multiple Servers

OTEA supports running multiple Arma Reforger instances simultaneously.

**Features:**
- Each instance runs independently
- Separate configurations per instance
- Separate player data per instance
- Automatic port allocation
- Shared admin dashboard

### Configuration

Each instance uses its own configuration:

```
OTEA-server/
├── data/
│   ├── config.json (shared settings)
│   └── instances/
│       ├── instance-1/
│       │   ├── config.json
│       │   └── players.json
│       └── instance-2/
│           ├── config.json
│           └── players.json
```

### Port Allocation

Ports are automatically assigned starting from 2302:
- Instance 1: Port 2302
- Instance 2: Port 2303
- Instance 3: Port 2304
- etc.

### Resource Management

Monitor resource usage per instance:

| Instance | Memory | CPU | Players | State |
|----------|--------|-----|---------|-------|
| 1 | 1.2GB | 12% | 32/64 | Running |
| 2 | 1.5GB | 15% | 28/64 | Running |
| 3 | 0.0GB | 0% | 0/100 | Stopped |

---

## Audit Logging

### Purpose

Complete audit trail of all administrative actions.

**Logged Events:**
- Login attempts (success/failure)
- Configuration changes
- Server start/stop
- Player bans/kicks
- Permission changes
- Security events

### Log Format

```json
{
  "timestamp": "2024-01-15T10:30:45Z",
  "action": "PLAYER_BAN",
  "severity": "INFO",
  "admin": "admin",
  "details": {
    "playerId": "user123",
    "reason": "Griefing",
    "duration": "permanent"
  }
}
```

### Log Levels

| Level | Icon | Purpose |
|-------|------|---------|
| INFO | ℹ️ | Normal operations |
| WARNING | ⚠️ | Unusual activity |
| ERROR | ❌ | Failures/errors |
| CRITICAL | 🚨 | Security issues |

### Log Access

- View logs in admin panel
- Download audit report (CSV)
- Real-time log streaming
- Historical archive access

---

## Security Features

### ⚠️ IMPORTANT - Production Security Note

**CURRENT STATUS:** This version is suitable for **development and internal testing only**.

**For production deployment, you MUST:**
1. ⏳ **Configure HTTPS/TLS** - Currently running HTTP only on port 3000
2. ⏳ **Set up Nginx reverse proxy** - Template provided in `deployment/nginx.conf`
3. 🔒 **Change default credentials** - Update admin password in `data/users.json`
4. 📝 **Review SECURITY_PLAN.md** - Follow the 5-phase security implementation

See [SECURITY_PLAN.md](../deployment/SECURITY_PLAN.md) and [INSTALL.md](./INSTALL.md#docker-installation) for production setup.

### Authentication

✅ **Basic Authentication**
- Username/password login
- Session tokens
- Auto-logout: 15 minutes idle

⏳ **HTTPS/TLS Support** (À IMPLÉMENTER)
- ❌ NOT YET IMPLEMENTED - Currently HTTP only on port 3000
- Required for production use
- SSL certificate configuration needed
- Encrypted data transmission needed
- HSTS headers needed
- See [SECURITY_PLAN.md](../deployment/SECURITY_PLAN.md) for implementation steps

### Authorization

- **Admin** - Full access
- **Moderator** - Limited player management (future)
- **Viewer** - Read-only access (future)

### Protection Features

✅ **Rate Limiting**
- Prevent brute-force attacks
- DDoS mitigation
- Login throttling

✅ **Input Validation**
- SQL injection prevention
- XSS protection
- Command injection prevention

✅ **Data Protection**
- No plaintext passwords in logs
- Sensitive data excluded from audit trail
- Regular security backups

### Access Control

- IP whitelist support (deployment)
- VPN tunnel ready
- ⏳ **Nginx reverse proxy** (À IMPLÉMENTER)
  - ❌ NOT YET CONFIGURED - Required for production
  - Template available in `deployment/nginx.conf`
  - Needed for HTTPS, rate limiting, and security headers
  - Must be set up before public release

---

## Advanced Features

### API Documentation

Complete REST API for integration:
```bash
GET    /api/servers-status
GET    /api/presets
POST   /api/launch
POST   /api/stop
GET    /api/players/list
POST   /api/players/kick
POST   /api/players/ban
GET    /api/players/banned
```

See [API.md](API.md) for complete reference.

### Deployment Options

✅ **Local Development**
- Node.js native
- Fast feedback loop

⏳ **Production Server** (Ready with setup)
- ✅ systemd service (Linux)
- ✅ PM2 process manager
- ✅ Nginx reverse proxy (template provided in `deployment/nginx.conf`)
- ✅ HTTPS/TLS (templates and guides provided)
- **Community members CAN deploy this** - See [INSTALL.md](./INSTALL.md) and [SECURITY_PLAN.md](../deployment/SECURITY_PLAN.md)

✅ **Containerized**
- Docker container (ready-to-use)
- Docker Compose (all services included)
- Kubernetes ready

### 🚀 For Community Server Operators

**YES - You can use OTEA on your Arma Reforger server!**

To get started:
1. Follow the [INSTALL.md](./INSTALL.md) guide (choose Windows, Linux, or Docker)
2. Configure your server in `data/config.json`
3. For production use, implement HTTPS + Nginx (see below)

**To set up HTTPS + Nginx for production:**
1. Get an SSL certificate (Let's Encrypt recommended)
2. Configure Nginx using template in `deployment/nginx.conf`
3. Follow steps in [SECURITY_PLAN.md](../deployment/SECURITY_PLAN.md)
4. Docker setup makes this even easier - see [INSTALL.md#docker-installation](./INSTALL.md#docker-installation)

**All templates and guides are provided** - you just need to customize paths and credentials!

### Performance

- Optimized for 5+ simultaneous server instances
- Memory-efficient configuration
- Real-time status updates
- Responsive UI (Vanilla JS)

---

## Roadmap

Planned features:
- [ ] Role-based access control (RBAC)
- [ ] Player whitelist management
- [ ] Scheduled server events
- [ ] Discord webhook notifications
- [ ] REST API v2
- [ ] WebSocket real-time updates
- [ ] Mobile companion app

---

**Questions?** See [FAQ.md](FAQ.md) or [API.md](API.md).
