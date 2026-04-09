# 📋 Guide de Déploiement - OTEA-Server v2.4

Choose your deployment option / Choisissez votre option de déploiement

---

## 🪟 Option 1 : Windows Server

**Avantages :**
- ✅ Simple et direct
- ✅ Pas de dépendances externes
- ✅ PM2 ou NSSM pour auto-restart
- ✅ Gestion Windows native

**👉 Guide complet:** [INSTALLATION/WINDOWS.md](../INSTALLATION/WINDOWS.md)

**Résumé rapide:**
```powershell
# 1. Installer Node.js (LTS)
# 2. npm install
# 3. npm start
# 4. Service Windows (NSSM ou PM2)
```

---

## 🐧 Option 2 : Linux Server

**Avantages :**
- ✅ Production-ready
- ✅ Systemd intégré
- ✅ Performance optimale
- ✅ Scaling facile

**👉 Guide complet:** [INSTALLATION/LINUX.md](../INSTALLATION/LINUX.md)

**Résumé rapide:**
```bash
# 1. Node.js 18+ install
# 2. npm install --production
# 3. Systemd service
# 4. systemctl enable OTEA-server
```

---

## 🐳 Option 3 : Docker (Recommandé)

**Avantages :**
- ✅ Marche partout (Windows + Linux + Mac)
- ✅ Isolation complète
- ✅ Multiple instances faciles
- ✅ Scaling horizontal
- ✅ CI/CD intégration

**👉 Quick Start:** [DOCKER_QUICKSTART.md](DOCKER_QUICKSTART.md) (5 minutes)

**👉 Détails techniques:** [INSTALLATION/DOCKER.md](../INSTALLATION/DOCKER.md)

**Résumé rapide:**
```bash
# Windows
.\deploy-docker.ps1 -Action deploy

# Linux/Mac
chmod +x deploy-docker.sh && ./deploy-docker.sh deploy
```

---

## 📊 Comparaison Rapide

| Aspect | Windows | Linux | Docker |
|--------|---------|-------|--------|
| **Facilité** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Flexibilité** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Maintenance** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Scaling** | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **CI/CD Ready** | ⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🔒 Sécurité Pour Tous les Déploiements

**Configuration `.env` requise:**
```env
NODE_ENV=production
JWT_SECRET=your-very-long-secret-key-min-32-chars
DB_PATH=/secure/path/app.db
```

**Étapes de sécurité:**
1. ✅ Utiliser HTTPS en production (certificats SSL)
2. ✅ Configurer un reverse proxy (Nginx)
3. ✅ Activer firewall / security groups
4. ✅ Rate limiting activé (intégré)
5. ✅ JWT validation (intégré)
6. ✅ Audit logs activés (intégré)

**👉 Détails:** [SECURITY_PLAN.md](SECURITY_PLAN.md)

---

## ✅ Avant de Déployer

1. **Lire la checklist:** [CHECKLIST.md](CHECKLIST.md)
2. **Comprendre la sécurité:** [SECURITY_PLAN.md](SECURITY_PLAN.md)
3. **Choisir votre option** (voir ci-haut)
4. **Suivre le guide correspondant:**
   - Windows → [INSTALLATION/WINDOWS.md](../INSTALLATION/WINDOWS.md)
   - Linux → [INSTALLATION/LINUX.md](../INSTALLATION/LINUX.md)
   - Docker → [DOCKER_QUICKSTART.md](DOCKER_QUICKSTART.md)

---

## 📚 Documentation Associée

| Document | Contenu |
|----------|---------|
| [QUICK_START.md](../QUICK_START.md) | Intro rapide (5 min) |
| [DOCKER_QUICKSTART.md](DOCKER_QUICKSTART.md) | Docker rapide |
| [SECURITY_PLAN.md](SECURITY_PLAN.md) | Sécurité détaillée |
| [CHECKLIST.md](CHECKLIST.md) | Pre-déploiement |
| [ADMIN_DEPLOYMENT.md](ADMIN_DEPLOYMENT.md) | Admin operations |
| [INSTALLATION/WINDOWS.md](../INSTALLATION/WINDOWS.md) | Windows détails |
| [INSTALLATION/LINUX.md](../INSTALLATION/LINUX.md) | Linux détails |
| [INSTALLATION/DOCKER.md](../INSTALLATION/DOCKER.md) | Docker détails |

---

## 🚀 Prêt à Déployer?

Sélectionnez votre option ci-haut et suivez le guide! 🎉

**Besoin d'aide?** Vérifiez:
- [REFERENCE/FAQ.md](../REFERENCE/FAQ.md) - Questions communes
- [REFERENCE/API.md](../REFERENCE/API.md) - Documentation API



**Voir :** `SECURITY_PLAN.md`

---

## 📝 Checklist de déploiement

- [ ] Node.js verifié (`node -v`)
- [ ] .env configuré
- [ ] `npm install` terminé
- [ ] Tests locaux OK (`npm test`)
- [ ] `npm start` démarre sans erreur
- [ ] API health check répond (`/api/health`)
- [ ] Login fonctionne
- [ ] Service/systemd configuré
- [ ] Auto-restart testé
- [ ] Logs/monitoring en place
- [ ] Backup database configuré
- [ ] HTTPS/SSL activé

**Voir :** `CHECKLIST.md`

---

## 🆘 Troubleshooting

**Port déjà utilisé ?**
```powershell
# Windows
netstat -ano | findstr :3000

# Linux
lsof -i :3000

# Changer dans .env : PORT=3001
```

**Erreur de permission (Linux) ?**
```bash
sudo chown -R $USER:$USER /opt/OTEA-server
chmod -R 755 /opt/OTEA-server/data
```

**Logs ?**
```bash
# Windows PM2
pm2 logs OTEA-Server

# Linux systemd
sudo journalctl -u OTEA-server -f

# Docker
docker logs -f otea-server
```

---

## 📞 Support

- **Documentation :** Voir `/docs/`
- **API Docs :** `REFERENCE/API.md`
- **Config :** `backend/config/index.js`

---

**Prêt ? Choisissez votre option et déployez ! 🚀**
