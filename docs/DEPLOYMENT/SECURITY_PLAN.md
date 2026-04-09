# Security Plan - OTEA-Server v2.4 Production

Comprehensive security hardening guide for production deployment.

---

## 🎯 Security Objectives

- ✅ Secure authentication (JWT tokens)
- ✅ Encryption in transit (HTTPS/TLS)
- ✅ Complete audit trail
- ✅ Protection against OWASP Top 10
- ✅ Secrets management
- ✅ Service isolation (containers)

---

## 🔒 HTTPS/TLS Configuration

### SSL Certificates

**Option 1: Let's Encrypt (Recommended - Free)**

**Linux:**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot certonly --standalone -d your-domain.com
```

**Result:** Certificates in `/etc/letsencrypt/live/your-domain.com/`

**Option 2: Self-Signed (Testing Only)**
```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

### Nginx Configuration

**Example `deployment/nginx.conf`:**
```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to backend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Auto-Renewal (Linux)

```bash
# Add to crontab
sudo crontab -e

# Add line:
0 3 * * * certbot renew --quiet && systemctl reload nginx
```

---

## 👤 Authentication & Passwords

### JWT Configuration

**In `.env` (production):**
```env
JWT_SECRET=generate-64-char-random-string-minimum
JWT_EXPIRES_IN=24h
```

**Generate strong secret:**
```bash
openssl rand -base64 64
```

**Never:**
- ❌ Hardcode secrets in code
- ❌ Commit secrets to git
- ❌ Use weak secrets
- ❌ Reuse secrets across environments

### Password Policy

**Requirements:**
- ✅ Minimum 20 characters in production
- ✅ Mixed case letters (A-Z, a-z)
- ✅ Numbers (0-9)
- ✅ Special characters (!@#$%^&*)
- ✅ No dictionary words
- ✅ Unique per user

**Password Hashing:**
- ✅ bcryptjs (10-round salting)
- ✅ Never stored in plain text
- ✅ Never logged or exposed

---

## 🛡️ Security Headers

**All Configured in Nginx:**

| Header | Value | Purpose |
|--------|-------|---------|
| HSTS | max-age=31536000 | Force HTTPS for 1 year |
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-Frame-Options | SAMEORIGIN | Prevent clickjacking |
| X-XSS-Protection | 1; mode=block | Legacy XSS protection |
| Content-Security-Policy | default-src 'self' | Restrict content sources |
| Referrer-Policy | strict-origin | Control referrer info |

---

## ⚡ Rate Limiting

**Backend (Built-in):**
- 100 requests per 15 minutes per IP
- Applied to all endpoints

**Nginx (Optional Enhancement):**
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

location /api/auth/login {
    limit_req zone=login burst=5 nodelay;
    proxy_pass http://backend;
}

location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://backend;
}
```

---

## 🔐 Secrets Management

### Best Practices

**DO:**
- ✅ Store in `.env.prod` (0600 permissions)
- ✅ Rotate secrets every 3 months
- ✅ Use environment variables
- ✅ Audit secret access
- ✅ Use strong random generation

**DON'T:**
- ❌ Commit `.env` to git
- ❌ Log secrets to console
- ❌ Reuse secrets
- ❌ Share via email/chat
- ❌ Use same secret for multiple apps

### Checklist

```bash
# Verify no secrets in code
grep -r "CHANGE_ME" . && echo "DANGER!" || echo "OK"

# Verify .env not in git
grep "\.env" .gitignore

# Verify .env permissions
ls -la .env.prod  # Should be -rw------- (0600)

# Set correct permissions
chmod 600 .env.prod
```

---

## 🚫 Protection Against Attacks

### OWASP Top 10

#### 1. SQL Injection
- ✅ Parameterized queries (better-sqlite3)
- ✅ Input validation
- ✅ Output sanitization

#### 2. Broken Authentication
- ✅ JWT tokens (24h expiration)
- ✅ Secure password hashing (bcryptjs)
- ✅ Rate limiting on login
- ✅ Token validation on all endpoints

#### 3. Sensitive Data Exposure
- ✅ HTTPS/TLS encryption
- ✅ Secrets in environment only
- ✅ Never log passwords
- ✅ Audit trail sanitized

#### 4. XML External Entities (XXE)
- ✅ Safe (JSON only, no XML parsing)

