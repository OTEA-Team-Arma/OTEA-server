# Linux Installation - OTEA-Server v2.4

Complete guide for installing OTEA-Server on Linux/VPS.

---

## Prerequisites

1. **Linux Distribution:**
   - Ubuntu 18.04+ (Recommended)
   - Debian 10+
   - CentOS 7+
   - Any modern Linux distro

2. **Node.js 18 LTS** (or higher)
3. **curl** or **wget** (for downloads)

---

## Installation Steps

### Step 1: Install Node.js

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**CentOS/RHEL:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

**Verify Installation:**
```bash
node --version  # Should be v18.x
npm --version   # Should be 8.x+
```

### Step 2: Create App Directory

```bash
# Create directory
sudo mkdir -p /opt/OTEA-server
sudo chown $(whoami):$(whoami) /opt/OTEA-server

# Navigate to it
cd /opt/OTEA-server
```

### Step 3: Get the Code

**Using Git:**
```bash
git clone https://github.com/OTEA-Team-Arma/OTEA-server.git .
```

**Or extract from archive:**
```bash
tar -xzf OTEA-server.tar.gz
```

### Step 4: Install Dependencies

```bash
npm install --production
```

### Step 5: Configure Environment

```bash
cp .env.example .env
nano .env  # Edit with your settings
```

**Important Settings:**
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=generate-a-long-random-string
```

### Step 6: Test Locally

```bash
npm start
```

Should display:
```
Server listening on port 3000
```

Visit http://localhost:3000 in browser.

Press `Ctrl+C` to stop.

---

## Systemd Service Setup (Recommended)

**Create service file:**
```bash
sudo nano /etc/systemd/system/otea-server.service
```

**Paste this content:**
```ini
[Unit]
Description=OTEA Server
After=network.target

[Service]
Type=simple
User=otea-user
WorkingDirectory=/opt/OTEA-server
ExecStart=/usr/bin/node backend/server.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/otea-server/output.log
StandardError=append:/var/log/otea-server/error.log

[Install]
WantedBy=multi-user.target
```

**Create app user (optional but recommended):**
```bash
sudo useradd -r -s /bin/false otea-user
sudo chown -R otea-user:otea-user /opt/OTEA-server
sudo mkdir -p /var/log/otea-server
sudo chown otea-user:otea-user /var/log/otea-server
```

**Enable and start service:**
```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Enable auto-start
sudo systemctl enable otea-server

# Start service
sudo systemctl start otea-server

# Check status
sudo systemctl status otea-server
```

**Verify it's running:**
```bash
curl http://localhost:3000/api/health
```

---

## Using PM2 (Alternative)

**Install PM2 globally:**
```bash
npm install -g pm2
```

**Start the app:**
```bash
pm2 start backend/server.js --name "OTEA-Server"
```

**Enable auto-restart:**
```bash
pm2 startup systemd -u $(whoami) --hp /home/$(whoami)
pm2 save
```

**Check status:**
```bash
pm2 status
pm2 logs OTEA-Server
```

---

## Firewall Configuration

**UFW (Ubuntu):**
```bash
# Enable UFW
sudo ufw enable

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow OTEA-Server
sudo ufw allow 3000/tcp

# Verify
sudo ufw status
```

**firewalld (CentOS):**
```bash
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

---

## Nginx Reverse Proxy (Optional but Recommended)

**Install Nginx:**
```bash
sudo apt-get install -y nginx
# or
sudo yum install -y nginx
```

**Create config:**
```bash
sudo nano /etc/nginx/sites-available/otea-server
```

**Paste:**
```nginx
upstream otea_backend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://otea_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/otea-server /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

---

## HTTPS with Let's Encrypt

**Install Certbot:**
```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

**Generate certificate:**
```bash
sudo certbot certonly --standalone -d your-domain.com
```

**Update Nginx config for HTTPS:**
```bash
sudo nano /etc/nginx/sites-available/otea-server
```

Add SSL section (replace with your domain):
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://otea_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

**Test and restart:**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

**Auto-renew certificates:**
```bash
sudo crontab -e

# Add line:
0 3 * * * certbot renew --quiet && systemctl reload nginx
```

---

## Managing the Application

### Check Status

```bash
# Systemd
sudo systemctl status otea-server

# PM2
pm2 status

# Check if listening
netstat -tuln | grep 3000
# or
ss -tuln | grep 3000
```

### View Logs

```bash
# Systemd
sudo journalctl -u otea-server -f
# or
tail -f /var/log/otea-server/output.log

# PM2
pm2 logs OTEA-Server
```

### Stop/Start/Restart

```bash
# Systemd
sudo systemctl stop otea-server
sudo systemctl start otea-server
sudo systemctl restart otea-server

# PM2
pm2 stop OTEA-Server
pm2 start OTEA-Server
pm2 restart OTEA-Server
```

---

## Maintenance

### Regular Backups

```bash
# Daily backup to external storage
rsync -avz /opt/OTEA-server/data/ /backup/otea-server/$(date +%Y%m%d)/
```

### Update Application

```bash
# Stop
sudo systemctl stop otea-server

# Update code
cd /opt/OTEA-server
git pull
npm install --production

# Start
sudo systemctl start otea-server
```

### Monitor Disk Space

```bash
# Check disk usage
df -h

# Check database size
du -sh /opt/OTEA-server/data/

# Cleanup old logs if needed
rm /var/log/otea-server/output.log.*
```

---

## Troubleshooting

### Service Won't Start

**Check logs:**
```bash
sudo journalctl -u otea-server -n 50
```

**Check Node.js installation:**
```bash
which node
/usr/bin/node --version
```

**Manual test:**
```bash
cd /opt/OTEA-server
/usr/bin/node backend/server.js
```

### Port 3000 Already in Use

```bash
# Find process
lsof -i :3000

# Kill it
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Permission Denied

```bash
# Fix ownership
sudo chown -R otea-user:otea-user /opt/OTEA-server

# Fix logs directory
sudo mkdir -p /var/log/otea-server
sudo chown otea-user:otea-user /var/log/otea-server
```

### Connection Refused

```bash
# Check if app is listening
ss -tuln | grep 3000

# Check if firewall blocks it
sudo ufw status
```

---

## Security Recommendations

1. **Use Systemd service** (auto-restart on failure)
2. **Enable Nginx** with SSL/HTTPS
3. **Configure firewall** (UFW/firewalld)
4. **Use Let's Encrypt** for free SSL
5. **Strong password** (20+ characters)
6. **Backup regularly** to safe location
7. **Monitor logs** for suspicious activity
8. **Keep Node.js updated** (security patches)

See `../DEPLOYMENT/SECURITY_PLAN.md` for details.

---

## Next Steps

1. ✅ Application running (check with `systemctl status`)
2. ✅ Accessible at http://localhost:3000
3. ✅ Default login works and password changed

**Now:**
- Setup Nginx + HTTPS
- Configure firewall
- Setup automated backups
- Create users and servers
- Monitor logs

---

**Version:** 2.4.0  
**Last Updated:** 9 avril 2026
