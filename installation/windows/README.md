# Installation Windows – OTEA Server

Ce dossier contient des exemples de scripts et instructions pour installer et lancer OTEA Server sur Windows.

## Méthodes proposées

### 1. Lancement manuel
- Ouvrir un terminal PowerShell ou CMD dans le dossier du projet
- Installer les dépendances :
  ```
  npm install
  ```
- Lancer le serveur :
  ```
  node js/server.js
  ```

### 2. Script PowerShell
- Utiliser le script `start.ps1` pour lancer le serveur facilement
- Peut être adapté pour démarrer automatiquement au boot (tâche planifiée)

### 3. Script Batch
- Utiliser le script `start.bat` pour un lancement rapide via double-clic

### 4. Service Windows (nssm)
- Installer [nssm](https://nssm.cc/)
- Configurer le service avec le fichier `nssm-config.txt` (exemple de paramètres)
- Permet de lancer le serveur en tant que service Windows (démarrage auto, redémarrage…)

## Variables d’environnement
- Voir `.env.example` pour les variables personnalisables (ports, chemins, etc.)

## Conseils
- Adapter le chemin vers ArmaReforgerServer.exe si besoin
- Ouvrir le port 3000 dans le firewall si accès distant
- Pour la production, privilégier un reverse proxy (Nginx, IIS) et HTTPS

---

Pour toute question ou contribution, voir le README principal du projet.
