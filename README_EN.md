# Arma Reforger Server Manager

## Overview

This project is a lightweight Arma Reforger server manager, allowing you to administer one or more servers through a modern web interface. Features include:
- Manage presets (configuration backups)
- Edit server settings (players, missions, mods)
- Run multiple servers in parallel (multi-port)
- Quickly search for a preset in the dashboard
- Secure access with username/password and user roles (admin/user)
- Add new users via the web interface (admin only)

## Project Structure

```
server_reforger/
├── index.html           # User interface (Dashboard, Logs, Mods, Settings)
├── server.js            # Node.js backend (API, server management)
├── data/
│   ├── package.json     # Dependencies (Express, Cors)
│   ├── config.json      # Base configuration template
│   ├── users.json       # Persistent user and role list
│   └── admin.log        # Admin activity log (JSON)
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


**Default credentials:**
- Username: admin
- Password: admin1234

⚠️ It is strongly recommended to change the admin password on first login via the Users tab.
## Activity Log (admin)

A "Activity Log" tab is available only to administrators. It allows you to view all logins and important actions (user addition, preset deletion, server start/stop, password change).

The log is stored in the `data/admin.log` file (JSON format).
## Linux/Docker Deployment

The project is compatible with Docker and Nginx for deployment on a Linux server. See the `docker-compose.yml`, `Dockerfile`, and `nginx.conf` files for configuration.

Access:
- Open your browser at http://localhost:3000

## Main Features

- **Dashboard**: List and search all presets. Start/stop each server on its dedicated port.
- **Multi-server management**: Launch several servers in parallel (one per port, via different presets).
- **Instant search**: Dynamically filter presets by title, port, or mission.
- **Logs**: Live console to follow backend actions and messages.
- **Security**: Mandatory authentication (username/password) to access the interface.
- **User management**:
	- Two roles: administrator (admin) and regular user (user)
	- Admin can add new users via the "Users" tab in the web interface
	- Users are stored in the `users.json` file (persistent)
	- The "Users" tab is only visible to admins


## Multi-server Usage
- Each preset can be launched on a different port.
- The "Start" button launches an Arma Reforger server with the preset's configuration.
- The "Stop" button stops the server running on that port.
- Multiple servers can run simultaneously, each on its own port.

## Tips
- Each preset must have a unique port if you want to run several servers at once.
- Adjust the path to ArmaReforgerServer.exe if needed.
- Credentials are managed in `data/users.json` (edit manually or via the API).

## Customization
- Styles can be edited in `index.html` or `Design.css`.
- Presets are stored in the `presets/` folder (JSON format).
- Users are stored in `data/users.json` (JSON format, editable via the API).

## Limitations
- Server "online/offline" status is not displayed in real time (possible improvement).
- The backend uses Windows commands (taskkill, netstat) for process management (adapt for Linux if needed).
- Authentication is basic (HTTP Basic Auth): for stronger security, use HTTPS and/or a session/token system.

---

**Contact:**
- Forum: https://otea.forum-pro.fr/
- Website: http://www.otea.fr/

For improvements or bug reports, feel free to open an issue or submit a PR!
