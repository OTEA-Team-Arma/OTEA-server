# 🔧 Environment Configuration Guide

**Document:** Configuration des variables d'environnement pour OTEA-server  
**Version:** v2.2+

---

## 📋 Quick Start

```bash
# 1. Copy template
cp .env.example .env

# 2. Edit values to your setup
nano .env

# 3. Start server
npm start
```

Server lira automatiquement `.env` au démarrage. ✅

---

## 📝 Variables Disponibles

### Node Environment

```
NODE_ENV=development
```
- **development** (défaut): Logs verbose, pas de warnings sécurité
- **production**: Minimal logs, warnings pour sécurité

### OTEA Admin Panel

```
OTEA_PORT=3000
OTEA_HOST=localhost
```

**OTEA_HOST Options:**

| Valeur | Usage | Sécurité |
|--------|-------|----------|
| `localhost` | Local access only | ✅ Safe |
| `127.0.0.1` | Local access only | ✅ Safe |
| `0.0.0.0` | All interfaces | ⚠️ Exposed! |
| `192.168.1.100` | Specific interface | 🟡 Network only |

**Recommendation:**
- Local dev: `OTEA_HOST=localhost`
- Network intern: `OTEA_HOST=0.0.0.0` + firewall rules
- Internet prod: `OTEA_HOST=localhost` + Nginx reverse proxy

### Arma Server

```
ARMA_SERVER_ROOT=C:\Arma3DS
```

Path to Arma Reforger server installation.

**Windows examples:**
```
C:\Arma3DS
D:\GameServers\ArmaReforger
```

**Linux examples:**
```
/home/arma/server
/opt/arma-reforger
```

### SteamCMD (Optional)

```
STEAMCMD_PATH=C:\SteamCMD\steamcmd.exe
```

Enable auto-updates via SteamCMD. Leave empty to disable.

**Windows:**
```
C:\SteamCMD\steamcmd.exe
```

**Linux:**
```
/usr/bin/steamcmd
/usr/games/steamcmd
/home/arma/.local/share/SteamCMD/steamcmd.sh
```

### Authentication

```
AUTH_PASSWORD=ChangeMe123!
```

Admin panel password. **Change in production!**

**Requirements:**
- Minimum 8 characters
- In production: Use 20+ chars with mix of uppercase, numbers, special chars

**Example strong password:**
```
Arma2024!Reforger#Server@Admin
```

### Logging

```
LOG_LEVEL=info
```

**Levels:**
- `error` - Only errors (production recommended)
- `warn` - Errors + warnings
- `info` - General info (default)
- `debug` - Verbose logging (dev only)

---

## 🔒 Security Best Practices

### 1. Never Commit `.env`
```bash
# Bad ❌
git add .env
git commit -m "add config"

# Good ✅
git add .env.example
# .env is in .gitignore
```

### 2. Production Checklist

```bash
# ✅ Use strong password
AUTH_PASSWORD=SecureRandom123!

# ✅ Use localhost
OTEA_HOST=localhost

# ✅ Behind reverse proxy
# Let Nginx handle HTTPS

# ✅ Minimal logs in production
LOG_LEVEL=warn

# ✅ NODE_ENV set to production
NODE_ENV=production
```

### 3. Different configs per environment

```bash
# Development
.env.development

# Staging
.env.staging

# Production
.env.production
```

Load with:
```bash
NODE_ENV=production npm start
```

---

## 📌 Examples

### Example 1: Local Development

```bash
# .env
NODE_ENV=development
OTEA_PORT=3000
OTEA_HOST=localhost
ARMA_SERVER_ROOT=C:\Arma3DS
STEAMCMD_PATH=C:\SteamCMD\steamcmd.exe
AUTH_PASSWORD=admin1234
LOG_LEVEL=debug
```

### Example 2: Network Internal (Windows)

```bash
# .env
NODE_ENV=development
OTEA_PORT=3000
OTEA_HOST=0.0.0.0
ARMA_SERVER_ROOT=C:\Arma3DS
STEAMCMD_PATH=C:\SteamCMD\steamcmd.exe
AUTH_PASSWORD=NetworkAdmin2024!
LOG_LEVEL=info
```

### Example 3: Production on VPS (Linux)

```bash
# .env (kept safe in /opt/otea/)
NODE_ENV=production
OTEA_PORT=3000
OTEA_HOST=127.0.0.1
ARMA_SERVER_ROOT=/home/arma/server
STEAMCMD_PATH=/usr/games/steamcmd
AUTH_PASSWORD=VerySecurePassword123!@#
LOG_LEVEL=warn
```

Access via Nginx reverse proxy:
```
https://admin.my-server.com → localhost:3000 (HTTPS added by Nginx)
```

---

## ⚠️ Common Issues

### "Server won't start - missing ARMA_SERVER_ROOT"

**Check:**
```bash
ls -la /your/arma/path
# Should contain: ArmaReforgerServer (binary)
```

**Fix:**
```bash
# Update .env
ARMA_SERVER_ROOT=/actual/correct/path
```

### "Can't connect to OTEA from network"

**Reason:** Probably `OTEA_HOST=localhost` (only local)

**Fix:**
```bash
# .env
OTEA_HOST=0.0.0.0
```

Then access: `http://192.168.1.100:3000`

**But:** Add firewall rules! Unsafe if exposed.

### "Strong password not working"

**Try:**
```bash
# Escrap special chars or quote
AUTH_PASSWORD="MyPassword!@#2024"
```

---

## 🔄 Updating .env After Release

When code updates include new env variables, `.env.example` updates but your `.env` stays the same.

**Steps:**
```bash
# Check new variables
diff .env .env.example

# Add missing ones to .env
# Keep your custom values!
```

---

## 📚 Related

- [docs/SECURITY_PORT_3000.md](SECURITY_PORT_3000.md) - Port exposure & reverse proxy
- [docs/INSTALL.md](INSTALL.md) - Installation steps
- [README.md](../README.md) - Project overview
