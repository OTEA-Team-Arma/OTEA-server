# 🎮 OTEA - Server Manager for Arma Reforger

**OTEA-server** is a complete web-based server manager for Arma Reforger multiplayer servers. Deploy, configure, and manage multiple Arma servers from a single unified interface.

**By OTEA Community** | 🌐 [www.otea.fr](https://www.otea.fr) | 📦 [GitHub](https://github.com/OTEA-Team-Arma/OTEA-server)  
*OTEA: Opération Tactique d'Extractions et d'Assauts*

> **Status**: Production-ready | **License**: MIT | **Community**: Open-source

---

## ✨ Features

✅ **Web-based Admin Panel** - Intuitive UI for server management  
✅ **Multi-Instance Support** - Run & manage multiple servers simultaneously  
✅ **Cross-Platform** - Windows and Linux (same codebase)  
✅ **Player Management** - Ban, kick, manage players in real-time  
✅ **Preset System** - Save & load server configurations instantly  
✅ **Audit Logging** - Complete action history for compliance  
✅ **Docker-Ready** - Production deployment with Docker Compose  
✅ **Secure** - Basic Auth + HTTPS support, audit trails  

---

## 🚀 Quick Start

### Windows (Local)

```bash
# Clone repo
git clone https://github.com/OTEA-Team-Arma/OTEA-server.git
cd OTEA-server

# Install dependencies
npm install

# Edit configuration
notepad data/config.json
# Set ArmaReforgerServer path (ex: C:\Arma3DS\ArmaReforgerServer.exe)

# Start
node js/server.js
# Open: http://localhost:3000
```

**Default Credentials:**
```
Username: admin
Password: admin1234
```

⚠️ **CHANGE IMMEDIATELY!**

---

### Linux / VPS / Docker

See [Installation Guide](docs/INSTALL.md) for detailed setup instructions.

**Quick Docker:**
```bash
docker-compose -f deployment/docker-compose.yml up -d
```

---

## 📋 What You Can Do

### Configuration
- Create server presets with mission/mod settings
- Configure multiple servers on different ports
- Save/load configurations instantly

### Management
- **Start/Stop** servers remotely
- **Update** Arma Reforger server binary
- View **server status** and uptime
- Monitor **player connections**

### Player Control
- **Ban** players (temporary or permanent)
- **Kick** players from active servers
- View **ban list** and manage bans
- Automatic ban expiration

### Monitoring
- View all connected players
- Server status dashboard
- Complete audit logging
- Update history tracking

---

## 📚 Documentation

- **[Installation Guide](docs/INSTALL.md)** - Complete setup for Windows/Linux/Docker
- **[Features](docs/FEATURES.md)** - Detailed feature breakdown
- **[API Reference](docs/API.md)** - REST API endpoints
- **[Deployment Guide](deployment/SECURITY_PLAN.md)** - Production setup & security
- **[FAQ](docs/FAQ.md)** - Common questions

---

## 🏗️ Architecture

```
OTEA-Server
├── Frontend (index.html + app.js)
│   └── Vanilla JS, no dependencies
├── Backend (Express + Node.js)
│   ├── osAbstraction.js (cross-platform layer)
│   ├── Player management endpoints
│   └── Preset system
├── Storage (JSON-based)
│   ├── config.json (system config)
│   ├── users.json (credentials)
│   ├── presets/ (server configs)
│   └── admin.log (audit trail)
└── Deployment
    ├── Docker setup
    ├── Nginx reverse proxy
    └── Security templates
```

---

## 🔒 Security

**Current Setup:**
- Basic Auth for authentication
- Audit logging of all actions
- Cross-platform binary validation
- Permission management

**Production Deployment:**
- HTTPS/TLS with Let's Encrypt
- Rate limiting
- CORS protection
- Input validation
- Secrets management

See [SECURITY_PLAN.md](deployment/SECURITY_PLAN.md) for production hardening guide.

---

## 🛠️ Tech Stack

- **Backend**: Node.js 16+ | Express.js
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Database**: JSON files (easily migrate to PostgreSQL)
- **Deployment**: Docker | Nginx reverse proxy
- **Cross-Platform**: Windows/Linux abstraction layer

---

## 📦 Installation

### Prerequisites
- Node.js 16+ (or Docker)
- Arma Reforger Server binary


### Manual Installation

```bash
# 1. Clone
git clone https://github.com/OTEA-Team-Arma/OTEA-server.git
cd OTEA-server

# 2. Install dependencies
npm install

# 3. Configure
cp data/config.json data/config.json.bak
# Edit path to your Arma server executable

# 4. Run
npm start
# or
node js/server.js
```

### Docker Installation

```bash
# Build image
docker-compose -f deployment/docker-compose.yml build

# Start
docker-compose -f deployment/docker-compose.yml up -d

# View logs
docker-compose -f deployment/docker-compose.yml logs -f
```

---

## 🎮 Usage

1. **Access**: Open http://localhost:3000
2. **Login**: Use admin credentials
3. **Create Preset**: Configure server settings (port, mods, mission)
4. **Launch**: Click "Start Server"
5. **Manage**: Monitor players, manage bans
6. **Update**: Check for Arma updates

---

## 🐛 Troubleshooting

### Server won't start
- Check ArmaReforgerServer path in `config.json`
-  Verify port not already in use
- Check logs console

### Admin users not working
- Ensure `data/users.json` exists
- Reset credentials: `echo "[]" > data/users.json`

### Players not visible
- Currently shows mock data (connect to real server for live data)

See [FAQ.md](docs/FAQ.md) for more help.

---

## 🎖️ About OTEA Community

**OTEA** (Opération Tactique d'Extractions et d'Assauts) is an established French Arma community.

This **OTEA-server** project was created to provide the community with professional server management tools for Arma Reforger.

**Learn more:**
- 🌐 **Website:** https://www.otea.fr
- 🎮 **Community:** Join us for tactical Arma operations
- 💬 **Discord:** Connect with players and admins

**OTEA-server is maintained by the community for the community** - whether you're running a server for OTEA members or the wider Arma community!

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Submit a Pull Request

Areas for contribution:
- Real player data integration (RCon protocol)
- Web UI improvements
- Multi-user management
- Performance optimization

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

---

## ⚠️ Disclaimer

OTEA is an **unofficial community tool** and is not affiliated with or endorsed by Bohemia Interactive.

Arma Reforger is a trademark of Bohemia Interactive.

---

## 📞 Support

- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **Community**: Join Arma community forums

---

## 🎯 Roadmap

- [ ] Real player data via RCon protocol
- [ ] Multi-user with role-based access
- [ ] Webhook integrations (Discord, Slack)
- [ ] Automated backups
- [ ] Performance metrics dashboard
- [ ] Community plugin system

---

**Made with ❤️ for the Arma Reforger community**

⭐ If you find this useful, please star the repo! ⭐
