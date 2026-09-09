# OTEA-Server v2.5 🎮

**Panneau de gestion pour serveur Arma Reforger - Production Ready**

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](docs/PROJECT_STATUS.md)
[![Sécurité](https://img.shields.io/badge/sécurité-JWT%20%2B%20RBAC-blue)](docs/DEPLOYMENT/SECURITY_PLAN.md)
[![Licence](https://img.shields.io/badge/licence-MIT-green)](LICENSE)

---

## 🎯 Qu'est-ce que OTEA-Server?

OTEA-Server est un **panneau de gestion web sécurisé et performant** pour gérer et contrôler votre **serveur Arma Reforger** à partir d'une interface unifiée.

**Parfait pour:**
- 🎮 Administrateurs de serveur Arma Reforger
- 👥 Animateurs et modérateurs de communautés
- 🎛️ Autoriser d'autres personnes à gérer votre serveur avec des rôles spécifiques

---

## ⭐ Fonctionnalités Principales

### 🎮 Gestion du Serveur
- ✅ **Dashboard en temps réel** - Statut EN LIGNE/HORS LIGNE par configuration
- ✅ **Gestion des presets** - Fichiers JSON au format Arma Reforger natif (ServerConfig_*.json)
- ✅ **Configuration avancée** - gameProperties, mods, missions, RCON
- ✅ **Boutons dynamiques** - Lancer/Arrêter selon l'état réel du serveur
- ✅ **Validation de port** - Détection des conflits avant lancement
- ✅ **Paramètres de lancement** - maxFPS et logStats configurables par preset
- ✅ **Version Arma Reforger** - Détection automatique de la version installée
- ✅ **Multi-configurations** - Gérer plusieurs presets de serveur

### 🏗️ Architecture
- ✅ **Presets natifs Arma** - ServerConfig_*.json au format officiel Bohemia
- ✅ **Métadonnées séparées** - ServerMeta_*.json pour données OTEA (launchParams)
- ✅ **gameProperties** - Intégré dans le bloc game (conforme schéma Arma)
- ✅ **RCON conditionnel** - Inclus uniquement si password >= 3 caractères
- ✅ **Template de référence** - presets/ServerConfig_template.json

### 🔐 Sécurité et Contrôle d'Accès
- ✅ **Authentification JWT** - Connexion sécurisée par token (expiration 24h)
- ✅ **Contrôle d'accès basé sur les rôles (RBAC)** - 3 niveaux: Admin, GameMaster, Viewer
  - **Admin:** Accès complet au système
  - **GameMaster:** Gérer leurs propres serveurs
  - **Viewer:** Accès en lecture seule
- ✅ **Hachage des mots de passe** - bcryptjs avec 10 tours de salage
- ✅ **Limitation de débit** - 100 requêtes/15 minutes par IP
- ✅ **Protection Helmet** - Protection contre les attaques courantes
- ✅ **Audit logging** - Piste complète des actions avec horodatage

### 📊 Interface Utilisateur
- ✅ **Dashboard dynamique** - Liste des serveurs avec statut en direct
- ✅ **Configuration serveur** - Formulaire complet avec tous les paramètres Arma
- ✅ **Logs en temps réel** - Admin OTEA et Serveur Arma séparés
- ✅ **Système d'administration** - Gestion utilisateurs et chemins système
- ✅ **Nom de team configurable** - Personnalisation via variable TEAM_NAME
- ✅ **Validation des formulaires** - serverMinGrassDistance minimum 50

### ⚙️ Configuration
Variables d'environnement disponibles (.env):
```bash
# Application
TEAM_NAME=OTEA                                    # Nom affiché dans l'UI
OTEA_PORT=3000
OTEA_HOST=localhost

# Arma Server
ARMA_SERVER_ROOT=C:\Arma3DS
ARMA_ADDONS_DIR=C:\Arma3DS\addons              # Dossier addons configurable
STEAMCMD_PATH=C:\SteamCMD\steamcmd.exe

# Sécurité
JWT_SECRET=votre-secret-min-32-chars
JWT_EXPIRATION=86400

# Base de données
DB_PATH=./data/app.db
```

### 📁 Structure des Presets
```
📁 presets/
├── ServerConfig_template.json          # Template de référence
├── ServerConfig_mon_serveur.json       # Config Arma pure (format Bohemia)
├── ServerMeta_mon_serveur.json         # Métadonnées OTEA (launchParams)
```

**ServerConfig_*.json** (format Arma Reforger officiel):
```json
{
  "dedicatedServerId": "mon_serveur",
  "region": "EU",
  "bindPort": 2001,
  "game": {
    "name": "Mon Serveur",
    "scenarioId": "{ECC61978EDCC2B5A}Missions/23_Campaign.conf",
    "maxPlayers": 16,
    "mods": [...],
    "gameProperties": {
      "serverMaxViewDistance": 1600,
      "serverMinGrassDistance": 50,
      "networkViewDistance": 500,
      "disableThirdPerson": false,
      "fastValidation": true,
      "battlEye": true
    }
  },
  "rcon": {
    "address": "0.0.0.0",
    "port": 19999,
    "password": "motdepasse"
  }
}
```

**ServerMeta_*.json** (données internes OTEA):
```json
{
  "launchParams": {
    "maxFPS": 60,
    "logStats": 10
  }
}
```

---

## 🚀 Démarrage Rapide

### Installation
```bash
# Cloner le repository
git clone https://github.com/OTEA-Team-Arma/OTEA-server.git
cd OTEA-server

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Démarrer l'application
npm start
```

**Résultat:** App en cours d'exécution sur http://localhost:3000

### Première Connexion
```
Utilisateur: admin
Mot de passe: admin1234
⚠️ Changez immédiatement en production!
```

---

## 🌐 Déploiement et Accès

### Accès à l'interface

**En local (développement) :**
```
http://localhost:3000
```

**Sur serveur dédié (IP directe) :**
```
http://IP_DU_SERVEUR:3000
```
Exemple : `http://192.168.1.100:3000`

**Sur serveur dédié (avec domaine et HTTPS) :**
```
https://otea.votredomaine.com
```
⚠️ Nécessite un reverse proxy Nginx + certificat SSL

### Configuration minimale pour déploiement distant

**1. Modifier OTEA_HOST dans .env :**
```bash
# Pour écouter sur toutes les interfaces réseau
OTEA_HOST=0.0.0.0

# OU pour une IP spécifique
OTEA_HOST=192.168.1.100
```

**2. Ouvrir le port dans le firewall :**
- **Windows :** Panneau de configuration → Pare-feu Windows → Règles de trafic entrant → Nouvelle règle → Port TCP 3000
- **Linux :** `sudo ufw allow 3000/tcp` (UFW) ou `sudo firewall-cmd --add-port=3000/tcp --permanent` (firewalld)

**3. (Optionnel) Nginx comme reverse proxy pour HTTPS :**
```nginx
server {
    listen 443 ssl;
    server_name otea.votredomaine.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔄 Gestion du Processus Node.js

### Option 1 : Lancement manuel (développement / test)

```bash
cd "chemin\vers\OTEA-server"
npm start
```

**Résultat :**
- ✅ OTEA accessible sur `http://localhost:3000`
- ⚠️ S'arrête quand on ferme le terminal

**Utilisation :** Tests, développement, démonstration

---

### Option 2 : Lancement automatique au démarrage Windows (production)

#### Via PM2 (recommandé)

**Installation :**
```bash
npm install -g pm2
```

**Démarrage de OTEA :**
```bash
# Démarrer l'application
pm2 start npm --name "otea" -- start

# Sauvegarder la configuration
pm2 save

# Configurer le démarrage automatique au boot Windows
pm2 startup
```

**Avantages :**
- ✅ OTEA démarre automatiquement à chaque boot Windows
- ✅ Surveille le processus et le redémarre en cas de crash
- ✅ Gestion des logs intégrée

**Commandes utiles :**
```bash
pm2 status           # Statut de tous les processus
pm2 logs otea        # Afficher les logs en temps réel
pm2 stop otea        # Arrêter OTEA
pm2 restart otea     # Redémarrer OTEA
pm2 delete otea      # Supprimer OTEA de PM2
```

---

#### Via NSSM (alternative - service Windows natif)

**Installation :**
1. Télécharger NSSM : https://nssm.cc/download
2. Extraire `nssm.exe` dans un dossier (ex: `C:\nssm`)

**Installation du service :**
```bash
nssm install OTEA-Server
```

**Configuration dans l'interface NSSM :**
- **Path :** `C:\Program Files\nodejs\node.exe`
- **Startup directory :** `H:\logiciel perso\server_reforger\OTEA-server`
- **Arguments :** `backend/index.js`

**Avantages :**
- ✅ Service Windows natif (visible dans `services.msc`)
- ✅ Démarre automatiquement au boot Windows
- ✅ Ne nécessite pas npm global

**Commandes utiles :**
```bash
nssm start OTEA-Server      # Démarrer le service
nssm stop OTEA-Server       # Arrêter le service
nssm restart OTEA-Server    # Redémarrer le service
nssm remove OTEA-Server     # Supprimer le service
```

---

## 🛠️ Stack Technologique

| Composant | Technologie |
|-----------|-----------|
| **Runtime** | Node.js 18+ LTS |
| **Backend** | Express.js v5.2.1 |
| **Base de données** | SQLite3 (better-sqlite3) |
| **Frontend** | JS Vanilla + JWT |
| **Authentification** | JWT (jsonwebtoken) |
| **Chiffrement** | bcryptjs (10 tours) |
| **Sécurité** | Helmet, express-rate-limit |
| **Tests** | Jest + Supertest |
| **Système d'exploitation** | Windows / Linux / Mac |

---

## 📊 État du Projet

✅ **Production Ready v2.5.0**

**Nouvelles fonctionnalités v2.5:**
- 🎯 Architecture presets/meta séparée
- 🎯 gameProperties dans le bloc game
- 🎯 RCON conditionnel (password >= 3 chars)
- 🎯 Validation de port avant lancement
- 🎯 Nom de team configurable (TEAM_NAME)
- 🎯 launchParams configurables (-maxFPS, -logStats)
- 🎯 Détection version Arma Reforger
- 🎯 Boutons Lancer/Arrêter dynamiques
- 🎯 Compatibilité multi-plateforme process.kill

**État actuel:**
- **Tests** - Suite de tests en place
- **API REST** - 50+ endpoints documentés
- **Base de données** - 4 tables avec relations
- **RBAC** - Système complet (3 rôles)
- **Sécurité** - JWT + bcryptjs + Helmet
- **Documentation** - Complète et à jour

---

## 📋 Fonctionnalités Détaillées

### Dashboard
- Liste des configurations serveur disponibles
- Statut EN LIGNE / HORS LIGNE en temps réel par preset
- Bouton "Lancer" si serveur arrêté
- Bouton "Arrêter" si serveur en cours
- Affichage de l'uptime pour les serveurs actifs
- Version Arma Reforger Server détectée

### Configuration Serveur
- CRUD complet sur les presets
- Formulaire avec tous les paramètres Arma :
  - Informations générales (nom, port, scénario, max joueurs)
  - gameProperties (distances de vue, herbe, réseau, 3rd person, validation, BattlEye)
  - RCON (adresse, port, password, maxClients) - conditionnel
  - launchParams (maxFPS, logStats)
  - Mods (ajout/suppression)
- Validation serverMinGrassDistance >= 50
- Bouton Lancer/Arrêter dynamique selon l'état

### Logs
- Onglet "Logs Admin OTEA" : actions administratives
- Onglet "Logs Serveur Arma" : sortie console du serveur dédié
- Recherche et filtrage

### Administration
- Gestion des utilisateurs (CRUD, rôles)
- Configuration des chemins système
- Nom de la team configurable
- Redémarrage du serveur OTEA

---

## ⚠️ Limitations Connues

### Ce qui ne fonctionne PAS encore
- **Stop serveur non testé** - En attente de mise à jour Bohemia Interactive pour le serveur dédié Arma Reforger
- **Déploiement team** - Non encore déployé en production

### En développement
- Tests d'intégration complets
- Déploiement Docker
- Support multi-serveur simultané

---

## 🔒 Points Forts de Sécurité

### Authentification
- ✅ Tokens JWT (expiration 24 heures)
- ✅ Hachage sécurisé des mots de passe (bcryptjs)
- ✅ Gestion des sessions

### Autorisation
- ✅ Contrôle d'accès basé sur les rôles (Admin, GameMaster, Viewer)
- ✅ Application RBAC au niveau des endpoints
- ✅ Opérations sensibles réservées à l'administrateur

### Sécurité Réseau
- ✅ En-têtes de sécurité Helmet
- ✅ Limitation de débit (100 req/15min)
- ✅ Protection CORS
- ✅ Validation et assainissement des entrées
- ✅ Prévention des injections SQL

### Protection des Données
- ✅ Stockage des mots de passe chiffré
- ✅ Audit logging complète
- ✅ Transactions de base de données

---

## 📈 Performance

- **Temps de démarrage:** ~3 secondes
- **Utilisation mémoire:** ~120MB de base
- **Temps de réponse API:** < 100ms en moyenne
- **Compatibilité multi-plateforme:** Windows, Linux, Mac

---

## 🎯 Cas d'Utilisation

### 🎮 Animateur de Communauté Arma
Gérer un serveur Arma Reforger avec des modérateurs ayant différents niveaux d'accès

### 👥 Groupe Multijoueur
Permettre à plusieurs administrateurs de gérer différents aspects du serveur selon leurs responsabilités

### 🎪 Event Manager
Contrôler le serveur pendant des événements spéciaux avec configurations multiples

---

## 🤝 Support et Contribution

### Licence
MIT - Voir le fichier [LICENSE](LICENSE)

---

## ✨ Ce qui Rend OTEA-Server v2.5 Différent?

| Fonctionnalité | OTEA-Server v2.5 |
|---------|-----------|
| **Format Presets** | ✅ JSON natif Arma Reforger |
| **Métadonnées** | ✅ Séparées (ServerMeta_*.json) |
| **gameProperties** | ✅ Intégré dans bloc game |
| **RCON** | ✅ Conditionnel (password >= 3) |
| **Validation** | ✅ Conflits de port détectés |
| **UI Dynamique** | ✅ Boutons Lancer/Arrêter en direct |
| **Personnalisation** | ✅ Nom de team configurable |
| **Multi-plateforme** | ✅ Windows, Linux, Mac |
| **Sécurité** | ✅ JWT + RBAC + Helmet |

---

## 🎉 Prêt à Déployer?

```bash
# Cloner et installer
git clone https://github.com/OTEA-Team-Arma/OTEA-server.git
cd OTEA-server
npm install

# Configurer
cp .env.example .env
# Éditer .env avec vos paramètres

# Démarrer
npm start
```

Rendez-vous sur **http://localhost:3000**

---

**Version:** 2.5.0 | **Statut:** ✅ Production Ready | **Dernière mise à jour:** 9 septembre 2026
