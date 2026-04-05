# API Reference - OTEA Server Manager

Complete REST API documentation for OTEA Server Manager. All requests are authenticated with HTTP Basic Auth.

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Base URL](#base-url)
3. [Response Format](#response-format)
4. [Server Management](#server-management)
5. [Configuration](#configuration)
6. [Player Management](#player-management)
7. [Status & Monitoring](#status--monitoring)
8. [Error Handling](#error-handling)

---

## Authentication

All API endpoints require HTTP Basic Authentication.

### Header Format
```
Authorization: Basic base64(username:password)
```

### Example Using curl
```bash
curl -u admin:password123 http://localhost:3000/api/servers-status
```

### Example Using JavaScript
```javascript
const auth = btoa('admin:password123');
fetch('/api/servers-status', {
  headers: {
    'Authorization': `Basic ${auth}`
  }
});
```

---

## Base URL

```
http://localhost:3000/api/
```

For production:
```
https://yourdomain.com/api/
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error description",
  "statusCode": 400
}
```

### Pagination (where applicable)

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

---

## Server Management

### Launch Server

**Endpoint:** `POST /api/launch`

Starts a new server instance with the active configuration.

```bash
curl -X POST -u admin:password123 \
  http://localhost:3000/api/launch
```

**Response:**
```json
{
  "success": true,
  "data": {
    "instanceId": "instance-1",
    "port": 2302,
    "pid": 12345,
    "status": "starting"
  },
  "message": "Server launching..."
}
```

**Status Codes:**
- `200` - Server started successfully
- `400` - Configuration invalid
- `409` - Server already running
- `500` - Launch failed

---

### Stop Server

**Endpoint:** `POST /api/stop`

Gracefully stops the running server instance.

```bash
curl -X POST -u admin:password123 \
  http://localhost:3000/api/stop \
  -H "Content-Type: application/json" \
  -d '{"instanceId": "instance-1"}'
```

**Request Body:**
```json
{
  "instanceId": "instance-1",     // Optional, uses current if omitted
  "force": false                  // Optional, force kill if true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "instanceId": "instance-1",
    "status": "stopped"
  },
  "message": "Server stopped"
}
```

---

### Restart Server

**Endpoint:** `POST /api/restart`

Restart server instance (stop & start).

```bash
curl -X POST -u admin:password123 \
  http://localhost:3000/api/restart
```

**Response:**
```json
{
  "success": true,
  "data": {
    "instanceId": "instance-1",
    "status": "restarting"
  }
}
```

---

### Server Status

**Endpoint:** `GET /api/servers-status`

Get status of all server instances.

```bash
curl -u admin:password123 \
  http://localhost:3000/api/servers-status
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "instanceId": "instance-1",
      "port": 2302,
      "status": "running",
      "players": 32,
      "maxPlayers": 64,
      "memory": "1.2 GB",
      "cpu": "18%",
      "uptime": "5d 3h 24m",
      "pid": 12345
    },
    {
      "instanceId": "instance-2",
      "port": 2303,
      "status": "stopped",
      "players": 0,
      "maxPlayers": 64,
      "memory": "0 MB",
      "cpu": "0%",
      "uptime": "0",
      "pid": null
    }
  ]
}
```

---

## Configuration

### Get Configuration

**Endpoint:** `GET /api/config`

Retrieve current server configuration.

```bash
curl -u admin:password123 \
  http://localhost:3000/api/config
```

**Response:**
```json
{
  "success": true,
  "data": {
    "serverRootPath": "/home/arma/server",
    "steamCmdPath": "/home/arma/steamcmd",
    "backendLog": true,
    "maxInstances": 5
  }
}
```

---

### Update Configuration

**Endpoint:** `POST /api/config`

Update server configuration.

```bash
curl -X POST -u admin:password123 \
  http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "serverRootPath": "/new/path",
    "maxInstances": 8
  }'
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Configuration updated"
}
```

---

### List Presets

**Endpoint:** `GET /api/presets`

Get all saved configuration presets.

```bash
curl -u admin:password123 \
  http://localhost:3000/api/presets
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "preset-1",
      "name": "EU-Standard-64p",
      "description": "Standard EU server config",
      "serverName": "GameMaster EU",
      "maxPlayers": 64,
      "region": "EU"
    }
  ]
}
```

---

### Save Preset

**Endpoint:** `POST /api/presets`

Create new configuration preset.

```bash
curl -X POST -u admin:password123 \
  http://localhost:3000/api/presets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My-Config",
    "description": "My server configuration",
    "serverName": "My Server",
    "maxPlayers": 32,
    "difficulty": { "damage": 1, "friendlyFire": true }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "preset-new-1",
    "name": "My-Config",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Load Preset

**Endpoint:** `POST /api/presets/:id/apply`

Load preset configuration to active server.

```bash
curl -X POST -u admin:password123 \
  http://localhost:3000/api/presets/preset-1/apply
```

**Response:**
```json
{
  "success": true,
  "message": "Preset applied successfully"
}
```

---

### Delete Preset

**Endpoint:** `DELETE /api/presets/:id`

Remove preset configuration.

```bash
curl -X DELETE -u admin:password123 \
  http://localhost:3000/api/presets/preset-1
```

---

## Player Management

### List Connected Players

**Endpoint:** `GET /api/players/list`

Get all players connected to active server.

```bash
curl -u admin:password123 \
  http://localhost:3000/api/players/list
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "playerId": "user123",
      "username": "PlayerName",
      "joinTime": "2024-01-15T10:30:00Z",
      "ipAddress": "192.168.1.100",
      "score": 1250,
      "kills": 5,
      "deaths": 2,
      "status": "alive"
    }
  ]
}
```

---

### Kick Player

**Endpoint:** `POST /api/players/kick`

Remove player from server (can rejoin).

```bash
curl -X POST -u admin:password123 \
  http://localhost:3000/api/players/kick \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "user123",
    "reason": "Griefing"
  }'
```

**Request Body:**
```json
{
  "playerId": "user123",      // Player ID (required)
  "reason": "Griefing"        // Reason (optional)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Player kicked successfully"
}
```

---

### Ban Player

**Endpoint:** `POST /api/players/ban`

Ban player from server.

```bash
curl -X POST -u admin:password123 \
  http://localhost:3000/api/players/ban \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "user123",
    "reason": "Cheating",
    "duration": "permanent"
  }'
```

**Request Body:**
```json
{
  "playerId": "user123",          // Player ID (required)
  "playerName": "PlayerName",     // Player name (optional)
  "reason": "Cheating",           // Reason (required)
  "duration": "permanent",        // "permanent" or duration in hours
  "durationHours": 24             // Used if duration is number
}
```

**Duration Examples:**
- `"permanent"` - Permanent ban
- `1` - 1 hour ban
- `24` - 24 hour (1 day) ban
- `168` - 1 week ban

**Response:**
```json
{
  "success": true,
  "data": {
    "playerId": "user123",
    "bannedAt": "2024-01-15T10:30:00Z",
    "expiresAt": null,
    "reason": "Cheating"
  },
  "message": "Player banned successfully"
}
```

---

### List Banned Players

**Endpoint:** `GET /api/players/banned`

Get all banned players.

```bash
curl -u admin:password123 \
  http://localhost:3000/api/players/banned
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "playerId": "user123",
      "playerName": "PlayerName",
      "reason": "Cheating",
      "bannedAt": "2024-01-15T10:30:00Z",
      "bannedBy": "admin",
      "expiresAt": null,
      "type": "permanent"
    },
    {
      "playerId": "user456",
      "playerName": "OtherPlayer",
      "reason": "Spam",
      "bannedAt": "2024-01-14T10:30:00Z",
      "bannedBy": "admin",
      "expiresAt": "2024-01-15T10:30:00Z",
      "type": "temporary"
    }
  ]
}
```

---

### Unban Player

**Endpoint:** `POST /api/players/unban`

Remove player from ban list.

```bash
curl -X POST -u admin:password123 \
  http://localhost:3000/api/players/unban \
  -H "Content-Type: application/json" \
  -d '{"playerId": "user123"}'
