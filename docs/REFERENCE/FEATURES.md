# Features - OTEA-Server v2.4

Complete feature documentation and usage guide.

---

## 📋 Table of Contents

1. [Dashboard](#dashboard)
2. [Authentication & Authorization](#authentication--authorization)
3. [User Management](#user-management)
4. [Server Management](#server-management)
5. [Configuration](#configuration)
6. [API & Integration](#api--integration)
7. [Security Features](#security-features)
8. [Admin Operations](#admin-operations)

---

## Dashboard

### Real-time Server Status

Monitor all your servers from one unified interface.

**Displays:**
- Server name and status (🟢 Running / 🔴 Stopped)
- Connected player count
- Memory usage
- CPU usage
- Uptime
- Port number
- Owner information

**Admin Actions:**
- **Start Server** - Launch new instance
- **Stop Server** - Graceful shutdown
- **Restart Server** - Full restart
- **Lock Server** - Prevent configuration changes
- **Ban Players** - Manage bans
- **View Config** - See current settings
- **View Logs** - Real-time console output

---

## Authentication & Authorization

### JWT Token-Based Authentication

Secure, stateless token-based authentication system.

**Features:**
- ✅ JWT tokens (24-hour expiration)
- ✅ Automatic token refresh mechanism
- ✅ Secure password hashing (bcryptjs, 10 rounds)
- ✅ Token revocation support
- ✅ Session management

### Role-Based Access Control (RBAC)

Three-tier access control system:

#### Admin Role
- **Full system access**
- Manage all users (create, edit, delete)
- Manage all servers (create, edit, delete, restart)
- Execute admin operations
- View audit logs
- System administration

#### Game Master Role
- **Own server management**
- Create servers (up to limit)
- Manage **only own servers**
- Cannot see other users' servers
- Limited system access
- Read-only: system info, audit logs

#### Viewer Role
- **Read-only access**
- View server list
- View server details
- View player info
- Cannot modify anything
- Cannot access admin operations

---

## User Management

### Create & Manage Users

**Admin Panel Features:**
- ✅ Create new users
- ✅ Edit user details
- ✅ Change user roles
- ✅ Disable/enable users
- ✅ Reset passwords
- ✅ View user activity

### User Information

Store and manage:
- Username (unique)
- Email address
- Password (hashed)
- Role assignment
- Account status (enabled/disabled)
- Last login timestamp
- Creation date

### Password Management

- **Strong hashing:** bcryptjs 10-round salting
- **Change password:** Users can change own password
- **Reset:** Admin can reset user password
- **Security:** Passwords never stored in logs

---

## Server Management

### Server Configuration

Create and manage multiple server instances with comprehensive settings.

**Configuration Options:**
- **Server Name** - Display name
- **Port** - Network port (2302-2400+)
- **Maximum Players** - Capacity (1-100+)
- **Game Mode** - PvE, PvP, Mix
- **Difficulty Settings**
  - Damage level
  - Friendly fire
  - Stamina system
  - Weapon sway
- **Advanced Settings**
  - Mods list
  - Mission file
  - World settings
  - Persistence

### Server Lifecycle

**Launch Server**
- Validates configuration
- Allocates port
- Starts process
- Monitors health

**Monitor Running**
- Real-time status
- Player count
- Resource usage (memory, CPU)
- Connection log
- Performance metrics

**Stop Server**
- Graceful shutdown
- Player notification (30s warning)
- Time to save data
- Process cleanup

**Restart Server**
- Combines stop + start
- Configuration reload
- Automatic reconnection
- Zero-data-loss

### Server Locking

**Lock Features:**
- Prevent configuration changes
- Keep settings stable during operation
- Protect against accidental modifications
- Unlock for maintenance

---

## Configuration

### Server Presets

Save and restore configurations instantly.

**Preset Management:**
- ✅ Save current configuration
- ✅ Load preset (apply settings quickly)
- ✅ Clone preset
- ✅ Delete preset
- ✅ Export preset (JSON)
- ✅ Import preset (JSON)

**Example Preset:**
```json
{
  "name": "Standard-EU-64",
  "serverName": "EU Server #1",
  "port": 2302,
  "maxPlayers": 64,
  "gameMode": "pve",
  "difficulty": {
    "damage": 1,
    "friendlyFire": false,
    "stamina": true,
    "sway": 0.5
  },
  "mods": ["mod1", "mod2"],
  "mission": "mission_01.pbo"
}
```

### Environment Variables

**Essential Configuration:**
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=long-secret-key-32-chars-minimum
DB_PATH=/app/data/app.db
JWT_EXPIRES_IN=24h
```

**Optional:**
```env
LOG_LEVEL=info
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15m
CORS_ORIGIN=http://localhost:3000
```

---

## API & Integration

### 43 RESTful Endpoints

**Comprehensive API covering:**
- Authentication (6 endpoints)
- User Management (8 endpoints)
- Server Management (15 endpoints)
- Admin Operations (8 endpoints)
- System Health (3 endpoints)
- Plus: audit logs, bans, settings

See `API.md` for complete reference.

### Webhook Ready

Structure ready for webhook integration:
- Server events (start, stop, restart)
- User actions (login, configuration changes)
- Security events (failed login, unauthorized access)
- Audit trail for compliance

### Integration Examples

**JavaScript/Node.js:**
```javascript
const response = await fetch('http://localhost:3000/api/servers', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

**cURL:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/servers
```

---

## Security Features

### Authentication & Encryption

- ✅ JWT tokens (24h expiration)
- ✅ Password hashing (bcryptjs)
- ✅ HTTPS ready
- ✅ Token refresh system
- ✅ Session validation

### Attack Protection

- ✅ Rate limiting (100 req/15min per IP)
- ✅ SQL injection prevention (parameterized queries)
- ✅ Input validation & sanitization
- ✅ CORS protection
- ✅ XSS headers (Helmet middleware)
- ✅ CSRF protection ready

### Audit & Logging

- ✅ Complete audit trail
- ✅ All operations logged
- ✅ User action tracking
- ✅ Timestamp on all events
- ✅ Searchable audit logs

### Network Security

- ✅ Helmet middleware (security headers)
- ✅ Rate limiting
- ✅ CORS configured
- ✅ HTTPS support
- ✅ Port configuration
- ✅ Firewall integration ready

---

## Admin Operations

### System Maintenance

**Available Tasks:**
- 🔄 Restart individual servers
- 🔄 Restart all servers
- ⛔ Stop all servers
- 📊 View system info (memory, CPU, uptime)
- 📋 Check system health
- 🗑️ Cleanup processes

### Backup & Restore

**Data Protection:**
- ✅ Manual backup creation
- ✅ Automatic backups (optional)
- ✅ Point-in-time restore
- ✅ Backup versioning
- ✅ Export/import data

### Monitoring & Stats

**Dashboard Metrics:**
- Server count (running/total)
- Player count (online/registered)
- Uptime statistics
- Resource utilization
- Error rates
- Performance metrics

### Audit & Compliance

**Audit Trail:**
- Who did what, when, where, why
- All admin operations logged
- User actions tracked
- Security events recorded
- Searchable logs
- Export capability

---

## Performance Optimization

### Caching

- ✅ Response caching
- ✅ Session optimization
- ✅ Database query optimization
- ✅ Static asset caching

### Database Performance

- ✅ Indexed queries
- ✅ Connection pooling
- ✅ Transaction management
- ✅ Query optimization

### Scalability

- ✅ Multi-instance support
- ✅ Horizontal scaling ready
- ✅ Load balancer compatible
- ✅ Docker-ready for scaling

---

## Integration Ready

### Monitoring Integration

Structure supports:
- Prometheus metrics
- ELK stack integration
- Grafana dashboards
- Custom monitoring
- Alert systems

### CI/CD Pipeline

- ✅ Docker containerized
- ✅ Automated testing (Jest)
- ✅ Health checks
- ✅ Zero-downtime deployment
- ✅ Rollback capability

---

## 🎯 Feature Summary

| Feature | Status | Details |
|---------|--------|---------|
| Web Admin Panel | ✅ Complete | Fully functional |
| JWT Authentication | ✅ Complete | 24h tokens |
| Role-Based Access | ✅ Complete | 3 roles |
| Server Management | ✅ Complete | Full CRUD |
| User Management | ✅ Complete | Admin panel |
| REST API (43) | ✅ Complete | All documented |
| Database (SQLite) | ✅ Complete | 4 tables |
| Audit Logging | ✅ Complete | All operations |
| Security | ✅ Hardened | Enterprise-grade |
| Docker Deployment | ✅ Complete | Production-ready |

---

**Version:** 2.4.0  
**Last Updated:** 9 avril 2026  
**Status:** ✅ Production Ready
