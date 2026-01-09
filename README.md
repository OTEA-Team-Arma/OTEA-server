# Arma Reforger Server Manager

## Présentation

Ce projet est un gestionnaire de serveurs Arma Reforger léger, permettant d'administrer un ou plusieurs serveurs via une interface web moderne. Il permet de :
- Gérer des presets (sauvegardes de configurations)
- Modifier la configuration (joueurs, missions, mods)
- Piloter plusieurs serveurs en parallèle (multi-ports)
- Rechercher rapidement un preset dans le dashboard
- Sécuriser l'accès par identifiant/mot de passe

## Structure du projet

```
server_reforger/
├── index.html           # Interface utilisateur (Dashboard, Logs, Mods, Settings)
├── server.js            # Backend Node.js (API, gestion des serveurs)
├── package.json         # Dépendances (Express, Cors)
├── config.json          # Modèle de configuration de base
├── Design.css           # (optionnel) Styles additionnels
├── presets/             # Dossier contenant les fichiers JSON de vos différentes configurations
│   └── preset_*.json
└── readMe.txt           # Ancienne documentation (remplacée par ce README)
```

## Installation & Lancement

**Prérequis :**
- Node.js installé sur la machine hôte
- ArmaReforgerServer.exe accessible depuis le dossier du projet

**Installation :**
```bash
npm install
```

**Lancement de l'interface :**
```bash
node server.js
```

Accès :
- Ouvrir un navigateur à l'adresse http://localhost:3000

## Fonctionnalités principales

- **Dashboard** : Liste et recherche de tous les presets. Lancement/arrêt de chaque serveur sur un port dédié.
- **Gestion multi-serveurs** : Possibilité de lancer plusieurs serveurs en parallèle (un par port, via différents presets).
- **Recherche instantanée** : Filtre dynamique des presets par titre, port ou mission.
- **Logs** : Console en direct pour suivre les actions et messages du backend.
- **Sécurité** : Authentification basique (à personnaliser dans `server.js`).

## Utilisation multi-serveurs
- Chaque preset peut être lancé sur un port différent.
- Le bouton "Start" démarre un serveur Arma Reforger avec la configuration du preset.
- Le bouton "Stop" arrête le serveur associé à ce port.
- Plusieurs serveurs peuvent tourner en même temps, chacun sur son port.

## Conseils
- Chaque preset doit avoir un port unique si plusieurs serveurs sont lancés simultanément.
- Adapter le chemin d'accès à ArmaReforgerServer.exe si besoin.
- Modifier les identifiants dans `server.js` pour sécuriser l'accès.

## Personnalisation
- Les styles peuvent être modifiés dans `index.html` ou `Design.css`.
- Les presets sont stockés dans le dossier `presets/` (format JSON).

## Limitations
- Le statut "en ligne" ou "hors ligne" des serveurs n'est pas affiché en temps réel (amélioration possible).
- Le backend utilise des commandes Windows (taskkill, netstat) pour la gestion des processus.

---

Pour toute amélioration ou bug, n'hésitez pas à ouvrir une issue ou à proposer une PR !
