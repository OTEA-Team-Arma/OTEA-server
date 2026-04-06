# 🔒 SECURITY FIX - v2.1 - April 2026

## Problèmes Identifiés & Corrigés

### 1. ❌ FAILLE CRITIQUE : admin.log contenait données sensibles 

**Problème :**
- ✗ Fichier `data/admin.log` fourni avec l'installation rempli de logs sensibles
- ✗ Exposerait : noms d'utilisateur, navigateurs, IPs, headers HTTP complets
- ✗ Violation de sécurité majeure lors du deployment en production

**Correction ✅:**
- [x] Vider le fichier `data/admin.log` à l'installation (contient désormais `[]`)
- [x] Ajouter `data/admin.log` au `.gitignore` (était déjà présent)
- [x] Nettoyer les headers sensibles lors de la sauvegarde (voir point 2)

---

### 2. ❌ FAILLE : Headers sensibles enregistrés dans logs

**Problème :**
- ✗ Headers HTTP complets stockés dans `logAdmin()`
- ✗ Incluait : `authorization`, `cookie`, `x-api-key`, etc.
- ✗ Credentials exposées en clair dans le JSON log

**Code problématique :**
```javascript
// AVANT (dangereux)
headers: safeDetails.req.headers  // ← Tout est copié !
```

**Correction ✅:**
```javascript
// APRÈS (sécurisé)
headers: _sanitizeHeaders(safeDetails.req.headers)

function _sanitizeHeaders(headers = {}) {
    const SENSITIVE_KEYS = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    const sanitized = { ...headers };
    SENSITIVE_KEYS.forEach(key => {
        if (sanitized[key]) {
            sanitized[key] = '[REDACTED]';  // ← Masqué !
        }
    });
    return sanitized;
}
```

---

### 3. ❌ PROBLÈME OPERATIONNEL : Pas de rotation des logs

**Problème :**
- ✗ Aucune purge automatique
- ✗ Aucune rotation
- ✗ Aucune limite de taille → `admin.log` peut croître indéfiniment
- ✗ En production = potentiel problème de stockage

**Correction ✅:**

Implémentation automatique de la **rotation par taille** + **nettoyage par date** :

```javascript
const MAX_LOG_SIZE_MB = 10;      // Rotation quand fichier > 10 MB
const MAX_LOG_FILES = 5;         // Garder max 5 backups (= 50 MB total)
const MAX_LOG_AGE_DAYS = 30;     // Supprimer logs > 30 jours

// Fonctionnement :
// - Fichier dépasse 10 MB → archivé en data/logs/admin.log.TIMESTAMP.bak
// - Nouveau fichier créé
// - Anciens fichiers > 30 jours supprimés automatiquement
// - Max 5 fichiers archivés conservés
```

#### Configuration

Dans **data/config.json** :
```json
{
  "logRotation": {
    "maxSizeMb": 10,          // Personnalisable
    "maxFiles": 5,            // Personnalisable
    "maxAgeDays": 30          // Personnalisable
  }
}
```

Variables d'environnement à ajouter (TODO) :
```bash
OTEA_LOG_MAX_SIZE_MB=10
OTEA_LOG_MAX_FILES=5
OTEA_LOG_MAX_AGE_DAYS=30
```

---

### 4. ❌ DOCUMENTATION : Configuration des ports peu claire

**Problème :**
- ✗ Utilisateurs ne savaient pas où configurer les ports
- ✗ Confusion entre : port OTEA (3000) vs ports Arma (2301+)
- ✗ Pas d'explication sur les "instances"

**Correction ✅:**
- [x] Nouveau document `docs/PORT_CONFIGURATION.md` expliquant :
  - Architecture ports
  - Comment configurer par preset
  - Best practices multi-instance
  - FAQ

**Clarification rapide :**
```
OTEA lui-même = port 3000 (web UI)
Serveur Arma 1 = port 2301 (configurable par preset)
Serveur Arma 2 = port 2302 (configurable par preset)
Serveur Arma 3 = port 2303 (configurable par preset)
```

---

### 5. ❌ CLARIFICATION : "Détection d'instances AR"

**Problème :**
- ✓ Utilisateur cherchait comment "paramétrer les ports à écouter"
- ✓ Confusion : détection automatique vs tracking local

**Clarification ✅:**
- [x] N'existe **PAS** de "détection automatique" d'instances
- [x] OTEA ne scanne pas les ports réseau pour auto-découvrir les serveurs
- [x] Les instances sont **locales** (en mémoire) : uniquement celles lancées via OTEA
- [x] Voir `docs/PORT_CONFIGURATION.md` section "Future Improvement"

---

## 📋 Checklist pour Package v2.1

- [x] `data/admin.log` vide (contient `[]`)
- [x] Fonction `logAdmin()` avec sanitisation des headers
- [x] Rotation automatique des logs (taille + date)
- [x] Création répertoire `data/logs/` pour backups
- [x] Documentation `docs/PORT_CONFIGURATION.md` créée
- [x] `data/config.json` mis à jour avec paramètres logs
- [x] Ce fichier créé (SECURITY_FIXES.md)

---

## 🔄 Déploiement

Pour les utilisateurs existants :

1. **Backup logs actuels (optionnel) :**
   ```bash
   cp data/admin.log data/logs/admin.log.backup.$(date +%s).bak
   ```

2. **Vider admin.log :**
   ```bash
   echo "[]" > data/admin.log
   ```

3. **Mettre à jour server.js** avec la nouvelle fonction `logAdmin()` (v2.1+)

4. **Redémarrer OTEA :**
   ```bash
   node js/server.js
   ```

La rotation démarre automatiquement à partir de la prochaine action loguée.

---

## ✅ Vérification Post-Déploiement

```bash
# Vérifier qu'admin.log est au démarrage vide
tail -5 data/admin.log
# Doit afficher : []

# Vérifier qu'il y a une action enregistrée
# (après connexion web UI)
tail -50 data/admin.log
# Doit afficher : [{"date":"...", "user":"admin", "action":"connexion", "details":{...}}]

# Vérifier que headers sensibles sont masqués
grep -i "authorization" data/admin.log
# Doit afficher : "[REDACTED]" (pas de vraies valeurs)

# Vérifier répertoire de rotation créé
ls -la data/logs/
# Doit exister et être vide initialement
```

---

## 🎯 Impact

| Catégorie | Avant | Après |
|-----------|-------|-------|
| **Sécurité** | Risk: HAUTE | Risk: LOW |
| **Log sensibles** | Oui ✗ | Non ✓ |
| **Stockage illimité** | Oui ✗ | Limité à 50MB ✓ |
| **Documentation ports** | Absente | Complète ✓ |

---

**Date fix :** April 2026  
**Version :** v2.1  
**Status :** ✅ DEPLOYED
