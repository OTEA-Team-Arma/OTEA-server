# Plan de Sécurité - OTEA Server Production

## 🎯 Objectifs de Sécurité
- Authentification robuste (Basic Auth + future JWT)
- Chiffrement en transit (HTTPS/TLS obligatoire)
- Audit complet des actions administratives
- Protection contre les attaques OWASP Top 10
- Secrets management sécurisé
- Isolation des services (conteneurs)

---

## 🔒 Sécurité HTTPS/TLS

### Configuration
1. **Certificats SSL/TLS**
   - Fournisseur recommandé : Let's Encrypt (gratuit, auto-renouvelable)
   - Validité minimale : 90 jours (auto-renouvellement tous les 30 jours)
   - Format : PEM (fullchain.pem + privkey.pem)

2. **Installation Let's Encrypt (Linux)**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot certonly --standalone -d example.com
   # Certificats générés : /etc/letsencrypt/live/example.com/
   ```

3. **Renouvellement automatique (cron)**
   ```bash
   # Ajouter à crontab
   0 3 * * * certbot renew --quiet && systemctl reload nginx
   ```

### Validation
- ✅ HTTPS forcé (HTTP → 301 redirect)
- ✅ TLS 1.2+ obligatoire
- ✅ Ciphers forte (pas de MD5/RC4)
- ✅ HSTS header (31536000 secondes)

---

## 👤 Authentification

### Sécurité des Credentials
**Current State (Basic Auth):**
- ✅ Stocké en `.env.prod` (non versionné)
- ✅ Transmis uniquement sur HTTPS
- ✅ Hash recommandé : bcrypt

**Transition Future (JWT):**
1. Implémenter `/api/auth/login` (retourne JWT)
2. Tokens expiration : 7 jours (default)
3. Refresh tokens : 30 jours
4. Revocation list : implémenter Redis

### Vérification Pre-Prod
```bash
# Vérifier que default password n'est PAS en production
grep -r "admin1234" deployment/ data/ && echo "DANGER!" || echo "OK"
```

---

## 🛡️ Headers de Sécurité

### Implémentés (Nginx)
| Header | Valeur | Effet |
|--------|--------|-------|
| HSTS | max-age=31536000 | Force HTTPS pendant 1 an |
| X-Content-Type-Options | nosniff | Prévient MIME type sniffing |
| X-Frame-Options | SAMEORIGIN | Prévient clickjacking |
| X-XSS-Protection | 1; mode=block | Protection XSS (legacy) |
| CSP | default-src 'self' | Content Security Policy |
| Referrer-Policy | strict-origin | Contrôle les referrer |

---

## ⚡ Rate Limiting

### Configuration Nginx
| Zone | Limite | Usage |
|------|--------|-------|
| general | 10 req/s | Contenu statique |
| api | 100 req/min | Endpoints API |
| login | 5 req/min | Authentification |

### Implémentation Backend (Future)
```javascript
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5, // 5 tentatives
  message: 'Trop de tentatives, réessayez plus tard'
});
app.post('/api/login', loginLimiter, ...);
```

---

## 🔐 Gestion des Secrets

### Checklist
- [ ] `.env.prod` généré depuis `.env.example`
- [ ] Tous les secrets remplacés (CHANGE_ME)
- [ ] Permissions restrictives : `chmod 600 .env.prod`
- [ ] Secrets NOT versionnés en Git
- [ ] Rotation secrets : chaque 3 mois
- [ ] Audit des accès aux secrets (`journalctl`)

### Génération Secrets
```bash
# Générer JWT_SECRET
openssl rand -base64 64

# Générer API_SECRET
openssl rand -base64 32

# Générer password fort
openssl rand -base64 18 | tr -d "=+/" | cut -c1-12
```

---

## 🚫 Protection Contre les Attaques

### OWASP Top 10 Coverage

#### 1. Injection SQL
- ✅ Req: Validation inputs backend
- ✅ Plan: Transition vers ORM (Sequelize/TypeORM)

#### 2. Broken Authentication
- ✅ HTTPS TLS 1.2+
- ✅ Basic Auth avec credentials forts
- ❌ TODO: Implémenter session timeout (5 min inactivité)

#### 3. Sensitive Data Exposure
- ✅ HTTPS/TLS
- ✅ Secrets en `.env.prod`
- ❌ TODO: Encryption at-rest pour presets/logs

#### 4. XML External Entities (XXE)
- ✅ Safe (Node.js ne parse pas XML par défaut)

#### 5. Broken Access Control
- ❌ TODO: Implémenter RBAC (roles/permissions)
- Plan: Admin vs User roles

#### 6. Security Misconfiguration
- ✅ Nginx hardened
- ✅ Docker avec user non-root
- ✅ No debug mode en prod

#### 7. Cross-Site Scripting (XSS)
- ✅ Content-Type: application/json
- ❌ TODO: Input sanitization frontend

#### 8. Insecure Deserialization
- ✅ Safe (JSON only, no pickle/pickle-like)

#### 9. Using Components with Known Vulnerabilities
- [ ] npm audit régulier
- [ ] Dependabot enabled (GitHub)
- [ ] Updates mensuels

#### 10. Insufficient Logging & Monitoring
- ✅ Admin.log avec audit trail
- ✅ Prometheus metrics
- ❌ TODO: Alertes SMS/Email

---

## 🔍 Audit & Logging

### Ce qui est Loggé
```json
{
  "timestamp": "2026-04-05T10:30:00Z",
  "user": "admin",
  "action": "launch-server",
  "ip": "192.168.1.100",
  "preset": "GameMaster",
  "port": 2001,
  "status": "success"
}
```

### Retention Policy
- Logs actifs : 30 jours en `/app/logs/`
- Archive : S3/backup après 30 jours
- Suppression : 1 an

### Monitoring
```bash
# Vérifier les logs d'accès Nginx
tail -f /var/log/nginx/otea_access.log | grep login

# Alerter sur les erreurs critiques
grep ERROR /app/logs/backend.log
```

---

## 📦 Isolation des Services

### Docker Security
```yaml
backend:
  user: appuser:appuser  # Non-root
  cap_drop:
    - ALL
  cap_add:
    - NET_BIND_SERVICE
  read_only: true
  tmpfs:
    - /tmp
    - /var/run
  security_opt:
    - no-new-privileges:true
```

### Network Isolation
- Nginx : Host network (port 80/443)
- Backend : Internal network (port 3000 interne)
- DB : Internal network (port 5432 interne)

---

## 🚨 Incident Response

### Procédure en cas de Breach
1. **Immediate** (< 1h)
   - Isoler le service (`docker stop backend`)
   - Revoke ancien JWT_SECRET
   - Checker logs pour compromise

2. **Short-term** (< 24h)
   - Deploy nouveau secret
   - Force password reset pour tous les users
   - Audit access logs (logique JSON queries)

3. **Long-term** (< 1 week)
   - Post-mortem analysé
   - Security patches appliqués
   - Offboarding si accès non-autorisé

### Contacts d'Urgence
- Security team : security@example.com
- On-call : [ContactInfo]
- Escalation : [ManagerInfo]

---

## ✅ Pre-Deployment Checklist (voir CHECKLIST.md)

---

## 📅 Révision de Sécurité

- **Mensuel** : Vérifier vulnérabilités npm (`npm audit`)
- **Trimestriel** : Rotation des secrets
- **Annuel** : Audit de sécurité complet
- **Post-Incident** : Review immédiat des logs

