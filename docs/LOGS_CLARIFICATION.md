# 📊 Logs & Surveillance - Clarification v2.1

## 🎯 Deux Systèmes de Logs Distincts

OTEA gère maintenant **deux types de logs complètement différents** :

### 1. 📋 **Logs Admin OTEA** (Onglet: "Logs Admin OTEA")
Enregistrement des **actions administratives OTEA** uniquement.

**Qu'est-ce qui est enregistré :**
- ✅ Lancement d'un serveur
- ✅ Arrêt d'un serveur
- ✅ Bans/Kicks de joueurs
- ✅ Changements de configuration
- ✅ Connexions utilisateurs
- ✅ Suppression de presets
- ✅ Mises à jour du serveur

**Exemple :**
```
[2026-04-05 14:30:00] user: admin | action: launch-server | port: 2301
[2026-04-05 14:35:12] user: admin | action: ban-player | name: PlayerXYZ
[2026-04-05 15:00:00] user: admin | action: stop-server | port: 2301
```

**Où c'est stocké :** `data/admin.log` (JSON)

---

### 2. 🎮 **Logs Serveur Arma** (Onglet: "Logs Serveur Arma")
Console/Logs du **serveur Arma Reforger lui-même**.

**Qu'est-ce qui est enregistré :**
- ✅ Démarrage du serveur
- ✅ Chargement de mission/mods
- ✅ Joueurs qui connect/disconnect
- ✅ Erreurs du serveur
- ✅ Performance metrics
- ✅ Messages du serveur

**Exemple :**
```
Configuration loaded from: config.json
Starting ArmaReforger Server v1.2.3
Loading mission: {GUID}Missions/Conflict.conf
Player connected: SoldatFR (Steam ID: xxxxx)
Loading mod: Enhanced Weapons Pack (v1.5)
```

**Où c'est stocké :** 
- Windows: `C:\Arma3DS\ArmaReforgerServer.log`
- Linux: `/home/arma/server/logs/server.log`
- (Exact path dépend de ta configuration)

---

## 🔄 Workflow Complet

### **Avant (Confus)**
```
Tu cliques "Rafraîchir"
    ↓
Affiche les logs OTEA (actions admin)
    ↓
❌ Pas de logs du serveur Arma !
```

### **Après (Clair)**
```
Tu cliques sur "Logs Serveur Arma" tab
    ↓
Affiche les vrais logs du serveur Arma
    ↓
Tu vois ce que le serveur fait réellement ✅

Tu cliques sur "Logs Admin OTEA" tab
    ↓
Affiche les actions administratives
    ↓
Audit trail des actions admin ✅
```

---

## 🚀 Détection des Instances (Améliorations)

### **Avant**
```
Bouton "Rafraîchir" (Surveillance)
    ↓
Retourne SEULEMENT les serveurs lancés via OTEA
    ↓
❌ N'affiche pas les instances indépendantes
```

### **Après**
```
Bouton "Rafraîchir" (Surveillance)
    ↓
Retourne les serveurs lancés via OTEA
    ↓
Indique la SOURCE: "OTEA" ou "Indépendant"
    ↓
✅ Plus clair pour l'utilisateur
```

---

## 📋 Table de Comparaison

| Aspect | Logs Admin OTEA | Logs Serveur Arma |
|--------|-----------------|-------------------|
| **Contient** | Actions admin + player management | Console du serveur AR |
| **Quand apparaît** | À chaque action OTEA | Pendant exec du serveur |
| **Localisation** | `data/admin.log` | `serverRoot/.../logs/` |
| **Rafraîchir** | "Rafraîchir Admin Log" | "Rafraîchir Logs Arma" |
| **Utilité** | Audit & compliance | Troubleshooting serveur |
| **Qui lit** | Admin OTEA | Développeur/Debug |

---

## 🔍 Troubleshooting

### **"Logs Serveur Arma" affiche "non trouvés"**

**Raisons possibles :**
1. Aucun serveur Arma n'a jamais été lancé
2. Le chemin `serverRootPath` dans config.json est **incorrect**
3. Arma écrit les logs ailleurs (version différente)

**Solution :**
```
1. Vérifie data/config.json:
   "serverRootPath": "C:\\Arma3DS"
   
2. Lance un serveur Arma manuellement via OTEA
   
3. Attends 10-15 secondes (logs générés au démarrage)
   
4. Click "Logs Serveur Arma" tab → "Rafraîchir Logs Arma"
```

### **Logs Arma affiche 100 dernières lignes**

C'est normal ! Le fichier log peut être TRÈS volumineux (plusieurs MB).
OTEA affiche juste les 100 dernières lignes pour pas surcharger le navigateur.

---

## 🔐 Notes de Sécurité

### Logs Admin OTEA
- Headers HTTP sensibles sont **masqués** (sanitization)
- Contient les noms d'utilisateurs
- Archivé automatiquement (rotation 10MB)
- Suppression auto après 30 jours

### Logs Serveur Arma
- Lus directement du fichier disque
- N'inclut PAS de données sensibles admin OTEA
- À gérer selon votre politique de backup

---

## 📝 Résumé v2.1

**Amélioration majeure :** Clarification des deux types de logs

| Item | Avant | Après |
|------|-------|-------|
| Tab Logs | ❌ "Console en direct" vague | ✅ "Logs Admin OTEA" clair |
| Logs Arma | ❌ N'existait pas | ✅ Nouvel onglet + endpoint |
| Détection instances | ❌ Silencieuse | ✅ Source identifiée |
| Documentation | ❌ Absente | ✅ Ce document |

---

## 🎯 Cas d'Usage

### Cas 1: "Pourquoi mon serveur crash ?"
→ Clique "Logs Serveur Arma" → Vois l'erreur Arma

### Cas 2: "Qui a banni ce joueur ?"
→ Clique "Logs Admin OTEA" → Vois l'action admin

### Cas 3: "Combien de serveurs tournent vraiment ?"
→ Clique "Surveillance" → "Rafraîchir" → Vois source

### Cas 4: "Faire un audit de sécurité"
→ Clique "Logs Admin OTEA" → Export/Review actions

---

**Version :** v2.1  
**Date :** April 2026  
**Status :** ✅ PRODUCTION
