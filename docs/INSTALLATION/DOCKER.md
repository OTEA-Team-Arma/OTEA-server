# Docker Installation - OTEA-Server v2.4

Complete guide for deploying OTEA-Server with Docker (Recommended).

---

## Advantages of Docker

✅ **Works everywhere** - Windows, Mac, Linux  
✅ **Isolation** - No system dependency conflicts  
✅ **Easy updates** - Just pull and restart  
✅ **Easy scaling** - Multiple instances  
✅ **Production-ready** - Alpine Linux, health checks  
✅ **Fast deployment** - 5 minutes to production  

---

## Prerequisites

**Docker Desktop** (all platforms):
- Windows: https://www.docker.com/products/docker-desktop
- Mac: https://www.docker.com/products/docker-desktop
- Linux: `sudo apt-get install docker.io docker-compose`

**Verify Installation:**
```bash
docker --version
docker-compose --version
```

---

## Quick Start (5 Minutes)

### Windows (PowerShell)

```powershell
cd "C:\apps\OTEA-server"
.\deploy-docker.ps1 -Action deploy
```

### Linux/Mac (Bash)

```bash
cd /opt/OTEA-server
chmod +x deploy-docker.sh
./deploy-docker.sh deploy
```

**Done!** Access http://localhost:3000

---

## Manual Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/OTEA-Team-Arma/OTEA-server.git
cd OTEA-server
```

### Step 2: Configure Environment

```bash
cp .env.example .env.docker
nano .env.docker  # Edit settings
```

**Essential Variables:**
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-long-random-secret-32-chars-min
DB_PATH=/app/data/app.db
```

### Step 3: Create Data Directories

```bash
# Create directories for persistence
mkdir -p data
mkdir -p presets
mkdir -p logs

# Set permissions
chmod 755 data presets logs
```

### Step 4: Build Image

```bash
docker build -t otea-server:2.4 .
```

### Step 5: Run Container

```bash
docker run -d \
  --name otea-server \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/presets:/app/presets \
  --restart unless-stopped \
  otea-server:2.4
```

**Verify:**
```bash
docker ps | grep otea-server
docker logs otea-server
curl http://localhost:3000/api/health
```

---

## Using docker-compose

**Most convenient method:**

### Step 1: Check Files

```bash
# Should have these files:
# - Dockerfile
# - docker-compose.yml (in deployment/)
# - .env.docker
```

### Step 2: Start Services

```bash
# Navigate to project root
cd /path/to/OTEA-server

# Start (builds automatically if needed)
docker-compose -f deployment/docker-compose.yml up -d
```

### Step 3: Verify

```bash
# Check containers
docker-compose -f deployment/docker-compose.yml ps

# Check health
curl http://localhost:3000/api/health

# View logs
docker-compose -f deployment/docker-compose.yml logs -f backend
```

---

## Dockerfile Breakdown

```dockerfile
# Build stage (optimized image)
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Final stage (minimal runtime)
FROM node:18-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -S nodejs -u 1001

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

USER nodejs
EXPOSE 3000

CMD ["node", "backend/server.js"]
```

**Benefits:**
- Alpine Linux (minimal = fast + secure)
- Multi-stage build (small final image)
- Non-root user (better security)
- Health checks (Docker restarts on failure)

---

## Common Operations

### View Logs

```bash
# All services
docker-compose -f deployment/docker-compose.yml logs

# Specific service
docker-compose -f deployment/docker-compose.yml logs -f backend

# Last 50 lines
docker-compose -f deployment/docker-compose.yml logs backend | tail -50
```

### Stop/Start Services

```bash
# Stop specific
docker-compose -f deployment/docker-compose.yml stop backend

# Start specific
docker-compose -f deployment/docker-compose.yml start backend

# Restart all
docker-compose -f deployment/docker-compose.yml restart

# Stop all (keep data)
docker-compose -f deployment/docker-compose.yml down

# Stop all (delete data - WARNING!)
docker-compose -f deployment/docker-compose.yml down -v
```

### Update Application

```bash
# Pull latest code
git pull

# Rebuild image
docker-compose -f deployment/docker-compose.yml build --no-cache

# Restart with new image
docker-compose -f deployment/docker-compose.yml up -d
```

### Scale Multiple Instances

