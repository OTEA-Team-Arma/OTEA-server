# Checklist Pre-Deployment OTEA Server

## 🔴 CRITIQUES (Bloquer le déploiement si non complétés)

### Sécurité
- [ ] `.env.prod` créé et ALL secrets remplacés (pas de "CHANGE_ME")
- [ ] Certificat SSL valide (Let's Encrypt ou auto-signé)
- [ ] Default password changé : `admin1234` ≠ production
- [ ] HTTPS forcé en Nginx (port 80 → 301 redirect)
- [ ] Rate limiting configuré dans Nginx
- [ ] Headers de sécurité présents (HSTS, CSP, etc.)

### Infrastructure
- [ ] Docker daemon running (`docker ps` OK)
- [ ] Docker-compose.yml valide (`docker-compose config` OK)
- [ ] Volumes mappés correctement (Arma server path exists)
- [ ] Network isolation vérifiée (backend NOT accessible directement)
- [ ] Database initialized (si utilisé)

### Application
- [ ] osAbstraction.js testé (cross-platform binaries trouvés)
- [ ] Node.js v16+ installé (`node --version`)
- [ ] Dependencies installées (`npm install`)
- [ ] Config.json valide (JSON syntax)
- [ ] Admin.log accessible en écriture
- [ ] Presets folder avec exemples fonctionnels

### Arma Reforger
- [ ] ArmaReforgerServer binary présent au chemin configuré
- [ ] Permissions +x sur le binary (Linux)
- [ ] SteamCMD accessible (ou chemin valide)
- [ ] Preset "GameMaster" chargeable sans erreurs

---

## 🟡 IMPORTANTS (Non-bloquants, alertez l'admin)

### Performance
- [ ] RAM disponible minimum 4GB check (`free -h`)
- [ ] Disk space minimum 50GB disponible
- [ ] CPU cores minimum 2 vérifiés
- [ ] Network bandwidth test (1Mbps + par serveur)

### Backup
- [ ] Backup path accessible (write permissions)
- [ ] Backup script testé (manual run works)
- [ ] Archive strategy définie (S3/external storage)
- [ ] Restore procedure documentée

### Monitoring
- [ ] Prometheus endpoint responsive
- [ ] Grafana dashboards préparés (optionnel)
- [ ] Alert thresholds configurés
- [ ] Health check endpoint testé (`/api/health` → 200 OK)

### Logging
- [ ] Log file paths writeable
- [ ] Log rotation configuré (logrotate)
- [ ] Log aggregation destination définie (kibana/splunk)
- [ ] Audit trail accessible

### Documentation
- [ ] README_SECURITY.md distribué au team
- [ ] Incident response procedure en place
- [ ] Contact list pour emergency
- [ ] Network diagram documenté

---

## 🟢 OPTIONNELS (Nice-to-have, mais recommandé)

### Hardening Avancé
- [ ] Fail2ban configuré (Linux)
- [ ] SELinux/AppArmor policies appliquées
- [ ] UFW firewall règles (Linux)
- [ ] Secrets encryption at-rest (LUKS encryption)

### Monitoring Avancé
- [ ] ELK Stack déployé (Elasticsearch + Logstash + Kibana)
- [ ] Alerting SMS/Email configuré
- [ ] Uptime monitoring (Pingdom/Uptime Robot)
- [ ] Synthetic monitoring tests

### Compliance
- [ ] GDPR compliance vérifiée (si EU users)
- [ ] Data anonymization policy appliquée
- [ ] Export data feature testé (user right)
- [ ] Delete account workflow available

---

## 🚀 Procédure de Déploiement

### Phase 1 : Validation (1h)
```bash
# 1. Vérifier tous les fichiers
- ls -la deployment/
- cat .env.prod | grep CHANGE_ME && echo "FAIL" || echo "OK"

# 2. Valider Docker
- docker-compose config
- docker build -t otea-backend:latest .

# 3. Tests de base
- docker-compose up -d  # Démarrer
- sleep 10
- curl http://localhost:3000/api/health
- docker-compose logs backend
```

### Phase 2 : Staging (4h)
```bash
# 1. Déployer en staging
- docker-compose up -d

# 2. Tests fonctionnels
- curl https://localhost/  # Verify SSL
- Test preset creation via UI
- Test server launch (mock binary)
- Test audit logging

# 3. Tests de sécurité
- curl -I https://localhost/  # Check headers
- nmap localhost  # Port scan
- sqlmap localhost  # SQL injection test (si backend DB)
```

### Phase 3 : Production (2h)
```bash
# 1. Backup données actuelles
- cp -r data/ data.backup.$(date +%Y%m%d)

# 2. Déployer
- git pull origin main
- docker-compose pull
- docker-compose down
- docker-compose up -d

# 3. Vérification post-deployment
- docker-compose ps  # All running?
- docker-compose logs backend | tail -20
- curl https://example.com/api/health
- Manual test UI workflow
```

---

## ⚠️ Rollback Procedure

Si problèmes détectés post-deployment :

```bash
# 1. Arrêter
docker-compose down

# 2. Restaurer dari backup
cp -r data.backup.YYYYMMDD/* data/

# 3. Déployer version précédente
git checkout HEAD~1
docker-compose up -d

# 4. Analyser logs
docker logs otea-backend > /tmp/error.log
cat /tmp/error.log | grep ERROR
```

---

## 📊 Validation Checklist Items

### Test SSL/TLS
```bash
# Valider certificat
openssl x509 -in /etc/letsencrypt/live/example.com/fullchain.pem -text -noout

# Test connection
curl -I https://localhost
```

### Test Performance
```bash
# Load test
ab -n 100 -c 10 https://localhost/

# Check response times
curl -o /dev/null -s -w "%{time_total}\n" https://localhost/api/presets
```

### Test Authentication
```bash
# Valid credentials
curl -u admin:PASSWORD https://localhost/api/presets

# Invalid credentials
curl -u admin:wrongpass https://localhost/api/presets  # Should fail
```

### Test Cross-Platform
- [ ] Windows binary paths resolve correctly
- [ ] Linux binary paths resolve correctly
- [ ] osAbstraction.getPlatform() returns correct OS

---

## 👥 Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| DevOps | _______ | __/__ | _____ |
| Security | _______ | __/__ | _____ |
| QA | _______ | __/__ | _____ |
| Admin | _______ | __/__ | _____ |

---

## 📝 Notes Post-Deployment

Documenter les problèmes rencontrés et solutions appliquées :

```
Date: ________________
Issue: _________________________
Resolution: _________________________
Assignee: _________________________
```

