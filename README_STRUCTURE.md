# Structure du projet OTEA-server

## Arborescence

```
OTEA-server/
├── index.html            # Interface web principale (dashboard, logs, réglages, etc.)
├── Design.css            # (optionnel) Feuille de style CSS personnalisée
├── server.js             # Serveur Node.js (API, authentification, gestion des presets et logs)
├── package.json          # Dépendances Node.js et scripts de lancement
├── README.md             # Documentation principale du projet
├── data/                 # Données persistantes du serveur
│   ├── users.json        # Identifiant et mot de passe pour l'accès à l'interface
│   ├── admin.log         # Journal d'activité administrateur (JSON)
│   └── config.json       # Modèle de configuration serveur (optionnel)
├── presets/              # Dossier des configurations (presets) sauvegardées
│   └── preset_*.json     # Fichiers JSON de configuration de serveur
├── js/                   # Scripts JavaScript côté client (frontend)
│   └── app.js            # Logique de l'interface web (navigation, appels API, etc.)
├── img/                  # Images utilisées par l'interface (logos, signatures, etc.)
├── css/                  # Feuilles de style CSS additionnelles (si besoin)
└── node_modules/         # Dépendances Node.js installées automatiquement (ne pas modifier)
```

## Fonction de chaque dossier/fichier

- **index.html** : Page principale de l'interface web (tableaux, formulaires, navigation).
- **Design.css** : Styles personnalisés pour l'interface (optionnel, peut être intégré dans index.html).
- **server.js** : Backend Node.js. Sert l'interface, gère l'authentification, les presets, les logs, et les actions serveur.
- **package.json** : Liste les dépendances (express, basic-auth, etc.) et les scripts de démarrage.
- **README.md** : Documentation d'installation, d'utilisation et de structure du projet.

### Dossier `data/`
- **users.json** : Contient l'identifiant et le mot de passe pour accéder à l'interface (modifiables).
- **admin.log** : Journal d'activité administrateur (connexion, changements, actions critiques).
- **config.json** : Modèle de configuration serveur (utilisé pour générer des presets).

### Dossier `presets/`
- Contient tous les fichiers de configuration de serveur sauvegardés (un fichier JSON par preset).

### Dossier `js/`
- **app.js** : Code JavaScript du frontend (navigation par onglets, appels API, gestion dynamique de l'UI).

### Dossier `img/`
- Images utilisées dans l'interface (logos, signatures, etc.).

### Dossier `css/`
- Feuilles de style CSS additionnelles (si besoin).

### Dossier `node_modules/`
- Toutes les dépendances Node.js installées automatiquement par npm. Ne pas modifier manuellement.

---

Pour toute question ou amélioration, consulte le README principal ou ouvre une issue sur le dépôt.

**Contact :**
- Forum : https://otea.forum-pro.fr/
- Site : http://www.otea.fr/