**For load balancing, see `deployment/docker-compose.yml`:**

```yaml
backend:
  deploy:
    replicas: 2  # Run 2 instances
```

Then:
```bash
docker-compose -f deployment/docker-compose.yml up -d
```

---

## Volumes & Data Persistence

**Mounted volumes in docker-compose.yml:**

| Volume | Purpose | Path |
|--------|---------|------|
| `./data` | Database | `/app/data/app.db` |
| `./presets` | Configurations | `/app/presets/` |
| `./logs` | Application logs | `/app/logs/` |

**Data survives container restarts:**
```bash
# Stop container
docker-compose -f deployment/docker-compose.yml down

# Data still exists in ./data/ ./presets/ ./logs/

# Restart
docker-compose -f deployment/docker-compose.yml up -d
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs otea-server

# Check image exists
docker images | grep otea-server

# Rebuild
docker-compose -f deployment/docker-compose.yml build --no-cache
```

### Port Already in Use

```bash
# Find what's using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Change port in .env.docker
# PORT=3001

# Restart
docker-compose -f deployment/docker-compose.yml restart
```

### Out of Disk Space

```bash
# Check docker system
docker system df

# Clean up
docker system prune -a

# Or specifically
docker container prune
docker image prune
docker volume prune
```

### Performance Issues

```bash
# Check resource usage
docker stats otea-server

# Check container top processes
docker top otea-server

# Allocate more resources if needed
# Edit docker-compose.yml resources section
```

---

## Security Considerations

### .env.docker Security

```bash
# Restrict permissions
chmod 600 .env.docker

# Never commit to git
echo ".env.docker" >> .gitignore

# Use strong secrets
JWT_SECRET=generate-a-long-random-string-32-chars-min
```

### Network Security

**Default docker-compose.yml:**
- Backend NOT exposed directly
- Only ports 80/443 exposed (via Nginx)
- Internal communication via Docker network
- No port forwarding vulnerabilities

### Image Security

```bash
# Scan for vulnerabilities
docker scan otea-server:2.4

# Keep base images updated
docker pull node:18-alpine
docker-compose -f deployment/docker-compose.yml build --no-cache
```

---

## HTTPS with Nginx

**See `deployment/nginx.conf` for example:**

Configuration includes:
- SSL certificate paths (Let's Encrypt)
- HTTPS redirect
- Security headers
- Reverse proxy to backend
- Rate limiting

**Steps:**
1. Generate SSL cert (Let's Encrypt)
2. Update nginx.conf with cert paths
3. Update docker-compose.yml volume mounts
4. Restart

See `../DEPLOYMENT/SECURITY_PLAN.md` for details.

---

## Production Deployment

**Checklist:**
- [ ] `.env.docker` configured (secrets set)
- [ ] `docker-compose.yml` reviewed
- [ ] SSL certificate ready
- [ ] Firewall rules configured
- [ ] Backup strategy planned
- [ ] Health checks working
- [ ] Logs aggregation setup
- [ ] Monitoring alerts configured

See `../DEPLOYMENT/CHECKLIST.md` for full checklist.

---

## Commands Reference

```bash
# Build
docker-compose -f deployment/docker-compose.yml build

# Start (daemonized)
docker-compose -f deployment/docker-compose.yml up -d

# Stop
docker-compose -f deployment/docker-compose.yml down

# Logs
docker-compose -f deployment/docker-compose.yml logs -f

# Health check
curl http://localhost:3000/api/health

# Remove all data
docker-compose -f deployment/docker-compose.yml down -v

# Scale services
docker-compose -f deployment/docker-compose.yml up -d --scale backend=3

# Restart specific
docker-compose -f deployment/docker-compose.yml restart backend
```

---

## Next Steps

1. ✅ Deploy with Docker
2. ✅ Access http://localhost:3000
3. ✅ Change admin password
4. ✅ Test login and API

**Production:**
- Setup HTTPS with nginx
- Configure firewalling
- Setup monitoring
- Schedule backups
- Setup alerts

See `../DEPLOYMENT/SECURITY_PLAN.md` and `../DEPLOYMENT/CHECKLIST.md`

---

**Version:** 2.4.0  
**Last Updated:** 9 avril 2026  
**Status:** ✅ Production Ready
