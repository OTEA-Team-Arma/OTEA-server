# 🔴 SECURITY WARNING - Port 3000 & Network Exposure

## Critical Issue

**Default Configuration is NOT suitable for production!**

```
OTEA listens on: 0.0.0.0:3000  (ALL interfaces)
Protocol: HTTP (no encryption)
Port 3000: Known default Node.js port (Scanner target!)
```

---

## ⚠️ Risks

| Risk | Severity | Details |
|------|----------|---------|
| **Port Scanning** | 🔴 CRITICAL | 3000 is default Node.js - scanners will find it |
| **No Encryption** | 🔴 CRITICAL | HTTP = plain text credentials over network |
| **Brute Force** | 🔴 CRITICAL | No rate limiting on login attempts |
| **Public Internet** | 🔴 CRITICAL | Exposed if port forwarded without protection |

---

## ✅ Solutions by Deployment Type

### **Local Network Only** (Home/Office LAN)

**Already Safe if:**
- OTEA only accessible from your internal network
- WiFi has WPA2+ encryption
- Machine behind corporate firewall

**Still Recommended:**
- Change default admin password immediately!
- Use a strong password (20+ chars)

---

### **VPS / Cloud / Public Internet** (PRODUCTION)

**MANDATORY SECURITY STEPS:**

#### 1️⃣ Use Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/otea

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

**Result:**
```
✅ HTTPS only (443)
✅ Port 3000 NOT exposed
✅ Only Nginx visible to internet
✅ OTEA on localhost:3000
```

**See:** `deployment/nginx.conf` for full example

---

#### 2️⃣ Bind to Localhost Only (Development)

Edit startup command:

```javascript
// js/server.js (end of file)

const PORT = process.env.OTEA_PORT || 3000;
const HOST = process.env.OTEA_HOST || 'localhost';  // ← CHANGE THIS

app.listen(PORT, HOST, () => {
    console.log(`OTEA listening on ${HOST}:${PORT}`);
    console.log(`Access from this machine only: http://localhost:${PORT}`);
});
```

**Environment variable:**
```bash
export OTEA_HOST=localhost
# or
export OTEA_HOST=127.0.0.1
```

**Result:**
```
✅ Only accessible from YOUR machine
✅ Internet can't reach it
⚠️ Still HTTP (but isolated)
```

---

#### 3️⃣ Use Docker with Network Isolation

```bash
docker run -d \
  -p 3000:3000 \
  --name otea \
  -e OTEA_HOST=0.0.0.0 \
  otea-server:latest

# Access ONLY from:
# - Docker host: http://localhost:3000
# - Never exposed by default
```

---

#### 4️⃣ Enable Rate Limiting (TODO - v2.2)

Protect against brute force:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5                      // max 5 login attempts
});

app.post('/api/login', limiter, (req, res) => {
    // Login logic
});
```

---

## 🚀 Recommended Deployment

### Development (Safe ✅)
```
You → localhost:3000 → OTEA
(Not exposed to internet)
```

### Production (Secure ✅)
```
Players → HTTPS://yourdomain.com:443 
         ↓
         Nginx (reverse proxy)
         ↓
         http://localhost:3000 → OTEA
(Internet sees only Nginx)
```

---

## ⚡ Quick Checklist

**BEFORE going live:**

- [ ] Change admin password to 20+ char strong password
- [ ] Use HTTPS (Let's Encrypt free certificate)
- [ ] Use reverse proxy (Nginx/Apache)
- [ ] Bind OTEA to localhost only
- [ ] Firewall rules restrict port 3000
- [ ] Keep OTEA updated (security patches)
- [ ] Monitor admin.log for suspicious activity

---

## FAQ

**Q: Can I access OTEA from the internet?**
A: Yes, but ONLY through:
1. HTTPS reverse proxy (Nginx)
2. VPN connection to your network
3. NOT directly on port 3000

**Q: How do I know if I'm exposed?**
A: Run a port scan from outside your network:
```bash
nmap yourdomain.com -p 3000
# Should show: filtered or closed
# NOT: open
```

**Q: Is Docker more secure?**
A: Only if configured correctly. Use environment variables + reverse proxy.

**Q: What about authentication tokens?**
A: Currently uses HTTP Basic Auth. Future versions should support:
- JWT tokens (safer for APIs)
- Session-based auth with cookies (HTTPS required)

---

**Last Updated:** April 2026  
**Version:** v2.1+ documentation  
**Status:** CRITICAL - Read before production deployment
