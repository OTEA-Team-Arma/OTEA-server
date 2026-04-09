# Windows Installation - OTEA-Server v2.4

Complete guide for installing OTEA-Server on Windows Server or local machine.

---

## Prerequisites

1. **Windows 10+** or **Windows Server 2016+**
2. **Node.js 18 LTS** (or higher)
   - Download: https://nodejs.org/
   - During install: Check "Add to PATH"
   - Verify: `node -v` and `npm -v` in PowerShell

3. **Git** (optional, for cloning repo)
   - Download: https://git-scm.com/download/win

---

## Installation Steps

### Step 1: Get the Code

**Option A: Clone from Git (Recommended)**
```powershell
git clone https://github.com/OTEA-Team-Arma/OTEA-server.git
cd OTEA-server
```

**Option B: Extract from Zip**
```powershell
# Assuming you have OTEA-server.zip
Expand-Archive -Path OTEA-server.zip -DestinationPath C:\apps\
cd C:\apps\OTEA-server
```

### Step 2: Install Dependencies

```powershell
npm install
```

Wait for all packages to download (~2-3 minutes).

### Step 3: Configure Environment

```powershell
# Copy example
Copy-Item .env.example .env

# Edit with your settings
notepad .env
```

**Important Settings:**
```env
NODE_ENV=development  # or production
PORT=3000
JWT_SECRET=generate-a-long-random-string
```

### Step 4: Test Locally

```powershell
npm start
```

Should see:
```
Server running on http://localhost:3000
```

Visit http://localhost:3000 in your browser.

Default login:
- Username: `admin`
- Password: `admin1234`

⚠️ **Change password immediately!**

---

## Service Installation (Auto-Start)

To run as Windows service that auto-starts:

### Option A: PM2 (Recommended)

**Install PM2 globally:**
```powershell
npm install -g pm2
```

**Start the application:**
```powershell
pm2 start backend/server.js --name OTEA-Server
```

**Make it auto-start:**
```powershell
# Run as Administrator!
pm2 startup windows
pm2 save
```

**Useful commands:**
```powershell
pm2 restart OTEA-Server
pm2 stop OTEA-Server
pm2 logs OTEA-Server
pm2 status
```

### Option B: NSSM (Non-Sucking Service Manager)

**Download NSSM:**
- https://nssm.cc/download
- Extract to `C:\nssm\` (or your preferred location)

**Create service:**
```powershell
cd C:\nssm\win64\  # or win32 for 32-bit

# Install service
nssm install OTEA-Server "C:\Program Files\nodejs\node.exe" "C:\apps\OTEA-server\backend\server.js"

# Set working directory
nssm set OTEA-Server AppDirectory C:\apps\OTEA-server

# Start service
nssm start OTEA-Server
```

**Verify:**
```powershell
# Services dialog
services.msc

# Or command line
net start | findstr OTEA
```

---

## Firewall Configuration

If accessing from other computers:

**Add inbound rule for port 3000:**
```powershell
# Run PowerShell as Administrator
New-NetFirewallRule -DisplayName "OTEA-Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

**Verify:**
```powershell
Get-NetFirewallRule -DisplayName "OTEA-Server"
```

---

## Managing the Application

### Check Status

```powershell
# PM2
pm2 status

# Direct Node.js
Get-Process node

# Service
Get-Service -Name OTEA-Server
```

### View Logs

```powershell
# PM2
pm2 logs OTEA-Server

# Event Viewer (for services)
eventvwr.msc
# Navigate to: Windows Logs > Application

# Direct file
Get-Content data/admin.log -Tail 20
```

### Stop/Start Service

```powershell
# PM2
pm2 stop/start/restart OTEA-Server

# Service
net stop OTEA-Server
net start OTEA-Server

# Or Services dialog
services.msc
```

---

## Updating

### Method 1: Manual Update

```powershell
# Stop the service
pm2 stop OTEA-Server  # or: net stop OTEA-Server

# Update code
cd C:\apps\OTEA-server
git pull

# Install new dependencies if any
npm install

# Start again
pm2 start OTEA-Server  # or: net start OTEA-Server
```

### Method 2: Full Reinstall

```powershell
# Remove old service
pm2 delete OTEA-Server
# or
nssm remove OTEA-Server

# Delete old code
Remove-Item C:\apps\OTEA-server -Recurse

# Clone fresh
git clone https://github.com/OTEA-Team-Arma/OTEA-server.git C:\apps\OTEA-server

# Install and setup
cd C:\apps\OTEA-server
npm install
Copy-Item .env.example .env
# Edit .env

# Create new service
pm2 start backend/server.js --name OTEA-Server
pm2 startup windows
pm2 save
```

---

## Troubleshooting

### Port 3000 Already in Use

```powershell
# Find what's using it
netstat -ano | findstr :3000

# Extract PID from output, then:
taskkill /PID <PID> /F

# Or change port in .env
PORT=3001
```

### Permission Denied

**Run PowerShell as Administrator** for:
- Installing services
- Opening ports in firewall
- Writing to system directories

### Service Won't Start

```powershell
# Check event log
eventvwr.msc

# Check logs
Get-Service -Name OTEA-Server | Select Status
Get-WinEvent -LogName Application | findstr OTEA

# Try direct start
cd C:\apps\OTEA-server
npm start
```

### Node.js Command Not Found

```powershell
# Check if it's in PATH
Get-Command node

# If not, add to PATH manually
$env:Path += ";C:\Program Files\nodejs"

# Verify
node -v
```

---

## Recommended Production Setup

1. **Location:** `C:\apps\OTEA-server`
2. **Service:** PM2 or NSSM (auto-restart)
3. **Firewall:** Port 3000 allowed
4. **Reverse Proxy:** (Optional) IIS or Nginx for HTTPS
5. **Backup:** Daily backup of `data/` folder
6. **Monitoring:** Windows Task Scheduler for health checks

---

## Security

⚠️ **For Internet-Facing Installations:**

1. **HTTPS:** Set up IIS or Nginx with SSL
2. **Firewall:** Restrict access by IP if possible
3. **Password:** Use strong password (20+ chars)
4. **JWT_SECRET:** Long random string
5. **Rate Limiting:** Already enabled
6. **Audit Logs:** Monitor `data/admin.log`

See `../DEPLOYMENT/SECURITY_PLAN.md` for details.

---

## Next Steps

1. ✅ Application running
2. ✅ Can access http://localhost:3000
3. ✅ Default login works and password changed

**Now:**
- Create your servers
- Add users
- Configure settings
- Setup backups
- Consider reverse proxy for HTTPS

---

**Version:** 2.4.0  
**Last Updated:** 9 avril 2026
