# 🔒 Security Headers & Rate Limiting

**Added:** v2.2  
**Implementation:** Helmet + express-rate-limit  
**Status:** Production Ready

---

## 📋 Overview

OTEA v2.2 adds industry-standard security:

1. **Helmet.js** - Security HTTP headers
2. **Rate Limiting** - DDoS & brute force protection

---

## 🛡️ Helmet Security Headers

### What It Does

Helmet adds protective HTTP headers to prevent common attacks:

| Header | Protection | Example |
|--------|-----------|---------|
| `X-Content-Type-Options` | MIME sniffing | `nosniff` |
| `X-Frame-Options` | Clickjacking | `DENY` |
| `X-XSS-Protection` | XSS attacks | `1; mode=block` |
| `Strict-Transport-Security` | Force HTTPS | `max-age=15768000` |
| `Content-Security-Policy` | Injection attacks | `default-src 'self'` |

### Implementation

```javascript
// js/server.js
const helmet = require('helmet');
app.use(helmet()); // Apply to ALL routes
```

### Response Headers Example

```http
HTTP/1.1 200 OK
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

---

## 🚨 Rate Limiting

### Two-Tier System

#### 1. General Rate Limiting
- **Applies to:** ALL routes
- **Limit:** 100 requests per 15 minutes per IP
- **Behavior:** Returns `429 Too Many Requests`

```javascript
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 min
    max: 100,                   // 100 req max
    message: 'Too many requests...',
});

app.use(limiter);  // All routes
```

#### 2. Auth Rate Limiting  
- **Applies to:** Sensitive routes only
  - `/add-user`
  - `/change-credentials`
- **Limit:** 5 attempts per 15 minutes per IP
- **Behavior:** Returns `429` after 5 failed attempts
- **skipSuccessfulRequests:** `true` = Only count failed attempts

```javascript
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 min
    max: 5,                     // 5 attempts max
    skipSuccessfulRequests: true, // Don't count successes
});

app.post('/add-user', authLimiter, handler);
```

---

## 🎯 Use Cases

### Scenario 1: Normal Usage
- User makes 50 requests in 15 min
- All allowed ✅
- No rate limiting triggered

### Scenario 2: DDoS Attack
- Bot sends 500 requests in 15 min
- After 100 requests → `429 Too Many Requests`
- Bot blocked for 15 minutes
- Real users unaffected ✅

### Scenario 3: Brute Force Login Attempt
- Attacker tries 10 passwords in 15 min
- After 5 attempts → `429 Too Many Requests`
- Account protected ✅
- Attacker must wait 15 min to retry

### Scenario 4: IP Whitelist (Future)
- In production, you might skip limiting for trusted IPs
- (Can be implemented in v2.3)

---

## 📊 Configuration

### Adjusting Limits

**File:** `js/server.js`

#### Increase limit for development:
```javascript
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour window
    max: 1000,                  // 1000 requests
});
```

#### Stricter for production:
``` javascript
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,  // 5 min
    max: 30,                   // 30 requests
});
```

#### Time windows:
```javascript
5 * 60 * 1000       // 5 minutes
15 * 60 * 1000      // 15 minutes (default)
60 * 60 * 1000      // 1 hour
24 * 60 * 60 * 1000 // 1 day
```

---

## 🔍 Monitoring

### Check Current Rate Limits

**Response Headers Include:**
```
RateLimit-Limit: 100
RateLimit-Remaining: 87  # Requests left
RateLimit-Reset: 1617927600000  # Unix timestamp
```

### Browser Developer Tools

```javascript
// F12 → Network tab → Click request → Headers tab
// Response Headers section shows rate limit info
RateLimit-Limit: 5
RateLimit-Remaining: 2
RateLimit-Reset: 1617927600
```

### Admin Log

Rate limit events NOT automatically logged (only exceeded):
```json
{
  "action": "rate-limit-exceeded",
  "ip": "192.168.1.100",
  "route": "/add-user",
  "timestamp": "2026-04-06T14:30:00Z"
}
```

---

## ⚠️ Error Responses

### Rate Limited (429)

```http
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 1698765432000

{
  "message": "Too many login attempts, please try again later."
}
```

**User sees:** Message explaining they should wait

**Recommended wait:** 15 minutes default

---

## 🚀 Production Checklist

- [ ] Helmet enabled (default: yes)
- [ ] Rate limits appropriate for expected traffic
- [ ] Logs monitored for 429 errors
- [ ] DDoS protection considered (WAF layer)
- [ ] Reverse proxy (Nginx) also has rate limiting
- [ ] Custom error page for 429 (optional)

---

## 🔧 Troubleshooting

### "Too many requests" after normal usage

**Reason:** Limit too strict or time window too small

**Fix:**
```javascript
// Check limits in js/server.js
const limiter = rateLimit({
    max: 100,  // ← Increase this
    windowMs: 15 * 60 * 1000,  // ← Or increase time
});
```

### Rate limits not working

**Check 1:** Helmet installed?
```bash
npm list helmet
# Should show: helmet@...
```

**Check 2:** Middleware applied?
```javascript
app.use(helmet());      // ← Must be FIRST
app.use(limiter);       // ← Must be before routes
```

**Check 3:** Proxy headers?
If behind reverse proxy (Nginx), configure:
```javascript
app.set('trust proxy', 1); // Trust 1 proxy level
```

### Client IP always the same

**Reason:** Behind reverse proxy, OTEA sees proxy IP not client IP

**Fix in server.js:**
```javascript
app.set('trust proxy', 1);  // Trust X-Forwarded-For header

const limiter = rateLimit({
    keyGenerator: (req, res) => {
        return req.headers['x-forwarded-for'] || req.ip;
    },
    windowMs: 15 * 60 * 1000,
    max: 100,
});
```

---

## 📚 Related

- [SECURITY_PORT_3000.md](SECURITY_PORT_3000.md) - Port & HTTPS security
- [ENVIRONMENT_CONFIG.md](ENVIRONMENT_CONFIG.md) - .env security
- [REFACTORING_PLAN.md](REFACTORING_PLAN.md) - v2.2 phases
- [Helmet.js Docs](https://helmetjs.github.io/) - Official docs
- [express-rate-limit Docs](https://github.com/nfriedly/express-rate-limit) - Official docs
