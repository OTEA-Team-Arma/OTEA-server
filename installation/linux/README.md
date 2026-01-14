# Installation Linux – OTEA Server

Ce dossier contient des exemples de scripts et instructions pour installer et lancer OTEA Server sur Linux.

## Méthodes proposées

### 1. Docker + Nginx (recommandé)
- Utiliser `docker-compose.yml`, `Dockerfile` et `nginx.conf` fournis
- Adapté pour un déploiement moderne, isolé et facile à maintenir

### 2. Service systemd (Node.js natif)
- Utiliser le fichier `server.service` pour lancer le backend comme un service système
- Permet le démarrage automatique, la gestion des logs, le redémarrage auto

### 3. PM2 (gestionnaire Node.js)
- Utiliser le fichier `pm2.config.js` pour gérer le backend avec PM2 (monitoring, restart, logs)

### 4. Script Bash
- Utiliser le script `start.sh` pour un lancement manuel rapide

## Variables d’environnement
- Voir `.env.example` pour les variables personnalisables (ports, chemins, etc.)

## Conseils
- Adapter le chemin vers ArmaReforgerServer.exe si besoin
- Ouvrir le port 3000 dans le firewall si accès distant
- Pour la production, privilégier un reverse proxy (Nginx) et HTTPS

---

Pour toute question ou contribution, voir le README principal du projet.
