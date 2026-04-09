# 🐳 OTEA-Server Docker - Quick Start Guide

## 5 minutes pour déployer en Docker

### ✅ Prérequis

1. **Docker Desktop** installé
   - Windows: https://www.docker.com/products/docker-desktop
   - Mac: https://www.docker.com/products/docker-desktop
   - Linux: `sudo apt-get install docker.io docker-compose`

2. **Vérifier l'installation**
   ```bash
   docker --version
   docker-compose --version
   ```

---

## 🚀 Déploiement Rapide

### Option A : Script automatisé (Recommandé)

#### Sur Windows (PowerShell) :
```powershell
# Navigation au dossier projet
cd H:\logiciel perso\server_reforger\OTEA-server

# Lancer le déploiement
.\deploy-docker.ps1 -Action deploy
```

#### Sur Linux/Mac (Bash) :
```bash
cd /path/to/OTEA-server

# Rendre exécutable
chmod +x deploy-docker.sh

# Lancer le déploiement
./deploy-docker.sh deploy
```

### Option B : Docker-Compose manuel

```bash
# 1. Aller au dossier
cd OTEA-server

# 2. Configurer l'environnement (si pas déjà fait)
cp .env.example .env

# 3. Démarrer les containers
docker-compose -f deployment/docker-compose.yml up -d

# 4. Vérifier le statut
docker-compose -f deployment/docker-compose.yml ps

# 5. Voir les logs
docker-compose -f deployment/docker-compose.yml logs -f backend
```

---

## 🌐 Accès à l'application

Une fois déployée, vous pouvez accéder à:

- **API Backend** : http://localhost:3000
- **Health Check** : http://localhost:3000/api/health
- **Web UI** : http://localhost:3000/

**Identifiants par défaut :**
```
Username: admin
Password: admin1234
```

⚠️ **IMPORTANT** : Changez ces identifiants en production !

---

## 📊 Commandes Utiles

### Voir le statut des containers
```bash
docker-compose -f deployment/docker-compose.yml ps
```

### Voir les logs
```bash
# Backend
docker-compose -f deployment/docker-compose.yml logs -f backend

# Nginx
docker-compose -f deployment/docker-compose.yml logs -f nginx

# Tous les logs
docker-compose -f deployment/docker-compose.yml logs -f
```

### Redémarrer les containers
```bash
docker-compose -f deployment/docker-compose.yml restart
```

### Arrêter les containers
```bash
docker-compose -f deployment/docker-compose.yml down
```

### Supprimer les données (ATTENTION!)
```bash
docker-compose -f deployment/docker-compose.yml down -v
```

---

## ⚙️ Configuration Avancée

### Changer le port
Éditer `.env` :
```env
PORT=3001  # Au lieu de 3000
```

### Configurer la base de données
Éditer `.env` :
```env
DB_PATH=/app/data/app.db
```

### Activer HTTPS (Let's Encrypt)
Voir `../SECURITY_PLAN.md`

### Volumes persistants
Les données sont sauvegardées dans:
- `./data/` - Base de données SQLite
- `./presets/` - Fichiers de configuration

---

## 🔒 Sécurité - Checklist

- [ ] Changé le mot de passe admin
- [ ] Configurer JWT_SECRET en .env
- [ ] Activer HTTPS (si production)
- [ ] Configurer le firewall/security groups
- [ ] Backup de `./data/` régulier
- [ ] Logs monitoring en place

---

## 🛠️ Troubleshooting

### Port 3000 déjà utilisé
```bash
# Voir qui utilise le port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/Mac

# Changer le port dans .env
PORT=3001
```

### Containers ne démarrent pas
```bash
# Voir les erreurs
docker-compose -f deployment/docker-compose.yml logs

# Reconstruire l'image
docker-compose -f deployment/docker-compose.yml build --no-cache

# Redémarrer
docker-compose -f deployment/docker-compose.yml up -d
```

### Problème de permission (Linux)
```bash
sudo chown -R $USER:$USER OTEA-server
chmod -R 755 OTEA-server
```

### Base de données corrompue
```bash
# Supprimer la DB (elle sera recréée)
rm data/app.db

# Redémarrer
docker-compose -f deployment/docker-compose.yml restart
```

---

## 📈 Scaling & Production

### Multiple instances avec load balancing
Voir `../../../deployment/docker-compose.yml` - sections nginx et backend

### Environment production
Créer `.env.prod` :
```env
NODE_ENV=production
LOG_LEVEL=warn
RATE_LIMIT_MAX=1000
JWT_EXPIRES_IN=24h
```

### Monitoring & Logs
Les logs sont sauvegardés dans:
- `./deployment/logs/app/` - Application logs
- `./deployment/logs/nginx/` - Nginx access/error logs

---

## 📝 Scripts Disponibles

### Windows PowerShell
```powershell
.\deploy-docker.ps1 -Action deploy      # Full deployment
.\deploy-docker.ps1 -Action start        # Start containers
.\deploy-docker.ps1 -Action stop         # Stop containers
.\deploy-docker.ps1 -Action restart      # Restart containers
.\deploy-docker.ps1 -Action logs         # View backend logs
.\deploy-docker.ps1 -Action health       # Health check
.\deploy-docker.ps1 -Action clean        # Remove all
```

### Linux/Mac Bash
```bash
./deploy-docker.sh start      # Start containers
./deploy-docker.sh stop       # Stop containers
./deploy-docker.sh restart    # Restart containers
./deploy-docker.sh logs       # View backend logs
./deploy-docker.sh health     # Health check
./deploy-docker.sh clean      # Remove all
```

---

## 🆘 Support & Documentation

- **API Documentation** : `../REFERENCE/API.md`
- **Configuration** : `backend/config/index.js`
- **Deployment Guide** : `../DEPLOYMENT_GUIDE.md`
- **Security Plan** : `../SECURITY_PLAN.md`
- **Checklist** : `../CHECKLIST.md`

---

**Prêt ? Lancez le déploiement ! 🚀**
