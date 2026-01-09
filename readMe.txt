********************************
* Arma Reforger Server Manager *
********************************

Ce projet est un Server Manager léger conçu pour administrer un serveur Arma Reforger via une interface web.   Il permet de gérer des Presets (sauvegardes), de modifier la configuration (joueurs, missions, mods) et de piloter le processus du serveur.

? Structure du Projet
Le dossier racine doit être organisé comme suit :

 * index.html : L'interface utilisateur (Dashboard, Logs, Mods, Settings).

 * server.js : Le backend Node.js (votre fichier node.js renommé).

 * package.json : La liste des dépendances (Express, Cors).

 * config.json : Le modèle de configuration de base du jeu.

 presets : Dossier contenant les fichiers JSON de vos différentes configurations.

                 ********************************

? Installation & Lancement
Prérequis : Installer Node.js sur la machine hôte.
Installation : Ouvrir un terminal dans le dossier et exécuter :
   Bash

  npm install

 Lancement : Pour démarrer l'interface de gestion :

  Bash

 node server.js

Accès : Ouvrir un navigateur à l'adresse http://localhost:3000 (ou l'IP du serveur).

             ***********************************

?? Détails Techniques pour l'Administrateur
Logique Reforger : Contrairement à Arma 3, les missions sont des Mods. Le script injecte automatiquement le ModID dans la liste des mods et définit le scenarioId dans le JSON final.

Gestion des Ports : Chaque Preset doit avoir un port unique si vous comptez lancer plusieurs instances.

Logs : Le chemin vers les logs dans server.js doit être ajusté selon l'emplacement de ton dossier Documents/My Games/ArmaReforger/logs. (ou chemin approprié)

Commandes Windows : Le script utilise taskkill pour arrêter le serveur proprement via l'onglet "Servers".

            *********************************

sécurisation via utilisateur et mot de passe :
UTILISATEUR: admin
Mdp: OTEA

par défaut ;  a changer dans le fichier server.js

contient la fonction des  maj des mods (via  steam) 

            *******************************

 Mise en place :
 1/ allez dans l'onglet server, remplir les champs et sauvegarder
 2/  allez dans l'onglet Mods et Missions, remplir les champs et sauvegader
3/ aller dans le sahsbord ou apparaît votre server, lancez

la création d'un sever est un préset qui s’enregistre dans le dossier Presets


                                                  **************

les présets :
ils sont enregistrés automatiquement dans le dashboard
effacement possible à partir du dashboard

                                            **************

conseils :

Le fichier package.json : N'oubliez pas de lui fournir ou de lui dire de faire un npm init -y suivi de npm install express basic-auth.
Le chemin de l'exécutable : Dans le fichier server.js, assurez-vous que le nom ArmaReforgerServer.exe correspond bien au nom du fichier sur son serveur.
Tests : S'il a une erreur 404 ou Connection Refused, vérifiez simplement que le moteur (le script Node) est bien lancé dans sa console.
lien page web des mods reforger : https://reforger.armaplatform.com/workshop 





