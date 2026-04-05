# OTEA Server Manager - Deployment Guide for System Administrators

**Prepared for:** Linux/Docker System Administrator  
**Purpose:** Deploy OTEA-server alongside existing Docker infrastructure  
**Audience:** IT Operations / DevOps Engineers

---

## 📋 Executive Summary

**What:** OTEA-server is a cross-platform web application for managing Arma Reforger game server instances.

**Why:** Provides centralized web-based management, audit logging, and player administration for Arma Reforger servers.

**Where:** New Docker container on existing Linux server managing Arma 3 (2 instances) + website.

**Impact:** Minimal - isolated container, no changes to existing services.

---

## 🏗️ Current Infrastructure

```
┌─────────────────────────────────────────────────────┐
│  Linux Server                                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ├─ Arma 3 (2 instances) - Native/Standalone      │
│  │                                                  │
│  ├─ Docker Engine                                   │
│  │  ├─ Website Container (running)                 │
│  │  └─ Nginx Reverse Proxy                         │
│  │                                                  │
│  └─ Proposed: OTEA-server Container (new)         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Proposed Architecture

**After OTEA Deployment:**

```
Internet (HTTPS)
    ↓
Nginx Reverse Proxy (Port 443)
├─ https://domain.com/               → Website Container
├─ https://domain.com/otea            → OTEA Container (Port 3000)
└─ Port 80 → Redirect to 443
    ↓
Internal Services (Port 3000)
├─ Website (existing)
└─ OTEA-server (new)

Arma Game Servers (Independent)
├─ Arma 3 Instance 1 (Port XXXX)
├─ Arma 3 Instance 2 (Port XXXX)
└─ Arma Reforger Instance (Port 2302+)
```

---

## ✅ Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Nginx misconfiguration | Low | Test in staging first; rollback script provided |
| Docker resource conflict | Very Low | OTEA uses <300MB RAM, website has spare capacity |
| Port binding conflict | Very Low | Port 3000 already internal, only Nginx listens on 80/443 |
| Certificate issues | Very Low | Let's Encrypt auto-renewal configured |
| Arma server disruption | None | Arma services independent; zero code changes |
| Data loss | Very Low | Data persists in named volumes; backup policy applies |

**Overall Risk Level:** ✅ **VERY LOW** - Isolated container, no changes to existing services.

---

## 📦 Deployment Prerequisites

### System Requirements

- **Docker version:** 20.10+ (get version: `docker --version`)
- **Docker Compose:** 1.29+ (get version: `docker-compose --version`)
- **Available RAM:** 512MB minimum for OTEA (recommend 1GB free)
- **Available Disk:** 2GB minimum for data volumes
- **SSL Certificate:** Let's Encrypt (free, provided via Certbot)

### Required Credentials

- Root or sudo access to `/var/lib/docker/`
- Ability to edit Nginx configuration
- Access to SSL certificate management

### Network Requirements

- Port 80 accessible (HTTP, auto-redirects to HTTPS)
- Port 443 accessible (HTTPS)
- Internal port 3000 for OTEA (nat'd, not exposed)

---

## 📋 Pre-Deployment Checklist

- [ ] Backup existing Docker Compose configuration
- [ ] Backup existing Nginx configuration
- [ ] Document current Nginx upstreams and routes
- [ ] Schedule deployment during maintenance window (or low-traffic period)
- [ ] Notify users of 2-5 minute service window
- [ ] Have rollback plan ready (see below)
- [ ] Have SSH access with sudo privileges

---

## 🚀 Deployment Steps

### Step 1: Clone OTEA Repository

```bash
# SSH into server
ssh admin@yourserver.com

# Clone repository (or update existing)
cd /opt  # or wherever you store services
git clone https://github.com/your-username/OTEA-server.git
cd OTEA-server

# Verify structure
ls -la deployment/
# Should see: docker-compose.yml, nginx.conf, .env.example, etc.
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp deployment/.env.example deployment/.env.prod

# Edit configuration
nano deployment/.env.prod
```

**Key variables to set:**

```bash
# Environment
ENVIRONMENT=production
NODE_ENV=production

# Security
ADMIN_USER=admin
ADMIN_PASSWORD=YourSecurePassword123!  # CHANGE THIS

# Arma Reforger paths (where game server is installed)
SERVER_ROOT_PATH=/path/to/arma-reforger-server
STEAMCMD_PATH=/path/to/steamcmd/steamcmd.sh  # or .exe on Windows

# Logging
LOG_LEVEL=info
BACKEND_LOG=true
```

### Step 3: Verify Arma Paths

**Test that paths are valid:**

```bash
# Check Arma Reforger binary
ls -la /path/to/arma-reforger-server/ArmaReforgerServer  # Linux
# or
ls -la /path/to/arma-reforger-server/ArmaReforgerServer.exe  # Windows

# Check SteamCMD
which steamcmd
# or
ls -la /path/to/steamcmd/steamcmd.sh
```

If paths are incorrect, OTEA will not start. **Fix .env.prod before proceeding.**

### Step 4: Review Docker Compose Configuration

```bash
# View the configuration
cat deployment/docker-compose.yml