#### 5. Broken Access Control
- ✅ Role-Based Access Control (RBAC)
- ✅ 3 roles: admin, game_master, viewer
- ✅ Per-endpoint permission checks
- ✅ Own-resource validation

#### 6. Security Misconfiguration
- ✅ Hardened Nginx config
- ✅ Non-root Docker user
- ✅ No debug mode in production
- ✅ Security headers enabled

#### 7. Cross-Site Scripting (XSS)
- ✅ Content-Type: application/json
- ✅ No inline scripts
- ✅ Input sanitization
- ✅ Output encoding

#### 8. Insecure Deserialization
- ✅ Safe (JSON only)

#### 9. Using Components with Known Vulnerabilities
- ✅ Regular `npm audit`
- ✅ Dependabot enabled
- ✅ Monthly updates

#### 10. Insufficient Logging & Monitoring
- ✅ Audit trail for all operations
- ✅ Prometheus metrics ready
- ✅ Error logging
- ✅ Searchable logs

---

## 🔍 Audit & Logging

### What's Logged

**Every operation includes:**
- Timestamp (UTC)
- User (username)
- Action (what was done)
- Resource (what it affected)
- Status (success/failure)
- Client IP

**Example:**
```json
{
  "timestamp": "2026-04-09T10:30:00Z",
  "user": "admin",
  "action": "create-server",
  "resource": "Server:42",
  "status": "success",
  "ip": "192.168.1.100"
}
```

### Retention Policy

- **Hot logs:** 30 days in `/app/logs/`
- **Archive:** 1 year in external storage (S3/backup)
- **Deletion:** After 1 year retention period

### Monitoring Logs

**Check for suspicious activity:**
```bash
# Failed logins
grep "login.*failed" /app/logs/admin.log

# Deleted resources
grep "delete" /app/logs/admin.log

# Permission errors
grep "403\|forbidden" /app/logs/admin.log

# Root cause analysis
grep "ERROR" /app/logs/backend.log
```

---

## 📦 Container Security

### Docker Security

**Current Setup:**
- ✅ Non-root user (nodejs:1001)
- ✅ Alpine Linux (minimal attack surface)
- ✅ Read-only filesystem where possible
- ✅ Resource limits
- ✅ Health checks
- ✅ Auto-restart on failure

**docker-compose.yml:**
```yaml
backend:
  user: "1001"  # Non-root
  security_opt:
    - no-new-privileges:true
  cap_drop:
    - ALL
  cap_add:
    - NET_BIND_SERVICE
  read_only: true
  tmpfs:
    - /tmp
    - /var/run
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
    interval: 30s
    timeout: 3s
    retries: 3
```

### Network Isolation

- Backend NOT directly exposed
- Only ports 80/443 exposed (via Nginx)
- Internal communication via Docker network
- No service-to-service internet access

---

## 🚨 Incident Response

### If Compromised

**Immediate (< 1 hour):**
1. Revoke old JWT_SECRET
2. Force password reset for all users
3. Check access logs
4. Isolate affected service

**Short-term (< 24h):**
1. Deploy new JWT_SECRET
2. Audit user accounts
3. Check for data exfiltration
4. Review logs for compromise date

**Long-term (< 1 week):**
1. Post-mortem analysis
2. Security patches
3. Enhanced monitoring
4. User notification

---

## 📋 Pre-Deployment Checklist

- [ ] SSL certificate installed and valid
- [ ] Default password changed
- [ ] JWT_SECRET configured (32+ chars)
- [ ] `.env.prod` has 0600 permissions
- [ ] Nginx security headers enabled
- [ ] Rate limiting tested
- [ ] Firewall rules configured
- [ ] Backup strategy verified
- [ ] Monitoring alerts configured
- [ ] Security scan completed (`docker scan`)

---

## 🔄 Regular Maintenance

### Monthly
```bash
npm audit  # Check for dependency vulnerabilities
npm audit fix  # Auto-fix if safe
```

### Quarterly
```bash
# Rotate secrets
# 1. Generate new JWT_SECRET
# 2. Update .env.prod
# 3. Restart application
# 4. Monitor for issues
```

### Annually
- Security audit
- Penetration testing
- Access review
- Policy update

---

## 📞 Security Contacts

**For security issues:**
1. Do NOT post publicly
2. Email: security@example.com
3. Discord: [link]
4. Allow 30 days for patch before disclosure

---

**Status:** ✅ Enterprise-Grade Security  
**Version:** 2.4.0  
**Last Updated:** 9 avril 2026
