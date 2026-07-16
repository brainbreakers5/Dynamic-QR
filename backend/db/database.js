const { Pool } = require('pg');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

let usePostgres = false;
let pgPool = null;
let sqliteDb = null;

const db = {
  async initialize() {
    console.log('Connecting to database...');
    
    // Check if PG credentials are provided
    const hasPgCreds = process.env.DB_HOST && process.env.DB_PASSWORD;
    
    if (hasPgCreds) {
      try {
        pgPool = new Pool({
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT || '5432', 10),
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME || 'postgres',
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 5000 // fail fast if unreachable
        });

        // Test the connection
        await pgPool.query('SELECT 1');
        usePostgres = true;
        console.log('Connected to PostgreSQL database successfully.');

        // Initialize PG tables and functions
        await this.initPostgres();
        return;
      } catch (err) {
        console.warn(`\n⚠️ PostgreSQL connection failed: ${err.message}`);
        console.warn('Falling back to local SQLite database for development...\n');
        if (pgPool) {
          await pgPool.end().catch(() => {});
        }
      }
    } else {
      console.log('No PostgreSQL credentials found. Using local SQLite database...');
    }

    // SQLite Fallback
    usePostgres = false;
    const dbDir = __dirname;
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path.join(dbDir, 'database.sqlite');
    sqliteDb = new DatabaseSync(dbPath);
    this.initSqlite();
    console.log('SQLite database initialized successfully at', dbPath);
  },

  async initPostgres() {
    // Create compatibility functions
    await pgPool.query(`
      CREATE OR REPLACE FUNCTION date(t timestamp) RETURNS date AS $$
      BEGIN
        RETURN t::date;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION date(t timestamp with time zone) RETURNS date AS $$
      BEGIN
        RETURN t::date;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION date(t text) RETURNS date AS $$
      BEGIN
        RETURN t::date;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION date(base text, modifier text) RETURNS date AS $$
      BEGIN
        IF base = 'now' THEN
          RETURN (CURRENT_DATE + modifier::interval)::date;
        END IF;
        RETURN base::date + modifier::interval;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create tables
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS qr_codes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        short_id TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        destination_content TEXT NOT NULL,
        customization_settings TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        is_favorite INTEGER DEFAULT 0,
        folder TEXT DEFAULT 'General',
        scan_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS scan_logs (
        id SERIAL PRIMARY KEY,
        qr_id INTEGER NOT NULL,
        ip_address TEXT,
        country TEXT,
        city TEXT,
        device TEXT,
        browser TEXT,
        operating_system TEXT,
        referrer TEXT,
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(qr_id) REFERENCES qr_codes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used INTEGER DEFAULT 0
      );
    `);
  },

  initSqlite() {
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS qr_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        short_id TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        destination_content TEXT NOT NULL,
        customization_settings TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        is_favorite INTEGER DEFAULT 0,
        folder TEXT DEFAULT 'General',
        scan_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS scan_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        qr_id INTEGER NOT NULL,
        ip_address TEXT,
        country TEXT,
        city TEXT,
        device TEXT,
        browser TEXT,
        operating_system TEXT,
        referrer TEXT,
        scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(qr_id) REFERENCES qr_codes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS password_resets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0
      );
    `);
  },

  prepare(sql) {
    if (usePostgres) {
      let paramIndex = 1;
      let pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      if (/^\s*insert\s+into/i.test(pgSql) && !/returning/i.test(pgSql)) {
        pgSql += ' RETURNING id';
      }

      return {
        async run(...params) {
          const res = await pgPool.query(pgSql, params);
          const lastInsertRowid = res.rows[0]?.id || null;
          return { lastInsertRowid, changes: res.rowCount };
        },
        async get(...params) {
          const res = await pgPool.query(pgSql, params);
          return res.rows[0] || null;
        },
        async all(...params) {
          const res = await pgPool.query(pgSql, params);
          return res.rows;
        }
      };
    } else {
      // Convert ILIKE to LIKE for SQLite compatibility
      const sqliteSql = sql.replace(/ilike/gi, 'LIKE');
      const stmt = sqliteDb.prepare(sqliteSql);
      
      return {
        async run(...params) {
          const info = stmt.run(...params);
          return { lastInsertRowid: info.lastInsertRowid, changes: info.changes };
        },
        async get(...params) {
          return stmt.get(...params);
        },
        async all(...params) {
          return stmt.all(...params);
        }
      };
    }
  }
};

module.exports = db;
