FROM node:18-alpine

WORKDIR /app

# Créer user non-root pour sécurité
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001

# Installer dependencies
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copier application
COPY . .

# Changer owner des fichiers
RUN chown -R appuser:appuser /app

# Passer à l'user non-root
USER appuser

# Créer les répertoires nécessaires
RUN mkdir -p logs presets data

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Port d'écoute (interne au conteneur)
EXPOSE 3000

# Démarrer l'application
CMD ["node", "js/server.js"]
