# Admin Deployment Guide - OTEA-Server v2.4

Operations and administration guide for deployed OTEA-Server instances.

---

## 👥 Administrator Roles & Responsibilities

### Deployment Admin
- Deploy application to production
- Configure infrastructure
- Manage backups
- Monitor system health

### Security Admin
- Manage user accounts
- Configure access control
- Review audit logs
- Handle security incidents

### Operations Admin
- Daily monitoring
- Log review
- Performance optimization
- Troubleshooting

---

## 🚀 Application Deployment

### Initial Deployment

**Step 1: Pre-deployment**
```bash
# Review all checks
cat deployment/CHECKLIST.md

# Verify configuration
cat .env.prod  # Don't share this!

# Create backup of current system
rsync -avz /current/app /backup/app-$(date +%Y%m%d)
```

**Step 2: Deploy**
```bash
# Windows PowerShell
.\deploy-docker.ps1 -Action deploy

# Linux/Mac
./deploy-docker.sh deploy
```

**Step 3: Verify**
```bash
docker-compose -f deployment/docker-compose.yml ps
curl https://localhost/api/health
```

### Rolling Updates (Zero Downtime)

```bash
# 1. Pull new code
git pull origin main

# 2. Rebuild image
docker build -t otea-server:2.4 .

# 3. Graceful restart (Docker kills old, starts new)
docker-compose -f deployment/docker-compose.yml up -d --no-deps --build backend

# 4. Verify
docker-compose -f deployment/docker-compose.yml ps
curl https://localhost/api/health
```

### Rollback Procedure

```bash
# 1. Stop current
docker-compose -f deployment/docker-compose.yml down

# 2. Checkout previous version
git checkout HEAD~1

# 3. Rebuild and restart
docker build -t otea-server:2.4 .
docker-compose -f deployment/docker-compose.yml up -d

# 4. Verify working
curl https://localhost/api/health

# 5. Investigate what went wrong
docker logs otea-backend > /tmp/error.log
grep ERROR /tmp/error.log
```

---

## 📊 Monitoring & Health Checks

### System Health

**Check application health:**
```bash
curl https://localhost/api/health
# Should return: { "status": "ok", "uptime": X, "version": "2.4.0" }
```

**Monitor resource usage:**
```bash
docker stats otea-backend

# Or detailed:
docker stats --no-stream otea-backend
```

**Check container logs:**
```bash
# Real-time
docker-compose -f deployment/docker-compose.yml logs -f backend

# Last 50 lines
docker-compose -f deployment/docker-compose.yml logs --tail 50 backend

# With timestamps
docker-compose -f deployment/docker-compose.yml logs --timestamps backend
```

### Key Metrics to Monitor

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Memory | < 50% | 50-80% | > 80% |
| CPU | < 30% | 30-70% | > 70% |
| Disk | > 20% free | 10-20% free | < 10% free |
| Response Time | < 100ms | 100-500ms | > 500ms |
| Error Rate | < 0.1% | 0.1-1% | > 1% |

---

## 🔒 User Management

### Create New User

**Via Admin Panel:**
1. Login as admin
2. Navigate to "Users"
3. Click "+ Create User"
4. Fill in:
   - Username (unique)
   - Email address
   - Role (admin, game_master, viewer)
5. Click "Create"
6. User gets temporary password (share securely)
7. User logs in and must change password

**Via API:**
```bash
curl -X POST https://localhost/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "role": "game_master"
  }'
```

### Change User Role

```bash
# Via Admin Panel
1. Users → Select user → Change Role → Save

# Via API
curl -X PATCH https://localhost/api/users/USER_ID/role \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"role": "admin"}'
```

### Disable/Enable User

```bash
# Disable (can't login)
curl -X PATCH https://localhost/api/users/USER_ID/disable \
  -H "Authorization: Bearer $TOKEN"

# Enable (can login again)
curl -X PATCH https://localhost/api/users/USER_ID/enable \
  -H "Authorization: Bearer $TOKEN"
```

### Reset User Password

```bash
# Via API
curl -X POST https://localhost/api/users/USER_ID/reset-password \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔐 Password & Security Management

### Change Admin Password

**First login - Critical!**
1. Login with default: admin / admin1234
2. Click username → Profile
3. Click "Change Password"
4. Enter old + new password
5. Save

**Verify new password works:**
```bash
curl -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"NEW_PASSWORD"}'
```

### Rotate JWT Secret (Quarterly)

⚠️ **This forces all users to re-login!**

```bash
# 1. Generate new secret
openssl rand -base64 64

# 2. Update .env.prod
JWT_SECRET=<new-secret-here>

# 3. Restart application
docker-compose -f deployment/docker-compose.yml restart backend

# 4. All users must login again
# 5. Monitor for issues
docker-compose -f deployment/docker-compose.yml logs -f
```

---

## 🔍 Audit & Logging

### View Audit Logs

**Via Admin Panel:**
1. Admin Menu → Audit Logs
2. Filter: by user, action, date range
3. Export if needed

**Via API:**
```bash
# Get all audit logs
curl https://localhost/api/admin/audit-logs \
  -H "Authorization: Bearer $TOKEN" | jq

# Filter by user
curl 'https://localhost/api/admin/audit-logs?user=admin' \
  -H "Authorization: Bearer $TOKEN"

