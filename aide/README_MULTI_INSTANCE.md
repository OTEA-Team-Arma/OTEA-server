# 📋 Gestion Multi-Instances - OTEA Arma Reforger

Ce document définit la configuration technique pour faire tourner deux instances serveurs indépendantes à partir d'une seule installation de base (Single Binary / Multi-Profile).

## ⚙️ Principes Fondamentaux
Pour qu'une instance ne bloque pas l'autre, trois éléments doivent être uniques par serveur :
- **Ports Réseau** (Game & Query)
- **Dossier de Profil** (Logs & Saves)
- **Fichier de Configuration** (Preset JSON)

## 🛠️ Configuration des Instances
| Paramètre         | Instance #1 (Public)      | Instance #2 (Privée/Test) |
|-------------------|--------------------------|---------------------------|
| Port de Jeu       | 2001                     | 2002                      |
| Port Query        | 17777                    | 17778                     |
| Dossier Profil    | ./data/server_1          | ./data/server_2           |
| Fichier Preset    | preset_GameMaster.json   | preset_Training.json      |


## 🚀 Lignes de Commande (CLI)
Dans la plupart des cas, tu n'as PAS besoin de script batch ou bash : l'interface web OTEA permet de lancer et arrêter plusieurs serveurs directement.

Un script batch (Windows) ou bash (Linux) peut cependant servir de "roue de secours" pour lancer manuellement les serveurs si l'interface web ne fonctionne pas ou pour automatiser certains scénarios avancés.

Voici la structure à utiliser si besoin :

**Instance 1 :**
```bash
./ArmaReforgerServer -config "./presets/preset_GameMaster.json" -profile "./data/server_1" -port 2001 -backendlog
```
**Instance 2 :**
```bash
./ArmaReforgerServer -config "./presets/preset_Training.json" -profile "./data/server_2" -port 2002 -backendlog
```

## ⚠️ Notes de l'Ingénieur
- **Isolation des données :** Le paramètre `-profile` est critique. Sans lui, les deux serveurs tentent d'écrire dans le même fichier de log, ce qui provoque un crash immédiat du second processus.
- **Performance :** Chaque instance Reforger consomme entre 4GB et 8GB de RAM. Surveillance recommandée via le moniteur système lors du lancement simultané.
- **Mise à jour :** Une seule mise à jour SteamCMD met à jour le binaire pour les deux instances. Pas besoin de dupliquer les 20GB du jeu.
