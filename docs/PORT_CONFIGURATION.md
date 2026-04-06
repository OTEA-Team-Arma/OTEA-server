# Configuration des Ports et Détection d'Instances AR

## 🔍 Détection d'Instances AR - Comprendre le concept

### Qu'est-ce que la "détection d'instances AR en cours" ?

**Important :** Il n'existe **ACTUELLEMENT PAS** de "détection automatique" d'instances Arma Reforger existantes dans OTEA.

Le terme "instance en cours" fait référence à :
- Les serveurs que **VOUS** avez lancés via OTEA
- Stockés en mémoire dans la variable `runningServers` 
- Consultables via l'endpoint `/api/servers-status`

C'est une gestion **locale** (en mémoire), pas une détection réseau.

---

## 📡 Architecture Actuelle

```
┌─────────────────────────────┐
│  OTEA-server (Node.js)      │
│                              │
│  ┌──────────────────────┐   │
│  │  runningServers      │   │
│  │  (en mémoire)        │   │
│  │  │ Port 2001 → PID   │   │
│  │  │ Port 2002 → PID   │   │
│  │  │ Port 2003 → PID   │   │
│  └──────────────────────┘   │
│                              │
│  [/api/servers-status]       │ ← Retourne les serveurs tracés
│  [/api/launch]               │ ← Lance et enregistre
│  [/api/stop]                 │ ← Arrête et supprime du tracking
└─────────────────────────────┘

     └─────> Processus Arma Reforger externes
              (Port 2001, 2002, 2003...)
```

---

## ⚙️ Configuration des Ports

### 1️⃣ Port de Contrôle OTEA (Web UI)

OTEA lui-même écoute sur le port défini dans le code :

**Actuellement :** Port **3000** (hardcodé dans `server.js`)
- À modifier si conflit réseau
- À paramétrer via variable d'environnement (TODO)

```javascript
// Dans server.js (fin du fichier)
const PORT = process.env.OTEA_PORT || 3000;
app.listen(PORT, () => console.log(`OTEA listening on port ${PORT}`));
```

### 2️⃣ Ports des Instances Arma Reforger

Les serveurs Arma réels s'exécutent sur des ports **distincts**.

**Configuration par preset** (JSON) :

```json
{
  "id": "preset_GameMaster_EU",
  "name": "GameMaster Server EU",
  "port": 2302,           // ← PORT DU SERVEUR ARMA
  "serverName": "GM-EU",
  "maxPlayers": 64,
  "game": {
    "scenarioId": "{ID_MISSION}"
  }
}
```

**Configuration dans `data/config.json`** (défauts globaux) :

```json
{
  "comment": "Configuration système OTEA-server",
  "serverRootPath": "C:\\Arma3DS",
  "defaultRegion": "EU",
  "maxInstances": 5,
  "comment2": "Chaque instance utilise un port différent (voir presets)"
}
```

### 3️⃣ Comment spécifier les ports ?

#### Méthode A : Via Preset (Recommandé)
```json
{
  "id": "my_preset",
  "port": 2302,    // ← Spécifier ici
  "name": "Mon Serveur"
}
```
Puis lancer : `POST /api/launch` avec ce preset

#### Méthode B : Via API
```bash
curl -X POST -u admin:password123 \
  -H "Content-Type: application/json" \
  -d '{
    "port": 2302,
    "serverName": "Test Server",
    "maxPlayers": 32
  }' \
  http://localhost:3000/api/launch
```

#### Méthode C : Défaut (Port 2001)
Si aucun port spécifié → **Port 2001 par défaut**

```javascript
const port = config.port || 2001;  // ← Ligne 236 de server.js
```

---

## 🚀 Best Practices pour Multi-Instance

### Scenario : 3 serveurs simultanés

```
Preset 1: port 2301 (EU - 64 joueurs)
Preset 2: port 2302 (US - 32 joueurs)  
Preset 3: port 2303 (ASIA - 48 joueurs)

Tous tournent en parallèle sur la même machine OTEA
```

**Vérifier les ports disponibles :**

**Linux :**
```bash
netstat -tulpn | grep -E ':(230[1-9]|230[0-9])'
```

**Windows :**
```powershell
netstat -ano | findstr "230"
```

---

## 📋 Future Improvement : Auto-Discovery

**Actuellement manquant :** Détection automatique d'instances Arma Reforger existantes.

**Pour implémenter cela :** 

1. Scanner les ports actifs (Windows: `netstat`, Linux: `lsof`)
2. Envoyer UDP probe sur chaque port Arma
3. Parser la réponse du protocole Arma pour identifier instances

**Complexité :** Moyenne
**Impact :** Utile pour reprendre contrôle après redémarrage OTEA accidentally

---

## 🔧 Configuration Recommandée pour Production

```json
{
  "serverRootPath": "/opt/arma3ds",
  "backendLog": true,
  "maxInstances": 10,
  "ports": {
    "otea_webui": 3000,        // Via env var OTEA_PORT
    "arma_instances": [2301, 2302, 2303, 2304, 2305]
  },
  "log_rotation": {
    "max_size_mb": 10,
    "max_files": 5,
    "max_age_days": 30
  }
}
```

---

## ❓ FAQ Ports

**Q: Peut-on faire tourner 2 instances sur le même port ?**
R: Non, un port = une écoute unique. Utiliser des ports distincts.

**Q: Quel est le port min/max recommandé ?**
R: Éviter 0-1023 (système), utiliser 2300-2399 ou 5000+

**Q: Comment récupérer une instance orpheline ?**
R: Actuellement, faut tuer le processus manuellement (TODO: auto-discovery)

**Q: Les ports persistent après redémarrage OTEA ?**
R: Non, `runningServers` est en mémoire. À redémarrer via web UI.
