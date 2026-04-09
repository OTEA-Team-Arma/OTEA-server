# API Documentation - OTEA-Server v2.4

**Status:** Production Ready ✅  
**Version:** 2.4.0  
**Architecture:** MVC (Models-Views-Controllers) + JWT Authentication  
**Total Endpoints:** 56

---

## Summary

This document describes all 56 REST API endpoints available in OTEA-Server v2.4.

**Quick Links:**
- [Authentication](#-authentication) (4 endpoints)
- [Health & Info](#-health--info) (2 endpoints - public)
- [Server Management](#-server-management) (8 endpoints)
- [Server Logs](#-server-logs) (5 endpoints)
- [Admin Operations](#-admin-operations) (10 endpoints)
- [User Management](#-user-management) (5 endpoints)
- [Presets](#-presets) (10 endpoints)
- [Audit Logs](#-audit-logs) (8 endpoints)
- [Updates](#-updates) (4 endpoints)

---

## � Authentication

**Method:** JWT Bearer Token (v2.4+)  
**Required Header:** `Authorization: Bearer <jwt_token>`  
**Token Expiration:** 24 hours  
**Default Login:** admin / admin1234

### Login Flow

1. **POST /api/auth/login** (public - no auth required)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin1234"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

2. **Use token in subsequent requests**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3000/api/servers
```

---

## 🏥 Health & Info

**Base URL:** `/api` (Public - no auth required)

### GET /api/health
Public health check

**Response:**
```json
{
  "status": "ok",
  "uptime": 12345,
  "version": "2.4.0"
}
```

### GET /api/info
Server information

**Response:**
```json
{
  "name": "OTEA-Server",
  "version": "2.4.0",
  "environment": "production"
}
```

---

## 👤 Authentication Endpoints

**Base URL:** `/api/auth` (4 endpoints - RBAC Protected)

### POST /api/auth/login
Login with credentials (public, no JWT required)

**Body:**
```json
{
  "username": "admin",
  "password": "admin1234"
}
```

### POST /api/auth/register
Create new user (admin only)

**Auth:** Required (Admin)

**Body:**
```json
{
  "username": "newuser",
  "password": "password",
  "role": "game_master",
  "email": "user@example.com"
}
```

### GET /api/auth/me
Get current user info

**Auth:** Required (All roles)

**Response:**
```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "email": "admin@example.com"
}
```

### POST /api/auth/change-password
Change user password

**Auth:** Required (All roles)

**Body:**
```json
{
  "oldPassword": "current",
  "newPassword": "new"
}
```

---

## 🎮 Server Management

**Base URL:** `/api/servers` (8 endpoints - RBAC Protected)

### GET /api/servers
List all running servers

**Auth:** Required (All roles)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "port": 2301,
      "status": "running",
      "players": 15,
      "maxPlayers": 32
    }
  ]
}
```

### GET /api/servers/health
Server health check

**Auth:** Required (All roles)

### GET /api/servers/:port
Get server status by port

**Auth:** Required (All roles)

### GET /api/servers/info/:port
Get detailed server information

**Auth:** Required (All roles)

### POST /api/servers
Start new server

**Auth:** Required (Admin only)

**Body:**
```json
{
  "port": 2301,
  "config": {
    "name": "My Server",
    "maxPlayers": 32,
    "mods": [],
    "mission": "Scenario"
  }
}
```

### POST /api/servers/:port/restart
Restart server by port

**Auth:** Required (Admin)

### PUT /api/servers/:port/config
Update server configuration

**Auth:** Required (Admin)

**Body:**
```json
{
  "name": "Updated Name",
  "maxPlayers": 32
}
```

### DELETE /api/servers/:port
Stop server

**Auth:** Required (Admin)

---

## 📋 Server Logs

**Base URL:** `/api/servers/:port/logs` (5 endpoints - RBAC Protected)

### GET /api/servers/:port/logs/filters
Get available log filters

**Auth:** Required (All roles)

### GET /api/servers/:port/logs/stream
Stream server logs in real-time

**Auth:** Required (All roles)

### GET /api/servers/:port/logs/stats
Get log statistics

**Auth:** Required (All roles)

### GET /api/servers/:port/logs
Get server logs

**Auth:** Required (All roles)

**Query Parameters:**
- `limit` - Number of logs (default: 100)
- `offset` - Pagination offset
- `level` - Filter by level (ERROR, WARNING, INFO, DEBUG)

### DELETE /api/servers/:port/logs
Clear server logs

**Auth:** Required (Admin)

---

## 🔑 Admin Operations

**Base URL:** `/api/admin` (10 endpoints - Admin Only)

### GET /api/admin/health
System health check

**Auth:** Required (Admin)

### GET /api/admin/system-info
Get system resources

**Auth:** Required (Admin)

**Response:**
```json
{
  "cpu": 45.2,
  "memory": 8192,
  "memoryUsed": 4096,
  "disk": 209715.2,
  "diskFree": 104857.6
}
```

### GET /api/admin/arma-version
Get Arma server version

**Auth:** Required (Admin)

### GET /api/admin/servers-summary
Get summary of all servers

**Auth:** Required (Admin)

### POST /api/admin/restart-server/:port
Restart specific server

**Auth:** Required (Admin)

### POST /api/admin/restart-all
Restart all servers

**Auth:** Required (Admin)

### POST /api/admin/stop-all
Stop all servers

**Auth:** Required (Admin)

### POST /api/admin/backup-config
Backup configuration

**Auth:** Required (Admin)

### POST /api/admin/cleanup-orphans
Clean orphaned processes

**Auth:** Required (Admin)

### POST /api/admin/recycle
Full OTEA recycle (stop & restart)

**Auth:** Required (Admin)

---

## 👥 User Management

**Base URL:** `/api/admin/users` (5 endpoints - Admin Only)

### GET /api/admin/users
List all users

**Auth:** Required (Admin)

**Query Parameters:**
- `search` - Search by username
- `role` - Filter by role (admin, game_master, viewer)
- `is_active` - Filter by status (true/false)

### GET /api/admin/users/:id
Get user details

**Auth:** Required (Admin)

### DELETE /api/admin/users/:id
Delete user

**Auth:** Required (Admin)

### PATCH /api/admin/users/:id/role
Change user role

**Auth:** Required (Admin)

**Body:**
```json
{
  "role": "game_master"
}
```

### PATCH /api/admin/users/:id/status
Enable/disable user

**Auth:** Required (Admin)

**Body:**
```json
{
  "is_active": true
}
```

---

## 📦 Presets

**Base URL:** `/api/presets` (10 endpoints - RBAC Protected)

### GET /api/presets
List all presets

**Auth:** Required (All roles)

### GET /api/presets/stats
Get preset statistics

**Auth:** Required (All roles)

### GET /api/presets/template
Get template

**Auth:** Required (All roles)

### GET /api/presets/search
Search presets

**Auth:** Required (All roles)

**Query Parameters:**
- `q` - Search query
- `limit` - Results limit

### GET /api/presets/:id
Load preset by ID

**Auth:** Required (All roles)

### GET /api/presets/:id/export
Export preset as JSON

**Auth:** Required (All roles)

### POST /api/presets
Save preset

**Auth:** Required (Admin, GameMaster)

**Body:**
```json
{
  "title": "My Preset",
  "port": 2301,
  "game": {
    "name": "Server Name",
    "maxPlayers": 32,
    "scenarioId": "{GUID}",
    "mods": []
  }
}
```

### POST /api/presets/import
Import preset from JSON

**Auth:** Required (Admin)

### POST /api/presets/:sourceId/duplicate/:destId
Duplicate preset

**Auth:** Required (Admin, GameMaster)

### DELETE /api/presets/:id
Delete preset

**Auth:** Required (Admin)

---

## 📊 Audit Logs

**Base URL:** `/api/logs` (8 endpoints - RBAC Protected)

### GET /api/logs
Get all audit logs

**Auth:** Required (Admin)

**Query Parameters:**
- `user` - Filter by user
- `action` - Filter by action type
- `start_date` - Start date
- `end_date` - End date
- `limit` - Results limit

### GET /api/logs/status
Get log status

**Auth:** Required (Admin)

### GET /api/logs/search
Search audit logs

**Auth:** Required (Admin)

**Query Parameters:**
- `q` - Search query

### GET /api/logs/user/:username
Get logs by user

**Auth:** Required (Admin)

### GET /api/logs/action/:action
Get logs by action

**Auth:** Required (Admin)

### GET /api/logs/export
Export logs as CSV/JSON

**Auth:** Required (Admin)

**Query Parameters:**
- `format` - Export format (csv, json)

### POST /api/logs/cleanup
Cleanup old logs (older than 90 days)

**Auth:** Required (Admin)

### POST /api/logs/clear
⚠️ Clear all audit logs

**Auth:** Required (Admin)

---

## 🔄 Updates

**Base URL:** `/api/updates` (4 endpoints - RBAC Protected)

### GET /api/updates/check
Check for Arma updates

**Auth:** Required (Admin)

**Response:**
```json
{
  "success": true,
  "data": {
    "hasUpdate": true,
    "currentVersion": "1.0.5",
    "latestVersion": "1.0.6"
  }
}
```

### GET /api/updates/status
Get update status

**Auth:** Required (Admin)

### POST /api/updates/trigger
Trigger update process

**Auth:** Required (Admin)

### POST /api/updates/verify
Verify update success

**Auth:** Required (Admin)

---

## 📈 Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    "key": "value"
  },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Request validation failed",
    "details": "Optional additional info"
  }
}
```

---

## 🔐 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Auth required or token invalid |
| 403 | Forbidden - Permission denied (insufficient role) |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict |
| 500 | Server Error - Internal error |
| 503 | Unavailable - Service unavailable |

---

## 🛡️ RBAC (Role-Based Access Control)

**Available Roles:**

| Role | Permissions |
|------|------------|
| **admin** | All endpoints |
| **game_master** | Read servers, manage presets, view logs |
| **viewer** | Read-only access to servers and logs |

---

## 🚀 Quick Start Examples

```bash
# 1. Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin1234"}' \
  | jq -r '.data.token')

# 2. List servers
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/servers

# 3. Get system info
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/system-info

# 4. Save preset
curl -X POST http://localhost:3000/api/presets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tournament Server",
    "port": 2301,
    "game": {"name": "Tournament", "maxPlayers": 32}
  }'

# 5. Get audit logs
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/logs?user=admin&limit=50"
```

---

## 🔗 Related Documentation

- [SECURITY_PLAN.md](DEPLOYMENT/SECURITY_PLAN.md) - Security hardening
- [ADMIN_DEPLOYMENT.md](DEPLOYMENT/ADMIN_DEPLOYMENT.md) - Admin operations
- [FAQ.md](FAQ.md) - Common questions
- [FEATURES.md](FEATURES.md) - Feature breakdown

---

**Last Updated:** 9 avril 2026  
**Version:** 2.4.0  
**API Status:** ✅ Production Ready
