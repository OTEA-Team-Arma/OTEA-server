# 🚀 QUICK START - Configuration & Lancement d'un Serveur

## Situation avant (compliquée)
```
❌ Port caché dans le JSON du preset
❌ Pas de modal de configuration  
❌ Utilisateurs qui modifiaient le JSON manuellement
```

## Situation maintenant (simple) ✅

### **Étape 1: Aller au Dashboard**
```
Click sur l'onglet "Configuration Serveur" 
     ↓
Voir la liste des presets avec leurs PORTS
```

### **Étape 2: Lancer un serveur = Configurer le port**
```
Click sur le bouton "▶ Start"
     ↓
Un MODAL apparaît avec:
  - Nom du serveur
  - Port actuel
  - Champ ÉDITABLE pour modifier le port
     ↓
Change le port si besoin (ex: 2301 → 2302)
     ↓
Click "✅ Lancer"
     ↓
Serveur lancé sur le nouveau port !
```

---

## 🎯 Flux Complet

### **Dashboard (Configuration Serveur)**
```
┌──────────────────────────────────────────┐
│ Presets existants                        │
├──────────────────────────────────────────┤
│ Titre           │ Port  │ Scenario │ Act │
│ My Server GM    │ :2301 │ ...      │ ... │
│                 │ Config│          │     │
├──────────────────────────────────────────┤
│                 [▶ Start] [Delete] [Stop]│
└──────────────────────────────────────────┘
              ↓ Click "Start"
              
┌─────────────────────────────────────────┐
│ ⚙️ Configuration du Port                │
├─────────────────────────────────────────┤
│ Port du serveur Arma                    │
│ [2301_____________________]              │
│                                          │
│ ➜ Les joueurs se connecteront            │
│   sur: IP:PORT                          │
│ ➜ Recommandé: 2301-2399                 │
│                                          │
│ Serveur: My Server GM                   │
│ Port actuel: 2301                       │
│                                          │
│           [Annuler]  [✅ Lancer]        │
└─────────────────────────────────────────┘
         ↓ Edit et click "Lancer"
         
Serveur lancé sur :2301 ✅
```

---

## 💡 Changements Techniqes dans le Code

### **index.html**
✅ Nouveau modal `portConfigModal` ajouté
```html
<div id="portConfigModal">
  <input id="modalPortInput" type="number" min="1024" max="65535">
  ...
</div>
```

### **app.js**
✅ Trois nouvelles fonctions:
```javascript
showPortConfigModal(id)      // Affiche le modal
closePortModal()             // Ferme le modal
confirmPortAndLaunch()       // Valide & lance

// Modifiée:
launchServer(id)             // Affiche modal au lieu de lancer direct
```

✅ Améliorations visuelles:
```javascript
// Port dans le tableau → plus visible
<span style="background:#3a4a5a;...">:2301</span>
<small>➜ Configurable</small>

// Tooltip sur le bouton
title="Clique pour configurer le port"
```

---

## ✨ Cas d'Usage

### **Cas 1: Lancer un serveur avec le port par défaut**
```
1. Click "▶ Start"
2. Modal s'ouvre avec port 2301
3. Click "✅ Lancer" directement
→ Serveur lancé sur :2301
```

### **Cas 2: Changer le port à la volée**
```
1. Click "▶ Start"
2. Modal s'ouvre
3. Change 2301 → 2302 dans le champ
4. Click "✅ Lancer"
→ Serveur lancé sur :2302 (sans modifier le preset !)
```

### **Cas 3: Lancer 3 serveurs simultanément**
```
Preset 1: Click "▶ Start" → Port 2301 → Click "✅ Lancer"
Preset 2: Click "▶ Start" → Port 2302 → Click "✅ Lancer"
Preset 3: Click "▶ Start" → Port 2303 → Click "✅ Lancer"

Tous les 3 tournent en même temps :2301, :2302, :2303 ✅
```

---

## 🔒 Validation

Le port est **validé** avant lancement:
```javascript
if (!newPort || newPort < 1024 || newPort > 65535) {
    alert('⚠️ Port invalide! Utilisez un port entre 1024 et 65535.');
    return;
}
```

❌ Port < 1024 (réservés système)  
❌ Port > 65535 (hors limites)  
✅ Port 1024-65535 (valide)

---

## 🎮 Pour les Joueurs

Donne-leur cette adresse:
```
IP_DE_TON_SERVEUR:PORT_CONFIGURÉ

Exemples:
- 192.168.1.100:2301
- 203.0.113.42:2301
- mon-serveur.fr:2301
```

---

## 📋 Résumé

| Avant | Après |
|-------|-------|
| ❌ Port dans JSON | ✅ Modal de config |
| ❌ Pas de UI | ✅ Interface claire |
| ❌ Édition manuelle | ✅ Champ éditable |
| ❌ Pas de validation | ✅ Validation automatique |

**La configuration des ports est maintenant intuitive et directe !** 🎯
