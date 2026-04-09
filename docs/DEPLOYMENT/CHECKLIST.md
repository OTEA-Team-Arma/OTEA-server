# Pre-Deployment Checklist - OTEA-Server v2.4

Complete verification checklist before production deployment.

---

## 🔴 CRITICAL (Must Complete Before Deploy)

### Security
- [ ] `.env.prod` created
- [ ] ALL secrets changed (no "CHANGE_ME" strings)
- [ ] `JWT_SECRET` is long (32+ characters)
- [ ] Default admin password changed
- [ ] SSL certificate valid and installed
- [ ] HTTPS forced (HTTP → 301 redirect)
- [ ] Security headers verified (HSTS, CSP, etc.)
- [ ] Rate limiting tested
- [ ] `.env.prod` permissions: `chmod 600` done

### Infrastructure
- [ ] Docker installed and running
- [ ] docker-compose version: 1.29+
- [ ] Sufficient disk space (10GB+)
- [ ] Sufficient RAM (2GB+)
- [ ] Network connectivity test passed
- [ ] Ports 80, 443 available (firewall)
- [ ] Volumes created and accessible

### Application
- [ ] Node.js dependencies installed (`npm install`)
- [ ] `.env.prod` file configured
- [ ] Database initialized (automatic on first run)
- [ ] Health check endpoint responds: `curl https://localhost/api/health`
- [ ] Login functionality tested
- [ ] API endpoints respond correctly
- [ ] Audit logging working

### Database
- [ ] Database file initialized
- [ ] Database permissions correct
- [ ] Backup path configured
- [ ] Backup tested (manual run successful)

---

## 🟡 IMPORTANT (Recommended Before Deploy)

### Performance
- [ ] RAM check: `free -h` shows 2GB+ available
- [ ] CPU check: 2+ cores available
- [ ] Disk check: 50GB+ free space
- [ ] Network bandwidth: 5Mbps available

### Backup & Recovery
- [ ] Backup procedure documented
- [ ] Backup path exists and is writable
- [ ] Restore procedure tested
- [ ] Backup external storage ready
- [ ] Backup scheduling configured

### Monitoring & Logging
- [ ] Health check endpoint working
- [ ] Logs are being written
- [ ] Log rotation configured
- [ ] Error logging functional
- [ ] Audit trail accessible

### Documentation
- [ ] Team trained on operations
- [ ] Incident response procedure documented
- [ ] Emergency contacts list available
- [ ] Network diagram reviewed
- [ ] Security plan reviewed

---

## 🟢 OPTIONAL (Nice-to-Have)

### Enhanced Security
- [ ] Fail2ban configured (Linux)
- [ ] SELinux/AppArmor policies applied
- [ ] Firewall advanced rules set
- [ ] VPN access configured
- [ ] IP whitelist configured

### Advanced Monitoring
- [ ] Prometheus metrics collector running
- [ ] Grafana dashboards created
- [ ] Alert rules configured
- [ ] Email/SMS alerts setup
- [ ] Performance baselines recorded

### Compliance
- [ ] Privacy policy available
- [ ] Data retention policy defined
- [ ] GDPR consent (if EU users)
- [ ] Audit log export available
- [ ] User data export feature tested

---

## 📋 Pre-Deployment Verification Steps

### Phase 1: Configuration Validation (30 minutes)

```bash
# 1. Verify Docker installation
docker --version  # Should be 20.x+
docker-compose --version  # Should be 1.29+

# 2. Verify no secrets in code
grep -r "CHANGE_ME" . && echo "FAIL: Fix all CHANGE_ME" || echo "OK"

# 3. Verify .env configuration
cat .env.prod | head -10  # Visually inspect

# 4. Verify .env permissions
ls -la .env.prod  # Should show -rw------- (0600)

# 5. Verify no .env in git
grep "\.env\.prod" .gitignore || echo "WARNING: Add to .gitignore"
```

### Phase 2: Build Validation (20 minutes)

```bash
# 1. Validate docker-compose.yml
docker-compose -f deployment/docker-compose.yml config > /dev/null && echo "OK"

# 2. Build image
docker build -t otea-server:2.4 . --no-cache

# 3. Check image size
docker images | grep otea-server

# 4. Scan for vulnerabilities
docker scan otea-server:2.4
```

### Phase 3: Application Startup Test (10 minutes)