```

**Request Body:**
```json
{
  "playerId": "user123"   // Player ID (required)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Player unbanned successfully"
}
```

---

## Status & Monitoring

### Get Server Logs

**Endpoint:** `GET /api/logs`

Get recent server logs.

```bash
curl -u admin:password123 \
  http://localhost:3000/api/logs?limit=50&offset=0
```

**Query Parameters:**
- `limit` - Number of logs (default: 50)
- `offset` - Starting position (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2024-01-15T10:30:45Z",
      "level": "INFO",
      "message": "Server started"
    }
  ]
}
```

---

### Get Audit Log

**Endpoint:** `GET /api/audit-log`

Get administrative action audit trail.

```bash
curl -u admin:password123 \
  http://localhost:3000/api/audit-log?action=PLAYER_BAN
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "action": "PLAYER_BAN",
      "admin": "admin",
      "details": {
        "playerId": "user123",
        "reason": "Cheating"
      }
    }
  ]
}
```

---

## Error Handling

### Common Error Responses

**400 - Bad Request**
```json
{
  "success": false,
  "error": "Required field 'playerId' is missing",
  "statusCode": 400
}
```

**401 - Unauthorized**
```json
{
  "success": false,
  "error": "Invalid credentials",
  "statusCode": 401
}
```

**403 - Forbidden**
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "statusCode": 403
}
```

**404 - Not Found**
```json
{
  "success": false,
  "error": "Resource not found",
  "statusCode": 404
}
```

**409 - Conflict**
```json
{
  "success": false,
  "error": "Server already running",
  "statusCode": 409
}
```

**500 - Server Error**
```json
{
  "success": false,
  "error": "Internal server error",
  "statusCode": 500
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **General:** 100 requests/minute per IP
- **Login:** 5 attempts/minute per IP
- **Ban/Kick:** 20 requests/minute per IP

Response header: `X-RateLimit-Remaining`

---

## Examples

### Complete Workflow

```bash
#!/bin/bash
API="http://localhost:3000/api"
AUTH="admin:password123"

# 1. Get server status
curl -u $AUTH $API/servers-status

# 2. Launch server
curl -X POST -u $AUTH $API/launch

# 3. Wait for server to start
sleep 10

# 4. List connected players
curl -u $AUTH $API/players/list

# 5. Ban a player
curl -X POST -u $AUTH $API/players/ban \
  -H "Content-Type: application/json" \
  -d '{"playerId":"user123","reason":"Griefing"}'

# 6. Stop server
curl -X POST -u $AUTH $API/stop
```

---

**Version:** 1.0  
**Last Updated:** 2024-01-15  
**Questions?** See [FAQ.md](FAQ.md)
