# Frequently Asked Questions (FAQ)

Common questions and troubleshooting for OTEA-Server v2.4.

---

## 📋 Table of Contents

1. [Installation & Deployment](#installation--deployment)
2. [Server Management](#server-management)
3. [Configuration](#configuration)
4. [User & Authentication](#user--authentication)
5. [Troubleshooting](#troubleshooting)
6. [Security](#security)
7. [Performance](#performance)

---

## Installation & Deployment

### Q: What are the minimum requirements?

**A:** 
- **OS:** Windows 10+ or modern Linux distro
- **Node.js:** 18.x LTS
- **RAM:** 512 MB minimum (2GB+ recommended)
- **Docker:** (for Docker deployment)

### Q: Should I use Docker or direct Node.js?

**A:** **Docker is recommended** because:
- ✅ Isolation from system
- ✅ Easy multi-instance
- ✅ Simple updates/rollbacks
- ✅ Cross-platform compatibility
- ✅ Production-ready

See `INSTALLATION/DOCKER.md` for setup.

### Q: How do I deploy on Windows Server?

**A:** See `INSTALLATION/WINDOWS.md` for complete guide including:
- Node.js installation
- PM2 or NSSM service setup
- Auto-restart configuration

### Q: How do I deploy on Linux?

**A:** See `INSTALLATION/LINUX.md` for:
- Node.js installation
- Systemd service setup
- Auto-start configuration

### Q: Can I run on a VPS or dedicated server?

**A:** **Yes!** Docker is ideal for VPS because:
- ✅ No system dependencies
- ✅ Portable across providers
- ✅ Easy scaling

### Q: How do I update the application?

**A:** 
```bash
git pull origin main
npm install
# Restart
docker-compose restart  # Docker
# OR
pm2 restart OTEA-Server  # PM2
# OR
systemctl restart otea-server  # Linux systemd
```

---

## Server Management

### Q: How do I start/stop servers?

**A:** Three methods:

1. **Web UI:** Click buttons on dashboard
2. **API:** 
   ```bash
   POST /api/servers/:id/restart
   POST /api/servers/:id/stop
   ```
3. **Direct:** `npm start`

### Q: Can I run multiple server instances?

**A:** **Yes!** OTEA supports multi-instance:
- Create multiple servers with different ports
- Each has independent configuration
- All managed from one admin panel

### Q: How do I manage players?

**A:** 
- **View:** GET `/api/servers/:id/players`
- **Ban:** POST `/api/servers/:id/ban`
- **Unban:** DELETE `/api/servers/:id/bans/:banId`
- **Kick:** Server-specific API call

---

## Configuration

### Q: How do I change the API port?

**A:** Edit `.env`:
```env
PORT=3001  # Change from 3000
```
Then restart the application.

### Q: Can I access OTEA from the internet?

**A:** ⚠️ **READ THIS FIRST:** [Security Considerations](#security)

For internet access:
1. ✅ Use HTTPS (reverse proxy with SSL)
2. ✅ Do NOT expose port 3000 directly
3. ✅ Use strong passwords (20+ chars)
4. ✅ Enable firewall rules
5. ✅ Setup rate limiting

Example with Nginx: See `deployment/nginx.conf`

### Q: How do I configure databases?

**A:** OTEA uses SQLite by default. To change:
1. Edit `.env` `DB_PATH` variable
2. Ensure directory has write permissions
3. Database auto-initializes on first run

### Q: How do I configure email notifications?

**A:** Currently not implemented. Track GitHub issues for feature updates.

---

## User & Authentication

### Q: How do I change admin password?

**A:** 
1. Login with admin credentials
2. Click user profile → Change Password
3. Enter old password + new password
4. Confirm change

### Q: How do I invite users?

**A:** As admin:
1. Go to Users section
2. Click "Create User"
3. Enter username, email, role
4. User receives temporary password (or set one)
5. User logs in and must change password

### Q: What do the user roles do?

**A:**
- **admin:** Full access to everything
- **game_master:** Can create/manage own servers only
- **viewer:** Read-only access to everything

### Q: How do I reset a user password?

**A:** As admin:
1. Go to Users section
2. Select user
3. Click "Reset Password"
4. User will receive new temporary password

### Q: How do I handle expired tokens?

**A:** Tokens auto-refresh with `refreshToken`. If issues:
1. Clear browser localStorage
2. Logout and login again
3. Token valid for 24 hours

---

## Troubleshooting

### Port 3000 already in use?

**A:**
```bash
# Find what's using port 3000
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# Change port in .env
PORT=3001
```

### Application won't start?

**A:** Check:
1. Is Node.js installed? `node -v`
2. Did you run `npm install`?
3. Are dependencies installed? `npm ls`
4. Check logs for errors
5. Verify `.env` file exists

### Database corruption?

**A:**
```bash
# Backup old database
mv data/app.db data/app.db.backup

# Delete current (will be recreated)
rm data/app.db

# Restart
npm start
```

### Logs not showing?

**A:**
```bash
# Docker
docker logs -f otea-backend

# PM2
pm2 logs OTEA-Server

# Systemd
journalctl -u otea-server -f

# Direct
npm start  # Logs in console
```

### Can't login?

**A:** Check:
1. Is backend running? `curl http://localhost:3000/api/health`
2. Are credentials correct? (default: admin/admin1234)
3. Is user enabled? Check users table
4. Check browser console for errors
5. Clear localStorage and try again

### CORS errors?

**A:** Check:
1. Frontend URL in `.env` `CORS_ORIGIN`
2. Verify domain matches exactly
3. Check browser console for details
4. If local: should be `http://localhost:3000`

---

## Security

### Q: How do I secure OTEA for internet access?

**A:** ⚠️ **CRITICAL - READ:** `../DEPLOYMENT/SECURITY_PLAN.md`

Key steps:
1. ✅ Enable HTTPS (SSL/TLS)
2. ✅ Use reverse proxy (Nginx)
3. ✅ Strong passwords (20+ chars)
4. ✅ JWT_SECRET very long (32+ chars)
5. ✅ Firewall rules
6. ✅ Rate limiting (enabled by default)
7. ✅ Audit logs monitoring

### Q: What's the default JWT secret?

**A:** Should be set in `.env`:
```env
JWT_SECRET=your-very-long-secret-key-minimum-32-characters
```

If not set, defaults to development value. **CHANGE IN PRODUCTION!**

### Q: Can I disable SSL/HTTPS for local testing?

**A:** **Yes, only for LOCAL testing!**
- Local network: HTTP is fine if firewalled
- Internet-facing: HTTPS is REQUIRED
- Default setup: HTTP on port 3000

### Q: How do I report security vulnerabilities?

**A:** 
- **Do NOT post publicly**
- Contact maintainers privately
- Include: description, reproduction steps, impact
- Allow 30 days for patch before disclosure

---

## Performance

### Q: Application is slow?

**A:** Check:
1. **CPU:** `top` (Linux) or Task Manager (Windows)
2. **Memory:** Is RAM full?
3. **Disk:** Is disk full? Check `df -h`
4. **Database:** Run `VACUUM` on SQLite
5. **Network:** Check latency/bandwidth

### Q: How many servers can I manage?

**A:** No hard limit. Depends on:
- Available memory (each server ≈ 100-200MB)
- CPU cores (can run 2-4x cores)
- Database size (SQLite best <1GB)

Recommended: 5-10 instances on typical VPS.

### Q: How do I optimize database?

**A:**
```bash
# Compact database
sqlite3 data/app.db "VACUUM;"

# Check size
ls -lh data/app.db

# Archive old logs
# Manually via admin panel
```

### Q: Can I backup data?

**A:**
```bash
# Manual backup
cp data/app.db data/app.db.backup

# Or via API
POST /api/admin/backup

# Restore
POST /api/admin/restore
```

---

## 📞 Still Have Questions?

1. **Check documentation:** `../README.md`
2. **Review deployment guide:** `../DEPLOYMENT/DEPLOYMENT_GUIDE.md`
3. **Security questions:** `../DEPLOYMENT/SECURITY_PLAN.md`
4. **API help:** `./API.md`
5. **Features:** `./FEATURES.md`

---

**Last Updated:** 9 avril 2026  
**Version:** 2.4.0