```bash
# 1. Start services
docker-compose -f deployment/docker-compose.yml up -d

# 2. Wait for startup
sleep 10

# 3. Check containers running
docker-compose -f deployment/docker-compose.yml ps

# 4. Check logs for errors
docker-compose -f deployment/docker-compose.yml logs backend | grep -i error

# 5. Test health endpoint
curl -f http://localhost:3000/api/health || echo "HEALTH CHECK FAILED"

# 6. Test login (via UI browser)
# Navigate to http://localhost:3000
# Try login with admin:admin1234
# Check console for errors
```

### Phase 4: Security Verification (15 minutes)

```bash
# 1. Check HTTPS headers
curl -I https://localhost/ 
# Should see: HSTS, X-Content-Type-Options, etc.

# 2. Verify HTTPS redirect
curl -I http://localhost/
# Should see: 301 redirect to HTTPS

# 3. Test SSL certificate
openssl s_client -connect localhost:443 -brief

# 4. Check firewall access
# From another machine:
curl https://<YOUR_IP>/api/health

# 5. Rate limit test
for i in {1..150}; do curl -s http://localhost:3000/api/health > /dev/null; done
# Should see 429 status codes after 100 requests
```

### Phase 5: Data & Backup Test (20 minutes)

```bash
# 1. Verify database exists
ls -la data/app.db  # Should exist

# 2. Create backup
docker-compose -f deployment/docker-compose.yml exec backend npm run backup

# 3. Verify backup file
ls -la backups/  # Should have *.sql or *.tar.gz

# 4. Test restore procedure (in staging)
# Don't do in production!
```

---

## ✅ Sign-Off Template

**Before Production Deploy - All must approve:**

| Role | Name | Date | Approved |
|------|------|------|----------|
| DevOps | _____________ | ___/___/_____ | [ ] |
| Security | _____________ | ___/___/_____ | [ ] |
| QA/Test | _____________ | ___/___/_____ | [ ] |
| Admin | _____________ | ___/___/_____ | [ ] |

---

## 🚀 Deployment Procedure

### Pre-Deployment (2 hours before)

```bash
# 1. Full backup of current system
rsync -avz /current/otea /backup/otea-$(date +%Y%m%d-%H%M%S)

# 2. Verify backup succeeded
ls -lah /backup/otea-*

# 3. Brief team
# Notify all users: "Deployment starts at X:XX PM"

# 4. Last configuration check
docker-compose -f deployment/docker-compose.yml config
```

### Deployment (30 minutes)

```bash
# 1. Pull latest code
git pull origin main

# 2. Stop current services
docker-compose -f deployment/docker-compose.yml down

# 3. Rebuild image
docker build -t otea-server:2.4 . --no-cache

# 4. Start new services
docker-compose -f deployment/docker-compose.yml up -d

# 5. Wait for startup
sleep 15

# 6. Verify health
curl https://localhost/api/health || echo "FAILED"

# 7. Manual test login via browser
# Test critical workflows

# 8. Monitor logs for errors
docker-compose -f deployment/docker-compose.yml logs -f
```

### Post-Deployment (1 hour after)

```bash
# 1. Verify all services running
docker-compose -f deployment/docker-compose.yml ps

# 2. Check error logs
docker logs otea-backend | grep -i error

# 3. Monitor performance
watch docker stats

# 4. Get user feedback
# Check: "Any issues with deployment?"

# 5. Check monitoring alerts
# Verify no critical alerts firing

# 6. Document any issues
# Create issue tracker tickets
```

---

## ⚡ Rollback Procedure

**If problems detected immediately after deployment:**

```bash
# 1. STOP
docker-compose -f deployment/docker-compose.yml down

# 2. RESTORE previous backup
rsync -avz /backup/otea-PREVIOUS/ /current/otea/

# 3. RESTART old version
docker-compose -f deployment/docker-compose.yml up -d

# 4. VERIFY
curl https://localhost/api/health

# 5. INVESTIGATE
# Analyze logs to find root cause
# Check: What went wrong?
```

---

## 📝 Issues Log

**During deployment, document all issues encountered:**

```
Date: ________________
Time: ________________
Issue: _________________________
Severity: 🔴 Critical / 🟡 Important / 🟢 Minor
Cause: _________________________
Resolution: _________________________
Who: _________________________
Time to Fix: _________________________
```

---

## ✨ Final Verification

Before considering deployment complete:

- [ ] All services healthy and running
- [ ] All endpoints responding correctly
- [ ] Users can login and perform operations
- [ ] No error messages in logs
- [ ] Performance within acceptable range
- [ ] Backup created successfully
- [ ] Security headers present
- [ ] Rate limiting working
- [ ] Audit logs recording operations
- [ ] Team notified of success

---

**Version:** 2.4.0  
**Status:** Ready for Production  
**Last Updated:** 9 avril 2026
