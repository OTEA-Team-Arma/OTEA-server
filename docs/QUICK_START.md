# Quick Start - OTEA-Server v2.4

Get OTEA-Server running in 5 minutes!

---

## ⚡ 5-Minute Deploy (Recommended: Docker)

### Prerequisites
- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))
- OR Node.js 18+ installed ([Download](https://nodejs.org))

### Windows (PowerShell)

```powershell
# 1. Navigate to project
cd "H:\logiciel perso\server_reforger\OTEA-server"

# 2. Run deployment
.\deploy-docker.ps1 -Action deploy

# 3. Wait for startup (2-3 minutes)
# 4. Open browser
Start http://localhost:3000
```

### Linux/Mac (Bash)

```bash
# 1. Navigate to project
cd /path/to/OTEA-server

# 2. Make script executable
chmod +x deploy-docker.sh

# 3. Run deployment
./deploy-docker.sh deploy

# 4. Open browser
open http://localhost:3000  # Mac
xdg-open http://localhost:3000  # Linux
```

---

## 🔓 First Login

**Access the application:**
- **URL:** http://localhost:3000
- **Username:** `admin`
- **Password:** `admin1234`

⚠️ **CHANGE PASSWORD IMMEDIATELY!**

**Steps:**
1. Click username in top-right corner
2. Select "Change Password"
3. Enter old password + new password
4. Confirm

---

## ✅ Verify It's Working

### API Health Check
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 12345,
    "version": "2.4.0"
  }
}
```

### Web UI
- Visit http://localhost:3000
- Should see login page
- Login with admin credentials

### Test API with Token
```bash
# 1. Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin1234"}'

# Response will have: { "data": { "token": "..." } }

# 2. Use token to get servers
curl http://localhost:3000/api/servers \
  -H "Authorization: Bearer <TOKEN_HERE>"
```

---

## 🎮 Next Steps

### 1. Create Your First Server
1. Login to http://localhost:3000
2. Click "Create Server"
3. Fill in:
   - **Name:** "My Server"
   - **Port:** 2302
   - **Max Players:** 64
4. Click "Create"

### 2. Configure User Account
1. Click your username (top-right) → "Profile"
2. Update email address
3. Change password
4. Save

### 3. (Optional) Create Other Users
1. Click "Users" in admin menu
2. Click "Create User"
3. Fill details (username, email, role)
4. Share credentials with user
5. User logs in and changes password

### 4. (Optional) Add More Servers
Repeat step 1 with different ports:
- Server 1: Port 2302
- Server 2: Port 2303
- Server 3: Port 2304
- etc.

---

## 🔧 Common Configuration

### Change API Port
Edit `.env` file:
```env
PORT=3001  # Change 3000 to your port
```

Restart:
```bash
docker-compose restart
# OR
pm2 restart OTEA-Server
# OR
systemctl restart otea-server
```

### Access from Another Computer

⚠️ **For local network only!**

1. Find your IP: `ipconfig` (Windows) or `ifconfig` (Linux)
2. Access from other computer: `http://<YOUR_IP>:3000`
3. For internet access: see `../DEPLOYMENT/SECURITY_PLAN.md` first!

---

## 📚 Next: Production Setup

After you've verified everything works:

1. **Choose deployment option:**
   - Docker: `INSTALLATION/DOCKER.md`
   - Windows: `INSTALLATION/WINDOWS.md`
   - Linux: `INSTALLATION/LINUX.md`

2. **Setup security:**
   - `../DEPLOYMENT/SECURITY_PLAN.md`

3. **Pre-deployment checks:**
   - `../DEPLOYMENT/CHECKLIST.md`

4. **Full deployment guide:**
   - `../DEPLOYMENT/DEPLOYMENT_GUIDE.md`

---

## 🆘 Troubleshooting

### App Won't Start?

**Check Docker/Node.js running:**
```bash
docker ps  # Docker
node -v    # Node.js
```

**Check port 3000 is free:**
```bash
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/Mac

# If occupied, change PORT in .env
```

**See logs:**
```bash
docker logs otea-backend  # Docker
pm2 logs OTEA-Server      # PM2
npm start                 # Direct
```

### Can't Login?

- Double-check username/password
- Clear browser cache
- Try incognito window
- Check API is running: `curl http://localhost:3000/api/health`

### Port Already in Use?

```bash
# Change in .env
PORT=3001

# Restart
docker-compose restart  # Docker
```

---

## 📞 Need Help?

- **API Questions:** See `../REFERENCE/API.md`
- **Features:** See `../REFERENCE/FEATURES.md`
- **FAQ:** See `../REFERENCE/FAQ.md`
- **Full Deployment:** See `../DEPLOYMENT/DEPLOYMENT_GUIDE.md`

---

**Status: ✅ You're ready!**

Welcome to OTEA-Server v2.4! 🚀
