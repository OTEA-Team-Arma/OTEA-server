# API Documentation - OTEA-Server v2.3

**Status:** Production Ready ✅  
**Version:** 2.3.0  
**Architecture:** MVC (Models-Views-Controllers)  
**Total Endpoints:** 39  

---

## Summary

This document describes all 39 REST API endpoints available in OTEA-Server v2.3.

**Quick Links:**
- [Authentication](#-authentication)
- [Health Endpoints](#-health-endpoints) (2 endpoints)
- [Servers Endpoints](#-servers-endpoints) (8 endpoints)
- [Updates Endpoints](#-updates-endpoints) (4 endpoints)
- [Admin Endpoints](#-admin-endpoints) (7 endpoints)
- [Presets Endpoints](#-presets-endpoints) (10 endpoints)
- [Logs Endpoints](#-logs-endpoints) (8 endpoints)

---

## 📡 Authentication

**Method:** HTTP Basic Auth  
**Required Header:** `Authorization: Basic base64(username:password)`  
**Default Credentials:** `username: admin` | `password: admin1234`

```bash
curl -u admin:admin1234 http://localhost:3000/api/servers
```

---

## 🏥 Health Endpoints

**Base URL:** `/api`

### GET /api/health
Public health check (no auth required)

### GET /api/info  
Public server info (no auth required)

---

## 🎮 Servers Endpoints

**Base URL:** `/api/servers` (8 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | / | List all running servers |
| GET | /health | Health check |
| GET | /:port | Get server status |
| GET | /info/:port | Get detailed info |
| POST | / | Start new server |
| POST | /:port/restart | Restart server |
| PUT | /:port/config | Update config |
| DELETE | /:port | Stop server |

---

## 🔄 Updates Endpoints

**Base URL:** `/api/updates` (4 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | /check | Check for updates |
| GET | /status | Get update status |
| POST | /trigger | Trigger new update |
| POST | /verify | Verify update success |

---

## 🔑 Admin Endpoints

**Base URL:** `/api/admin` (7 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | System health |
| GET | /system-info | System resources |
| GET | /servers-summary | Server summary |
| POST | /restart-server/:port | Restart one |
| POST | /restart-all | Restart all |
| POST | /stop-all | Stop all |
| POST | /backup-config | Backup config |
| POST | /cleanup-orphans | Clean processes |
| POST | /recycle | Full recycle |

---

## 📋 Presets Endpoints

**Base URL:** `/api/presets` (10 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | / | List presets |
| GET | /stats | Statistics |
| GET | /template | Default template |
| GET | /search | Search presets |
| GET | /:id | Load preset |
| GET | /:id/export | Export JSON |
| POST | / | Save preset |
| POST | /import | Import preset |
| POST | /:sourceId/duplicate/:destId | Duplicate |
| DELETE | /:id | Delete preset |

---

## 📊 Logs Endpoints

**Base URL:** `/api/logs` (8 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | / | Get logs |
| GET | /status | Log status |
| GET | /search | Search logs |
| GET | /user/:username | By user |
| GET | /action/:action | By action |
| GET | /export | Export logs |
| POST | /cleanup | Cleanup old logs |
| POST | /clear | ⚠️ Clear all |

---

## 📈 Response Format

**Success:**
```json
{
  "success": true,
  "data": {...},
  "message": "Description"
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description",
    "details": "Optional"
  }
}
```

---

## 🔐 Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Server Error |
| 503 | Unavailable |

---

## 🚀 Quick Examples

```bash
# Check health
curl -u admin:admin1234 http://localhost:3000/api/servers/health

# List servers
curl -u admin:admin1234 http://localhost:3000/api/servers

# Start server
curl -u admin:admin1234 -X POST http://localhost:3000/api/servers \
  -H "Content-Type: application/json" \
  -d '{"port": 2301, "config": {"name": "Server"}}'

# Get system info
curl -u admin:admin1234 http://localhost:3000/api/admin/system-info

# Check updates
curl -u admin:admin1234 http://localhost:3000/api/updates/check
```

---

**Last Updated:** 7 avril 2026  
**Version:** 2.3.0