# Key services:
# - otea-server: Main application (Node.js)
# - otea-data: Named volume for persistent data
```

**Customizations may be needed:**
- Networks: Ensure it connects to existing Docker network
- Volumes: May need to mount Arma directories
- Ports: Internal port 3000 (no external exposure)

### Step 5: Backup Current State

```bash
# Backup existing Docker Compose
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d)
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d)

# List existing Docker containers
docker ps --all > /tmp/docker-state-backup.txt

# Document DNS records
nslookup yourdomain.com > /tmp/dns-backup.txt
```

### Step 6: Start OTEA Container (Staging)

```bash
# Navigate to deployment directory
cd /opt/OTEA-server/deployment

# Start container in background
docker-compose -f docker-compose.yml up -d

# Check logs
docker-compose logs -f otea-server

# Expected output:
# [osAbstraction] Platform detected: linux
# [osAbstraction] ✅ Config file loaded
# [osAbstraction] ✅ Binary found
# ✅ OTEA-server is ready!
# Interface d'ingénierie active sur le port 3000
```

**If errors occur:**
```bash
# View detailed logs
docker-compose logs -f otea-server

# Check container status
docker ps | grep otea

# Check exposed ports
docker port otea-server
```

### Step 7: Test Internal Connectivity

```bash
# From server, test OTEA is responding (internal)
curl -u admin:YourPassword123 http://localhost:3000/api/presets

# Expected: JSON array of presets
```

### Step 8: Configure Nginx Reverse Proxy

**Option A: Modify existing Nginx config**

```bash
# Edit your existing nginx.conf or sites-available/default
sudo nano /etc/nginx/sites-available/default

# Add upstream for OTEA:
upstream otea_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Add location block:
location /otea/ {
    auth_basic off;  # or keep auth if desired
    proxy_pass http://otea_backend/;
    
    # Headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket support (if needed)
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

**Option B: Use provided template**

```bash
# View template
cat deployment/nginx.conf

# Customize and apply as your full nginx.conf
# A template is provided in deployment/nginx.conf (evaluate, customize, use)
```

### Step 9: Test Nginx Configuration

```bash
# Validate config syntax
sudo nginx -t

# Expected: "syntax is ok" and "test is successful"
```

### Step 10: Apply Nginx Configuration

```bash
# Reload Nginx (zero downtime)
sudo systemctl reload nginx

# Or if using docker-compose Nginx:
docker-compose exec nginx nginx -s reload
```

### Step 11: Test Web Access

```bash
# From external machine or server
curl -k https://domain.com/otea/login  # -k ignores self-signed cert

# Or open browser: https://domain.com/otea
# Login: admin / YourPassword123
```

### Step 12: Set Up SSL Certificate (Let's Encrypt)

```bash
# Install certbot if not present
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com

# Auto-renewal (already configured in crontab)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

### Step 13: Persistent Storage Setup

```bash
# Verify data volume exists
docker volume ls | grep otea

# Create backup volume (optional)
docker volume create otea-data-backup

# Initial data setup
docker-compose exec otea-server mkdir -p /app/data
docker-compose exec otea-server chmod 755 /app/data
```

---

## 🔄 Post-Deployment Verification

### Health Checks

```bash
# Check container running
docker ps | grep otea-server

# Check system logs
docker-compose logs otea-server | tail -20

# Check resource usage
docker stats otea-server  # CPU, Memory, Network

# Test API endpoints
curl -u admin:password123 http://localhost:3000/api/servers-status
curl -u admin:password123 http://localhost:3000/api/presets

# Check Nginx is proxying correctly
tail -f /var/log/nginx/access.log | grep otea
```

### Functional Tests

- [ ] Login at https://domain.com/otea (admin/password)
- [ ] Dashboard loads and shows server status
- [ ] Presets are visible
- [ ] Can create new preset
- [ ] Audit logs are recorded
- [ ] Player bans/kicks work
- [ ] API endpoints respond correctly

### Performance Baseline

```bash
# Record baseline metrics
docker stats --no-stream otea-server
# CPU, Memory, Network I/O

# Monitor for 24 hours
# Check for resource leaks or stability issues
```

---

## 📊 Monitoring & Maintenance

### Regular Health Checks

```bash
# Add to crontab (check every hour)
0 * * * * docker exec otea-server curl -s http://localhost:3000/api/servers-status > /dev/null && echo "OK" || echo "FAILED"
```

### Log Rotation

```bash
# Docker logs auto-rotation (recommended)
echo '{
  "max-size": "10m",
  "max-file": "3"
}' | sudo tee /etc/docker/daemon.json

