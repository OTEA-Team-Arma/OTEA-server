/**
 * backend/db/database.js
 * SQLite Database Setup & Migrations
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

// Get DB path from environment or config
const getDBPath = () => {
    if (process.env.DB_PATH) {
        return process.env.DB_PATH;
    }
    const { DATABASE } = require('../config');
    return DATABASE.PATH;
};

// Initialize database on first call
const getDB = () => {
    if (db) return db;
    
    const DB_PATH = getDBPath();
    
    // Create data directory if needed
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`[Database] Created directory: ${dataDir}`);
    }
    
    // Initialize database
    db = new Database(DB_PATH);
    
    // Performance
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    return db;
};

/**
 * Execute migrations
 */
function runMigrations() {
    const database = getDB();
    console.log('[Database] Running migrations...');

    // users table
    database.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'game_master', 'viewer')),
            email TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            is_active BOOLEAN DEFAULT 1
        );
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);

    // servers table
    database.exec(`
        CREATE TABLE IF NOT EXISTS servers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            port INTEGER UNIQUE NOT NULL,
            owner_id INTEGER NOT NULL,
            locked BOOLEAN DEFAULT 0,
            locked_by_admin_id INTEGER,
            locked_at DATETIME,
            config_json TEXT,
            mods TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(locked_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS idx_servers_owner ON servers(owner_id);
        CREATE INDEX IF NOT EXISTS idx_servers_port ON servers(port);
        CREATE INDEX IF NOT EXISTS idx_servers_locked ON servers(locked);
    `);

    // audit_logs table
    database.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            resource_type TEXT,
            resource_id INTEGER,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
    `);

    // server_bans table
    database.exec(`
        CREATE TABLE IF NOT EXISTS server_bans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            server_id INTEGER NOT NULL,
            player_name TEXT NOT NULL,
            player_id TEXT,
            banned_by_user_id INTEGER NOT NULL,
            reason TEXT,
            banned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            FOREIGN KEY(server_id) REFERENCES servers(id) ON DELETE CASCADE,
            FOREIGN KEY(banned_by_user_id) REFERENCES users(id) ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS idx_bans_server ON server_bans(server_id);
        CREATE INDEX IF NOT EXISTS idx_bans_player ON server_bans(player_name);
    `);

    console.log('[Database] ✅ Migrations completed');
}

/**
 * Create default admin user
 */
function createDefaultAdmin(database) {
    const bcrypt = require('bcryptjs');
    
    try {
        const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get();
        
        if (userCount.count === 0) {
            const defaultPassword = 'admin1234';
            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync(defaultPassword, salt);
            
            database.prepare(`
                INSERT INTO users (username, password_hash, role, email, is_active)
                VALUES (?, ?, ?, ?, ?)
            `).run('admin', passwordHash, 'admin', 'admin@localhost', 1);
            
            console.log('[Database] ✅ Default admin created (username: admin, password: admin1234)');
            console.log('[Database] ⚠️  CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION');
        }
    } catch (err) {
        if (!err.message.includes('UNIQUE constraint failed')) {
            console.error('[Database] Error creating default admin:', err.message);
        }
    }
}

/**
 * Initialize database
 */
function initDatabase() {
    try {
        const database = getDB();
        runMigrations();
        createDefaultAdmin(database);
        const DB_PATH = getDBPath();
        console.log(`[Database] 📊 Database initialized: ${DB_PATH}`);
        return database;
    } catch (err) {
        console.error('[Database] CRITICAL ERROR:', err.message);
        process.exit(1);
    }
}

module.exports = {
    initDatabase,
    getDB,
    getDBPath
};
