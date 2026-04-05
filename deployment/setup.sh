#!/bin/bash
# Script de setup OTEA Server - Production Ready

set -e

echo "════════════════════════════════════════════════════════════"
echo "  🚀 OTEA Server - Production Setup Script"
echo "════════════════════════════════════════════════════════════"

# === 1. Vérifications pré-requis ===
echo -e "\n📋 Vérification des pré-requis..."

command -v docker >/dev/null 2>&1 || { echo "❌ Docker non installé"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose non installé"; exit 1; }

echo "✅ Docker installé: $(docker --version)"
echo "✅ Docker Compose installé: $(docker-compose --version)"

# === 2. Créer structure de répertoires ===
echo -e "\n📁 Création de la structure..."

mkdir -p deployment/{ssl,logs/{nginx,app},monitoring,scripts,data/{db,backups}}
echo "✅ Répertoires créés"

# === 3. Copier .env ===
echo -e "\n🔐 Configuration des secrets..."

if [ ! -f deployment/.env.prod ]; then
    cp deployment/.env.example deployment/.env.prod
    echo "⚠️  Fichier .env.prod créé (À REMPLIR ABSOLUMENT)"
    echo "   Chemin: deployment/.env.prod"
    echo "   Éditez ce fichier et remplacez CHANGE_ME par les vraies valeurs"
else
    echo "✅ .env.prod existe déjà"
fi

# === 4. Permissions ===
echo -e "\n🔒 Configuration des permissions..."

chmod 600 deployment/.env.prod
chmod 755 deployment/scripts/*.sh 2>/dev/null || true
chmod 755 deployment/*.sh 2>/dev/null || true

echo "✅ Permissions configurées"

# === 5. Générer secrets si besoin ===
echo -e "\n🗝️  Génération des secrets..."

# Vérifier si les secrets ont besoin d'être générés
if grep -q "JWT_SECRET=GENERATE" deployment/.env.prod 2>/dev/null; then
    echo "⚝ Génération des secrets (openssl)..."
    
    JWT=$(openssl rand -base64 64)
    API_SECRET=$(openssl rand -base64 32)
    SESSION=$(openssl rand -base64 32)
    
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT}|" deployment/.env.prod
    sed -i "s|API_SECRET_KEY=.*|API_SECRET_KEY=${API_SECRET}|" deployment/.env.prod
    sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=${SESSION}|" deployment/.env.prod
    
    echo "✅ Secrets générés automatiquement"
else
    echo "✅ Secrets déjà configurés"
fi

# === 6. Vérifier certificats SSL ===
echo -e "\n🔒 Vérification SSL/TLS..."

if [ ! -f deployment/ssl/fullchain.pem ]; then
    echo "⚠️  Certificat SSL non trouvé"
    echo "   Pour Let's Encrypt sur le serveur:"
    echo "   sudo certbot certonly --standalone -d example.com"
    echo "   Chemin attendu: /etc/letsencrypt/live/example.com/"
    echo "   Copiez les fichiers dans deployment/ssl/"
else
    echo "✅ Certificat SSL trouvé"
fi

# === 7. Valider docker-compose ===
echo -e "\n✓ Validation docker-compose.yml..."

docker-compose -f deployment/docker-compose.yml config > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ docker-compose.yml valide"
else
    echo "❌ Erreur dans docker-compose.yml"
    exit 1
fi

# === 8. Build image ===
echo -e "\n🔨 Construction de l'image Docker..."

docker-compose -f deployment/docker-compose.yml build --no-cache

if [ $? -eq 0 ]; then
    echo "✅ Image Docker construite"
else
    echo "❌ Erreur de build"
    exit 1
fi

# === 9. Test de démarrage ===
echo -e "\n🧪 Test de démarrage..."

echo "   Démarrage des conteneurs (test)..."
docker-compose -f deployment/docker-compose.yml up -d

sleep 5

# Vérifier les conteneurs
RUNNING=$(docker-compose -f deployment/docker-compose.yml ps -q | wc -l)
echo "   Conteneurs en cours d'exécution: $RUNNING"

# Test health
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Service backend répond"
else
    echo "⚠️  Service backend ne répond pas encore (peut être normal)"
fi

# === 10. Summary ===
echo -e "\n════════════════════════════════════════════════════════════"
echo "  ✅ SETUP COMPLÉTÉ"
echo "════════════════════════════════════════════════════════════"

echo -e "\n📋 ACTIONS RESTANTES:\n"

echo "1. ⚠️  LIRE ET REMPLIR: deployment/.env.prod"
grep "CHANGE_ME" deployment/.env.prod | head -3 && echo "   ^^ Ces valeurs DOIVENT être remplacées" || echo "   ✅ Vérifiées"

echo ""
echo "2. 🔒 Certificat SSL/TLS:"
echo "   - Générez avec Let's Encrypt"
echo "   - Ou copiez depuis /etc/letsencrypt/live/example.com/"
echo "   - Destination: deployment/ssl/"

echo ""
echo "3. 🚀 Lancer en production:"
echo "   docker-compose -f deployment/docker-compose.yml up -d"

echo ""
echo "4. 📊 Vérifier logs:"
echo "   docker-compose -f deployment/docker-compose.yml logs -f backend"

echo ""
echo "5. ✅ Parcourir la CHECKLIST:"
echo "   deployment/CHECKLIST.md"

echo ""
echo "════════════════════════════════════════════════════════════"

# Offrir d'arrêter les conteneurs de test
echo ""
read -p "Arrêter les conteneurs de test? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose -f deployment/docker-compose.yml down
    echo "✅ Conteneurs arrêtés"
fi

echo ""
echo "✅ Done!"
echo ""