sudo systemctl restart docker
```

### Backup Strategy

```bash
# Daily backup of OTEA data
0 2 * * * docker exec otea-server tar -czf /app/data/backup-$(date +\%Y\%m\%d).tar.gz /app/data/*.json

# Weekly backup to external storage
0 3 * * 0 rsync -av /var/lib/docker/volumes/otea-data/_data/ /backup/otea-weekly/
```

---

## 🔙 Rollback Plan

**If issues occur, rollback takes 2-5 minutes:**

### Scenario 1: OTEA Container won't start

```bash
# Stop and remove container
docker-compose down

# Restore from backup
# (Data in volumes is persistent)

# Fix issues in .env.prod or docker-compose.yml

# Restart
docker-compose up -d
```

### Scenario 2: Nginx configuration broken

```bash
# Reload broken config
sudo nginx -t  # Should report error

# Restore backup
sudo cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf

# Restart Nginx
sudo systemctl restart nginx

# Check if working
curl -I https://domain.com/otea

# Website still works (OTEA route removed)
```

### Scenario 3: SSL certificate issues

```bash
# Nginx will reject requests with self-signed cert
# Revert to HTTP (temporary)

# Or restore previous cert backup
sudo cp /etc/letsencrypt/live/domain.com/fullchain.pem.backup /etc/letsencrypt/live/domain.com/fullchain.pem

# Reload Nginx
sudo systemctl reload nginx
```

---

## 📞 Troubleshooting

### Problem: OTEA won't start

```bash
# Check logs
docker-compose logs otea-server

# Common issues:
# 1. Bad .env.prod (check variable syntax)
# 2. Arma paths wrong (verify with ls)
# 3. Port 3000 already in use (netstat -tulpn | grep 3000)

# Solution:
# Fix .env.prod or paths, then:
docker-compose restart otea-server
```

### Problem: Nginx 502 Bad Gateway

```bash
# OTEA not responding
# Check if container is running
docker ps | grep otea

# If running, check if port 3000 is listening
docker exec otea-server netstat -tulpn | grep 3000

# If not listening, restart
docker-compose restart otea-server
```

### Problem: SSL Certificate warnings

```bash
# Check certificate validity
sudo certbot certificates

# If expired:
sudo certbot renew --force-renewal

# If renewal fails:
# Check certbot logs: /var/log/letsencrypt/letsencrypt.log
```

### Problem: Memory usage too high

```bash
# Check resource usage
docker stats otea-server

# If using >500MB RAM:
# May indicate memory leak or high load
# Check recent logs for errors

# Restart container (clears memory)
docker-compose restart otea-server

# If persists, contact development team with logs
```

---

## 🔐 Security Hardening

### Authentication

- ✅ Change default admin password immediately
- ✅ Set strong password: min 12 chars, mixed case, numbers, symbols

```bash
# Update password in data/users.json
docker exec otea-server nano /app/data/users.json
# Change admin password, restart
docker-compose restart otea-server
```

### Network Security

- ✅ Nginx reverse proxy in place (external access only through proxy)
- ✅ Internal port 3000 not exposed to internet
- ✅ HTTPS/TLS enforced by Nginx
- ✅ HSTS headers configured in Nginx

### Access Control

- ✅ HTTP Basic Auth on admin panel
- ✅ Audit logging enabled (all actions tracked)
- ✅ Session timeout configured

### Data Protection

- ✅ Audit logs stored in Docker volume (persistent)
- ✅ Regular backups recommended
- ✅ No secrets in Nginx config (loaded from .env.prod)

---

## 📚 Documentation References

From OTEA repository:

- **`docs/INSTALL.md`** - User-level installation guide
- **`docs/FEATURES.md`** - Feature reference
- **`docs/API.md`** - REST API documentation
- **`deployment/SECURITY_PLAN.md`** - Detailed security implementation
- **`deployment/CHECKLIST.md`** - Pre-launch verification
- **`deployment/nginx.conf`** - Nginx template configuration
- **`README.md`** - Project overview

---

## 📞 Support & Escalation

### For Issues

1. Check **Troubleshooting** section above
2. Review OTEA logs: `docker-compose logs -f`
3. Check Nginx logs: `/var/log/nginx/error.log`
4. Review deployment checklist

### For Development Questions

- GitHub Issues: https://github.com/your-username/OTEA-server/issues
- Documentation: See references above

### Escalation Path

1. **Level 1:** Check logs and troubleshooting guide
2. **Level 2:** Review SECURITY_PLAN.md and CHECKLIST.md
3. **Level 3:** Contact project maintainer with logs and configuration
4. **Level 4:** Rollback using plan above, investigate separately

---

## 📋 Sign-Off Checklist

After deployment, confirm:

- [ ] OTEA container running and healthy
- [ ] Nginx reverse proxy forwarding traffic correctly
- [ ] HTTPS working with valid certificate
- [ ] Login functional with admin credentials
- [ ] Audit logs recording events
- [ ] Arma Reforger API accessible
- [ ] Website still functioning normally
- [ ] Monitoring and backups configured
- [ ] Rollback plan documented and tested
- [ ] Team notified of deployment

---

## 📝 Change Log

| Date | Deployer | Status | Notes |
|------|----------|--------|-------|
| YYYY-MM-DD | Name | ✅ Success | Initial deployment |
| | | | |

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-05  
**Prepared for:** IT Operations Team
