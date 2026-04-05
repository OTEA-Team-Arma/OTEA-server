# Installation Guide - OTEA Server Manager

Complete step-by-step installation guide for Windows, Linux, and Docker.

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Windows Installation](#windows-installation)
3. [Linux Installation](#linux-installation)
4. [Docker Installation](#docker-installation)
5. [Configuration](#configuration)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum
- **OS**: Windows 10+ or Linux (any modern distro)
- **Node.js**: 16.x or higher
- **RAM**: 512 MB
- **Disk**: 100 MB for OTEA
- **Network**: Stable internet connection

### Recommended
- **Node.js**: 18.x or higher
- **RAM**: 2 GB+
- **Disk**: SSD (faster response times)
- **CPU**: 2+ cores

### For Arma Reforger
- Arma Reforger Server binary installed
- 4+ GB RAM for server instances
- Dedicated network bandwidth

---

## Windows Installation

### Option 1: Manual Setup

#### Step 1: Install Node.js

1. Visit [nodejs.org](https://nodejs.org/)
2. Download LTS version (18.x or higher)
3. Run installer, accept defaults
4. Verify installation:
```bash
node --version
npm --version
```

#### Step 2: Clone Repository

```bash
# Open PowerShell or CMD
cd C:\Users\YourName\Projects

git clone https://github.com/your-username/OTEA-server
cd OTEA-server
```

#### Step 3: Install Dependencies

```bash
npm install
```

Expected output: `added XX packages`

#### Step 4: Configure

Edit `data/config.json`:

```json
{
  "serverRootPath": "C:\\Arma3DS",
  "steamCmdPath": "C:\\SteamCMD\\steamcmd.exe",
  "backendLog": true,
  "maxInstances": 5,
  "defaultRegion": "EU"
}
```

**Key paths:**
- `serverRootPath`: Where ArmaReforgerServer.exe is located
- `steamCmdPath`: Path to steamcmd.exe (if using SteamCMD)

#### Step 5: Start Server

```bash
node js/server.js
```

Output should be:
```
✅ OTEA-server is ready!
📊 Platform: win32
📁 Server root: C:\Arma3DS
Interface d'ingénierie active sur le port 3000
```

#### Step 6: Access

- **URL**: http://localhost:3000
- **Username**: admin
- **Password**: admin1234

⚠️ **Change password immediately!**

---

### Option 2: Batch Script (Automated)

Create `setup.bat`:

```batch
@echo off
echo Installing OTEA Server Manager...
cd /d %~dp0
npm install
echo Setup complete! Run with: node js/server.js
pause
```

Run twice to install dependencies.

---

## Linux Installation

### Debian/Ubuntu

```bash
# 1. Update system
sudo apt update
sudo apt upgrade -y

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Clone repository
cd ~/
git clone https://github.com/your-username/OTEA-server
cd OTEA-server

# 4. Install dependencies
npm install

# 5. Configure
nano data/config.json
# Edit paths:
# - serverRootPath: /home/arma/server
# - steamCmdPath: /home/arma/steamcmd

# 6. Give permissions
chmod +x js/server.js
chmod +x deployment/setup.sh

# 7. Start
node js/server.js
```

### Red Hat / CentOS / Fedora

```bash
# 1. Install Node.js
sudo dnf module enable nodejs:18
sudo dnf install -y nodejs

# 2-7. Same as Debian
```

### Running as Service (systemd)

Create `/etc/systemd/system/otea.service`:

```ini
[Unit]
Description=OTEA Server Manager
After=network.target

[Service]
Type=simple
User=arma
WorkingDirectory=/home/arma/OTEA-server
ExecStart=/usr/bin/node js/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable & start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable otea
sudo systemctl start otea
sudo systemctl status otea
```

---

## Docker Installation

### Prerequisites
- Docker installed (see [docker.com](https://docker.com))
- Docker Compose installed

### Quick Start

```bash
# 1. Clone & navigate
git clone https://github.com/your-username/OTEA-server
cd OTEA-server

# 2. Create env file
cp deployment/.env.example deployment/.env.prod

# 3. Edit configuration
nano deployment/.env.prod
# Set your domain, secrets, paths

# 4. Build & start
docker-compose -f deployment/docker-compose.yml up -d

# 5. Check status
docker-compose -f deployment/docker-compose.yml ps

# 6. View logs
docker-compose -f deployment/docker-compose.yml logs -f backend
```

### Configuration Files

**nginx.conf**: Reverse proxy settings
**docker-compose.yml**: Service orchestration
**.env.prod**: Environment variables

---

## Configuration

### data/config.json

```json
{
  "serverRootPath": "/path/to/arma/server",
  "steamCmdPath": "/path/to/steamcmd",
  "backendLog": true,
  "maxInstances": 5,
  "defaultRegion": "EU"
}
```

| Setting | Description | Example |
|---------|-------------|---------|
| serverRootPath | Arma server root | C:\Arma3DS or /home/arma/server |
| steamCmdPath | SteamCMD executable | C:\SteamCMD\steamcmd.exe |
| backendLog | Enable logging | true |
| maxInstances | Max concurrent servers | 5 |
| defaultRegion | Default server region | EU, US, AS |

### data/users.json

Default user:
```json
{
  "username": "admin",
  "password": "admin1234"
}
```

**CHANGE IMMEDIATELY!** Example:
```json
{
  "username": "admin",
  "password": "MySecurePassword123!!"
}
```

---

## Verification

### Check Installation

```bash
# 1. Node.js version
node --version
# Should be v16.x or higher

# 2. NPM packages
npm list --depth=0
# Should show: express, basic-auth

# 3. Config file
cat data/config.json
# Should show your paths

# 4. File structure
ls -la
# Should have: js/, css/, data/, index.html
```

### Test Server

```bash
# Start
node js/server.js

# In another terminal
curl http://localhost:3000/api/presets
# Should return JSON array

# In browser
http://localhost:3000
# Should show login screen
```

---

## Troubleshooting

### "Port 3000 already in use"

```bash
# Find process using port 3000
lsof -i :3000          # macOS/Linux
netstat -ano | findstr :3000   # Windows

# Kill process
kill -9 <PID>          # macOS/Linux
taskkill /PID <PID> /F # Windows
```

### "ArmaReforgerServer not found"

- Check `data/config.json` serverRootPath
- Verify file exists at that path
- Use absolute, not relative paths

### "npm install" fails

```bash
# Clear cache
npm cache clean --force

# Try again
npm install
```

### Permission denied (Linux)

```bash
# Make scripts executable
chmod +x js/server.js
chmod -R 755 deployment/
```

### Cannot connect after start

- Check firewall allows port 3000
- Try `curl http://127.0.0.1:3000` locally first
- Restart: `Ctrl+C` then restart

---

## Next Steps

1. **Change Credentials**: Edit `data/users.json`
2. **Create Presets**: Use web interface to save configs
3. **Deploy to Production**: See [SECURITY_PLAN.md](../deployment/SECURITY_PLAN.md)
4. **Join Community**: Share on Arma forums!

---

**Need help?** Check [FAQ.md](FAQ.md) or open an issue on GitHub.
