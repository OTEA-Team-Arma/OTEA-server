
# Arma Reforger Server Manager / Gestionnaire de Serveurs OTEA

---

## 🇫🇷 Présentation

Ce projet est un gestionnaire de serveurs Arma Reforger léger, permettant d'administrer un ou plusieurs serveurs via une interface web moderne et responsive.

Fonctionnalités principales :
- Gérer des presets (sauvegardes de configurations)
- Modifier la configuration (joueurs, missions, mods)
- Piloter plusieurs serveurs en parallèle (multi-ports)
- Dashboard avec recherche rapide
- Sécuriser l'accès par identifiant/mot de passe
- Administration complète (Maintenance, Arma Update, Console en direct)

## 🇬🇧 Overview

This project is a lightweight Arma Reforger server manager, allowing you to administer one or more servers through a modern, responsive web interface.

Main features:
- Manage presets (configuration backups)
- Edit server settings (players, missions, mods)
- Run multiple servers in parallel (multi-port)
- Dashboard with quick search
- Secure access with username/password
- Complete Administration (Maintenance, Arma Update, Live Console)

---

## 🇫🇷 Structure du projet / 🇬🇧 Project Structure

```
OTEA-server/
├── index.html            # Interface web principale / Main web interface
├── server.js             # Backend Node.js (API, gestion serveurs) / Node.js backend
├── package.json          # Dépendances Node.js / Node.js dependencies
├── data/                 # Données persistantes / Persistent data
│   ├── users.json        # Identifiants et mots de passe / Usernames and passwords
│   └── config.json       # Modèle de configuration / Config template
├── presets/              # Configurations sauvegardées / Saved presets
│   └── preset_*.json     # Fichiers JSON de configuration / Preset JSON files
├── js/                   # Scripts frontend / Frontend scripts
│   ├── app.js            # Logique interface web / Web UI logic
│   └── server.js         # Backend Node.js
├── css/                  # Feuilles de style / CSS stylesheets
│   └── Design.css        # Styles personnalisés / Custom styles
├── img/                  # Images et favicon / Images and favicon
└── node_modules/         # Dépendances Node.js / Node.js dependencies
```

---

## 🇫🇷 Installation & Lancement / 🇬🇧 Installation & Launch

**FR**
- Prérequis : Node.js installé, ArmaReforgerServer.exe accessible
- Installation :
```bash
npm install
```
- Lancement :
```bash
node server.js
```

Par défaut, l'interface est accessible à l'adresse http://localhost:3000

**EN**
- Requirements: Node.js installed, ArmaReforgerServer.exe accessible
- Install dependencies:
```bash
npm install
```
- Start the interface:
```bash
node server.js
```

By default, the interface is available at http://localhost:3000

---

## 🇫🇷 Identifiants par défaut / 🇬🇧 Default credentials
- Utilisateur / Username: admin
- Mot de passe / Password: admin1234

⚠️ Changez ces identifiants au premier lancement !

---

## 🇫🇷 Navigation / 🇬🇧 Navigation

| Onglet / Tab | Fonction / Function |
|-------------|-----------------|
| **Dashboard** | Recherche et liste des presets / Search and list all presets |
| **Configuration Serveur** | Gestion centralisée des presets (liste + formulaire) / Manage presets (list + form) |
| **Administration** | Actions (Maintenance, Arma Update) + Monitoring (État serveurs, Console) / Actions + Monitoring |
| **Utilisateurs** (admin) | Gestion des accès / User management |

---

## 🇫🇷 Utilisation multi-serveurs / 🇬🇧 Multi-server Usage

### 🇫🇷 Lancement / 🇬🇧 Launch

1. **Configuration Serveur** : Créez des presets avec des ports différents (2001, 2002, etc.)
2. **Dashboard** : Sélectionnez un preset et cliquez **"Démarrer"**
3. **Administration → Surveillance** : Vérifiez l'état en temps réel
4. **Administration → Console** : Consultez les logs en direct

### 🇫🇷 Gestion Multi-Instances / 🇬🇧 Multi-Instance Management

**Principes / Principles :**
- OTEA gère nativement plusieurs instances
- Chaque preset = **1 configuration indépendante** / Each preset = 1 independent config
- Ports réseau **uniques** obligatoires / Unique ports required

**Exemple / Example :**

| Paramètre / Parameter | Preset #1 (Public) | Preset #2 (Privé) |
|---|---|---|
| Port | 2001 | 2002 |
| Nom / Name | Public Server | Test Server |
| Scénario / Scenario | GameMaster | Training |
| Joueurs / Players | 32 | 16 |

---

## 🇫🇷 Pages principales / 🇬🇧 Main Pages

### Dashboard
- Liste et recherche rapide de tous les presets
- Boutons de démarrage/arrêt
- Affichage du statut

### Configuration Serveur
- **Haut** : Liste des presets existants (edit/delete)
- **Bas** : Formulaire pour créer/modifier un preset
  - Port, nom serveur, nombre joueurs
  - Scénario (ID + nom)
  - Tableau dynamique des mods

### Administration (Layout 2 colonnes)
- **Gauche (Actions)** :
  - 🔧 Maintenance : Redémarrer OTEA
  - ⚙️ Arma Reforger Server : Mettre à jour
  - 👥 Player Management : En attente (Ban/Kick)
  
- **Droite (Monitoring)** :
  - 📊 Surveillance : État des serveurs, uptime
  - 💻 Console : Logs en temps réel, bouton Effacer

### Utilisateurs (Admin)
- Changer mot de passe personnel
- Ajouter des utilisateurs
- Gérer les droits

---

## 🇫🇷 Conseils / 🇬🇧 Tips

- ✅ Chaque preset doit avoir un **port unique**
- ✅ Monitorer via **Administration → Surveillance de serveurs**
- ✅ Les mods sont gérés dans **Configuration Serveur → Tableau des mods**
- ✅ Accessible sur **téléphone** (responsive design) - ajoutez en raccourci !

---

## 🇫🇷 Limitations / 🇬🇧 Limitations

- Backend Windows uniquement (adapter pour Linux si besoin)
- Authentification basique (HTTP Basic Auth)
- Player Management (Ban/Kick) : en attente d'intégration

---

## 🇫🇷 Personnalisation / 🇬🇧 Customization

- **Styles** : `css/Design.css`
- **Presets** : `presets/*.json`
- **Utilisateurs** : `data/users.json` ou Admin → Utilisateurs
- **Configuration** : `data/config.json`

---

## 🇫🇷 Contact / 🇬🇧 Contact

Pour toute amélioration ou bug : proposez une PR ou ouvrez une issue !
For improvements or bug reports: submit a PR or open an issue!