# Filter by action
curl 'https://localhost/api/admin/audit-logs?action=login' \
  -H "Authorization: Bearer $TOKEN"
```

### Log File Access

```bash
# View application logs
docker logs otea-backend | tail -100

# View Nginx logs (reverse proxy)
docker logs otea-nginx | tail -50

# Export logs
docker logs otea-backend > logs-backup.txt
```

### Analyze Suspicious Activity

```bash
# Failed logins
docker logs otea-backend | grep -i "login.*failed"

# Deleted resources
docker logs otea-backend | grep "DELETE"

# Permission errors
docker logs otea-backend | grep "403\|forbidden"

# Recently created users
curl https://localhost/api/admin/audit-logs?action=create-user \
  -H "Authorization: Bearer $TOKEN"
```

---

## 💾 Backup & Recovery

### Manual Backup

**Database backup:**
```bash
# Create backup
docker-compose -f deployment/docker-compose.yml exec backend npm run backup

# Verify backup created
ls -lah data/

# Copy to external storage
scp -r data/* backup-server:/backup/otea/
```

### Database Integrity Check

```bash
# Check database file integrity
sqlite3 data/app.db "VACUUM; PRAGMA integrity_check;"

# If corruption detected:
# 1. Stop application
# 2. Restore from backup
# 3. Investigate root cause
```

### Restore from Backup

```bash
# 1. Stop application
docker-compose -f deployment/docker-compose.yml down

# 2. Backup current (corrupted) data
mv data/app.db data/app.db.corrupted

# 3. Restore from backup
cp /backup/otea/app.db data/app.db

# 4. Set permissions
chmod 644 data/app.db

# 5. Restart
docker-compose -f deployment/docker-compose.yml up -d

# 6. Verify
curl https://localhost/api/health
```

---

## 🚨 Common Issues & Solutions

### High Memory Usage

**Diagnosis:**
```bash
docker stats  # Check if memory-intensive

ps aux | head  # Sort by memory
```

**Solutions:**
1. Restart application (clear memory leaks)
2. Check for stuck connections
3. Review logs for errors
4. Limit container memory: Edit `docker-compose.yml`

### Slow Response Times

**Diagnosis:**
```bash
# Response time test
time curl https://localhost/api/health

# Database query count
grep "query" logs/
```

**Solutions:**
1. Check database size and optimize
2. Review slow query logs
3. Add database indexes if needed
4. Check server resources (CPU, disk I/O)

### Connection Refused

**Diagnosis:**
```bash
# Check if port is open
netstat -tuln | grep 3000

# Check if container is running
docker ps | grep otea-backend

# Check app logs
docker logs otea-backend | tail -20
```

**Solutions:**
1. Restart container: `docker-compose restart backend`
2. Check firewall rules
3. Verify port configuration in .env
4. Check for port conflicts

### Failed Login

**Diagnosis:**
```bash
# Check auth logs
docker logs otea-backend | grep -i auth

# Verify user exists
curl https://localhost/api/users \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Solutions:**
1. Verify username/password correct
2. Check if user account is enabled
3. Check JWT_SECRET matches between instances
4. Review security logs for brute-force attempts

---

## 📈 Performance Tuning

### Database Optimization

```bash
# Optimize database (compacts file)
sqlite3 data/app.db "VACUUM;"

# Analyze query performance
sqlite3 data/app.db "EXPLAIN QUERY PLAN SELECT * FROM users;"

# Check database size
du -sh data/app.db
```

### Container Resource Limits

**Edit `docker-compose.yml`:**
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

---

## 🔔 Alerting & Notifications

### Setup Monitoring Alerts

**Monitor key metrics:**
1. High CPU (> 80%)
2. High memory (> 80%)
3. Low disk (<10% free)
4. Error rate spike
5. Response time spike
6. Failed backups

**Example alert script:**
```bash
#!/bin/bash
MEMORY=$(docker stats --no-stream otea-backend | awk 'NR==2 {print $6}')
if [ "$MEMORY" -gt "80%" ]; then
    echo "ALERT: High memory usage detected" | mail -s "OTEA Alert" admin@example.com
fi
```

---

## 📞 Emergency Procedures

### System Completely Down

1. **Assess:** What's wrong? Check logs
2. **Isolate:** Stop services if needed
3. **Restore:** Use backup procedure
4. **Test:** Verify health
5. **Communicate:** Notify users of timeline

### Security Breach Suspected

1. **Preserve logs:** `docker logs otea-backend > /tmp/evidence.txt`
2. **Change all passwords:** Reset all user passwords
3. **Revoke tokens:** Force re-login by rotating JWT_SECRET
4. **Investigate:** Review audit logs for suspicious activity
5. **Patch:** Update code and dependencies
6. **Communicate:** Notify users of incident

---

## 📋 Daily Checklist

**Every day:**
- [ ] Application health: `curl https://localhost/api/health`
- [ ] Check error logs: `docker logs` for errors
- [ ] Memory usage: `docker stats` under 60%
- [ ] Disk space: > 20% free
- [ ] Backup created successfully
- [ ] No alerts firing
- [ ] Users reporting normal operation

---

**Version:** 2.4.0  
**Status:** ✅ Production Ready  
**Last Updated:** 9 avril 2026
