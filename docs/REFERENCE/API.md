# API Documentation - OTEA-Server v2.4

**Status:** Production Ready ✅  
**Version:** 2.4.0  
**Total Endpoints:** 43  
**Authentication:** JWT Token-based  

---

## Summary

This document describes all 43 REST API endpoints available in OTEA-Server v2.4.

**Quick Links:**
- [Authentication](#-authentication-6-endpoints)
- [User Management](#-user-management-8-endpoints)
- [Server Management](#-server-management-15-endpoints)
- [Admin Operations](#-admin-operations-8-endpoints)
- [System Endpoints](#-system-endpoints-3-endpoints)
- [Response Format](#-response-format)
- [Status Codes](#-status-codes)
- [Examples](#-examples)

---

## 🔐 Authentication (6 endpoints)

**Method:** JWT Token in Authorization header  
**Required Header:** `Authorization: Bearer <token>`  

### POST /api/auth/login
Login with credentials
```json
{
  "username": "admin",
  "password": "admin1234"
}
```
Response: `{ token, refreshToken, expiresIn }`

### POST /api/auth/register
Register new user (admin only)
```json
{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com",
  "role": "viewer"
}
```

### GET /api/auth/me
Get current authenticated user

### POST /api/auth/change-password
Change user password (requires old password)

### POST /api/auth/refresh-token
Refresh JWT token

### POST /api/auth/verify-token
Verify if token is valid

---

## 👥 User Management (8 endpoints)

### GET /api/users
List all users (paginated)
**Query params:** `?page=1&limit=20&role=admin`

### GET /api/users/:id
Get specific user details

### POST /api/users
Create new user (admin only)
```json
{
  "username": "user",
  "email": "user@example.com",
  "role": "viewer"
}
```

### PATCH /api/users/:id
Update user information
```json
{
  "email": "newemail@example.com"
}
```

### DELETE /api/users/:id
Delete user account

### PATCH /api/users/:id/role
Change user role
```json
{
  "role": "game_master"
}
```

### PATCH /api/users/:id/disable
Disable user account

### PATCH /api/users/:id/enable
Enable user account

---

## 🎮 Server Management (15 endpoints)

### GET /api/servers
List all servers (with filters)
**Query params:** `?owner=admin&locked=false`

### GET /api/servers/:id
Get server details

### POST /api/servers
Create new server
```json
{
  "name": "Server1",
  "port": 2302,
  "config": { "maxPlayers": 64 }
}
```

### PATCH /api/servers/:id
Update server configuration

### DELETE /api/servers/:id
Delete server

### POST /api/servers/:id/lock
Lock server (prevent changes)

### POST /api/servers/:id/unlock
Unlock server

### GET /api/servers/:id/players
Get connected players list

### POST /api/servers/:id/restart
Restart server

### POST /api/servers/:id/stop
Stop server

### GET /api/servers/:id/config
Get server configuration

### PATCH /api/servers/:id/config
Update server configuration

### POST /api/servers/:id/ban
Ban player from server
```json
{
  "playerId": "player123",
  "reason": "Griefing",
  "duration": "permanent"
}
```

### GET /api/servers/:id/bans
List server bans

### DELETE /api/servers/:id/bans/:banId
Remove player ban

---

## ⚙️ Admin Operations (8 endpoints)

### POST /api/admin/restart-all
Restart all servers

### POST /api/admin/stop-all
Stop all servers

### GET /api/admin/system-info
Get system information

### GET /api/admin/audit-logs
Get audit logs (all operations)

### GET /api/admin/health
Get system health status

### POST /api/admin/backup
Create database backup

### POST /api/admin/restore
Restore from backup

### GET /api/admin/stats
Get system statistics

---

## 🌐 System Endpoints (3 endpoints)

### GET /api/health
Health check (no auth required)
Response: `{ status: "ok", uptime, version }`

### GET /api/info
Server info (no auth required)

### GET /api/version
API version (no auth required)

---

## 📈 Response Format

**Success (2xx):**
```json
{
  "success": true,
  "data": { ...payload... },
  "message": "Optional description"
}
```

**Error (4xx/5xx):**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description",
    "details": "Optional details"
  }
}
```

---

## 🔍 Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/PATCH/DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid input/validation error |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions (RBAC) |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 500 | Server Error | Internal server error |

---

## 📌 User Roles

### Admin
- Full access to all endpoints
- Can manage all users
- Can manage all servers
- Can perform admin operations

### Game Master
- Can create/manage own servers
- Can manage own servers only
- Can ban players from own servers
- Read-only: system info, health

### Viewer
- Read-only access
- Can view servers
- Can view users (list only)
- Can view audit logs

---

## 🚀 Quick Examples

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin1234"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "expiresIn": 86400
  }
}
```

### List Servers (with token)
```bash
curl -X GET http://localhost:3000/api/servers \
  -H "Authorization: Bearer <your-token>"
```

### Create Server
```bash
curl -X POST http://localhost:3000/api/servers \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Server",
    "port": 2302,
    "config": {"maxPlayers": 64}
  }'
```

### Get Health (no auth)
```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 3600,
    "version": "2.4.0"
  }
}
```

---

## 🔑 Authentication Flow

1. **Login** → POST `/api/auth/login` with credentials
2. **Receive** → `token` (24h expiration) + `refreshToken`
3. **Use** → Include token in all requests: `Authorization: Bearer <token>`
4. **Expired?** → POST `/api/auth/refresh-token` to get new token
5. **Logout** → Client-side only (clear localStorage)

---

## ✅ RBAC (Role-Based Access Control)

Each endpoint enforces role-based access. Example:

| Endpoint | Admin | Game Master | Viewer |
|----------|-------|-------------|--------|
| GET /servers | ✅ | ✅ (own) | ✅ (read-only) |
| POST /servers | ✅ | ✅ (own) | ❌ |
| DELETE /servers/:id | ✅ | ✅ (own) | ❌ |
| GET /users | ✅ | ❌ | ❌ |
| POST /users | ✅ | ❌ | ❌ |
| GET /admin/* | ✅ | ❌ | ❌ |

---

**Last Updated:** 9 avril 2026  
**Version:** 2.4.0  
**Status:** ✅ Production Ready
