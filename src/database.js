/**
 * DATABASE LAYER
 * SQLite database for task history, settings, analytics
 */

const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

class Database {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('[Database] Init error:', err);
          reject(err);
        } else {
          console.log('[Database] Connected');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bot TEXT NOT NULL,
        command TEXT NOT NULL,
        params TEXT,
        result TEXT,
        error TEXT,
        duration INTEGER,
        success BOOLEAN,
        timestamp TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS connections (
        platform TEXT PRIMARY KEY,
        credentials TEXT,
        connected BOOLEAN,
        timestamp TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT,
        content TEXT,
        response TEXT,
        timestamp TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        timestamp TEXT
      )`
    ];

    for (const sql of tables) {
      await this.run(sql);
    }
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async logTask(task) {
    return await this.run(
      `INSERT INTO tasks (bot, command, params, result, error, duration, success, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.bot,
        task.command,
        JSON.stringify(task.params),
        JSON.stringify(task.result),
        task.error || null,
        task.duration,
        task.success ? 1 : 0,
        task.timestamp
      ]
    );
  }

  async getHistory(limit = 50) {
    return await this.all(
      `SELECT * FROM tasks ORDER BY id DESC LIMIT ?`,
      [limit]
    );
  }

  async getAnalytics() {
    const stats = await this.all(`
      SELECT 
        bot,
        COUNT(*) as total,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
        AVG(duration) as avgDuration
      FROM tasks
      GROUP BY bot
    `);
    
    return stats;
  }

  async saveConnection(platform, connection) {
    return await this.run(
      `INSERT OR REPLACE INTO connections (platform, credentials, connected, timestamp)
       VALUES (?, ?, ?, ?)`,
      [
        platform,
        JSON.stringify(connection.credentials),
        connection.connected ? 1 : 0,
        connection.timestamp
      ]
    );
  }

  async logPost(platform, content, response) {
    return await this.run(
      `INSERT INTO posts (platform, content, response, timestamp)
       VALUES (?, ?, ?, ?)`,
      [
        platform,
        JSON.stringify(content),
        JSON.stringify(response),
        new Date().toISOString()
      ]
    );
  }

  async saveSettings(settings) {
    for (const [key, value] of Object.entries(settings)) {
      await this.run(
        `INSERT OR REPLACE INTO settings (key, value, timestamp)
         VALUES (?, ?, ?)`,
        [key, JSON.stringify(value), new Date().toISOString()]
      );
    }
    return { success: true };
  }

  async loadSettings() {
    const rows = await this.all(`SELECT key, value FROM settings`);
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = JSON.parse(row.value);
    });
    return settings;
  }

  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) console.error('[Database] Close error:', err);
          else console.log('[Database] Closed');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = Database;
