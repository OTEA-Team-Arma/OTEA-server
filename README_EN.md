# Arma Reforger Server Manager

## Overview

This project is a lightweight Arma Reforger server manager, allowing you to administer one or more servers through a modern web interface. Features include:
- Manage presets (configuration backups)
- Edit server settings (players, missions, mods)
- Run multiple servers in parallel (multi-port)
- Quickly search for a preset in the dashboard
- Secure access with username/password

## Project Structure

```
server_reforger/
├── index.html           # User interface (Dashboard, Logs, Mods, Settings)
├── server.js            # Node.js backend (API, server management)
├── package.json         # Dependencies (Express, Cors)
├── config.json          # Base configuration template
├── Design.css           # (optional) Additional styles
├── presets/             # Folder containing your different JSON configuration files
│   └── preset_*.json
└── README.md            # This documentation
```

## Installation & Launch

**Requirements:**
- Node.js installed on the host machine
- ArmaReforgerServer.exe accessible from the project folder

**Install dependencies:**
```bash
npm install
```

**Start the interface:**
```bash
node server.js
```

Access:
- Open your browser at http://localhost:3000

## Main Features

- **Dashboard**: List and search all presets. Start/stop each server on its dedicated port.
- **Multi-server management**: Launch several servers in parallel (one per port, via different presets).
- **Instant search**: Dynamically filter presets by title, port, or mission.
- **Logs**: Live console to follow backend actions and messages.
- **Security**: Basic authentication (customize in `server.js`).

## Multi-server Usage
- Each preset can be launched on a different port.
- The "Start" button launches an Arma Reforger server with the preset's configuration.
- The "Stop" button stops the server running on that port.
- Multiple servers can run simultaneously, each on its own port.

## Tips
- Each preset must have a unique port if you want to run several servers at once.
- Adjust the path to ArmaReforgerServer.exe if needed.
- Change the credentials in `server.js` to secure access.

## Customization
- Styles can be edited in `index.html` or `Design.css`.
- Presets are stored in the `presets/` folder (JSON format).

## Limitations
- Server "online/offline" status is not displayed in real time (possible improvement).
- The backend uses Windows commands (taskkill, netstat) for process management.

---

For improvements or bug reports, feel free to open an issue or submit a PR!
