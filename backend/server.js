require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UAParser = require('ua-parser-js');
const db = require('./db/database');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me_in_production';

app.use(cors({ origin: '*' })); // Allow all origins for development and QR scanning
app.use(express.json());

// Helper: Generate Random Unique Short ID
async function generateShortId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let shortId;
  let isUnique = false;

  while (!isUnique) {
    shortId = '';
    for (let i = 0; i < 6; i++) {
      shortId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure the short ID is never digits-only to avoid routing conflicts with integer database IDs
    if (/^\d+$/.test(shortId)) {
      continue;
    }
    // Check uniqueness
    const stmt = db.prepare('SELECT id FROM qr_codes WHERE short_id = ?');
    const existing = await stmt.get(shortId);
    if (!existing) {
      isUnique = true;
    }
  }
  return shortId;
}

// ---------------- AUTH ROUTES ----------------

// Sign Up
app.post('/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (!gmailRegex.test(email)) {
    return res.status(400).json({ message: 'Only real Gmail addresses (@gmail.com) are allowed' });
  }

  try {
    const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // First user becomes admin
    const totalUsersRow = await db.prepare('SELECT COUNT(*) as count FROM users').get();
    const totalUsers = parseInt(totalUsersRow.count, 10);
    const role = totalUsers === 0 ? 'admin' : 'user';

    const stmt = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
    const info = await stmt.run(name, email, passwordHash, role);
    const userId = info.lastInsertRowid;

    const token = jwt.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: userId, name, email, role }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error during signup' });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (!gmailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid Gmail address (@gmail.com)' });
  }

  try {
    const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error during login' });
  }
});

// Logout (Stateless JWT token invalidation is client-side, but endpoint is supported)
app.post('/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// ---------------- QR MANAGEMENT ROUTES ----------------

// Create QR
app.post('/qr/create', authMiddleware, async (req, res) => {
  const { type, destination_content, customization_settings, folder } = req.body;

  if (!type || !destination_content) {
    return res.status(400).json({ message: 'Type and destination content are required' });
  }

  try {
    const shortId = await generateShortId();
    const destString = typeof destination_content === 'object' ? JSON.stringify(destination_content) : destination_content;
    const customString = JSON.stringify(customization_settings || {});
    const folderName = folder || 'General';

    const stmt = db.prepare(`
      INSERT INTO qr_codes (user_id, short_id, type, destination_content, customization_settings, folder)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = await stmt.run(req.user.id, shortId, type, destString, customString, folderName);

    const newQr = await db.prepare('SELECT * FROM qr_codes WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newQr);
  } catch (err) {
    console.error('Create QR error:', err);
    res.status(500).json({ message: 'Internal server error creating QR code' });
  }
});

// List User QRs
app.get('/qr/list', authMiddleware, async (req, res) => {
  try {
    const { status, folder, is_favorite, search } = req.query;

    let query = 'SELECT * FROM qr_codes WHERE user_id = ?';
    const params = [req.user.id];

    // Status filter (default to show active/archived unless explicitly looking for deleted)
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    } else {
      query += " AND status != 'deleted'";
    }

    if (folder) {
      query += ' AND folder = ?';
      params.push(folder);
    }

    if (is_favorite !== undefined) {
      query += ' AND is_favorite = ?';
      params.push(is_favorite === 'true' || is_favorite === '1' ? 1 : 0);
    }

    if (search) {
      query += ' AND (destination_content ILIKE ? OR type ILIKE ? OR folder ILIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const qrs = await stmt.all(...params);

    // Parse JSON contents before sending to frontend
    const parsedQrs = qrs.map(qr => {
      try {
        qr.destination_content = JSON.parse(qr.destination_content);
      } catch (e) {
        // Keep as string if parsing fails
      }
      try {
        qr.customization_settings = JSON.parse(qr.customization_settings);
      } catch (e) {
        qr.customization_settings = {};
      }
      return qr;
    });

    res.json(parsedQrs);
  } catch (err) {
    console.error('List QRs error:', err);
    res.status(500).json({ message: 'Internal server error listing QR codes' });
  }
});

// ---------------- SHORT URL REDIRECT & LOGGER (SCAN LOGIC) ----------------

// Fetch API for Geolocation (runs locally)
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(() => null);

app.get('/qr/:shortId', async (req, res, next) => {
  const shortId = req.params.shortId;

  // If shortId is digits-only, pass execution to the next route (/qr/:id)
  if (/^\d+$/.test(shortId)) {
    return next();
  }

  try {
    // Look up short ID
    const qr = await db.prepare('SELECT * FROM qr_codes WHERE short_id = ?').get(shortId);
    if (!qr) {
      return res.status(404).send('<h1>QR Code not found</h1>');
    }

    if (qr.status !== 'active') {
      return res.status(403).send('<h1>QR Code is inactive, suspended, or archived</h1>');
    }

    // Parse User Agent
    const ua = req.headers['user-agent'] || '';
    const parser = new UAParser(ua);
    const osInfo = parser.getOS();
    const browserInfo = parser.getBrowser();
    const deviceInfo = parser.getDevice();

    const device = deviceInfo.type || 'desktop';
    const browser = browserInfo.name || 'Unknown Browser';
    const os = osInfo.name || 'Unknown OS';
    const referrer = req.headers['referer'] || 'Direct';

    // Parse IP and Location
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    if (ip.includes(',')) ip = ip.split(',')[0].trim();
    if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';

    let country = 'Localhost';
    let city = 'Localhost';

    // Geolocation lookup for public IP (async in background or quick await with timeout)
    if (ip !== '127.0.0.1') {
      try {
        const geoRes = await Promise.race([
          fetch(`http://ip-api.com/json/${ip}`).then(r => r.json()),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 800))
        ]);
        if (geoRes && geoRes.status === 'success') {
          country = geoRes.country || 'Unknown';
          city = geoRes.city || 'Unknown';
        } else {
          const mockCountries = ['United States', 'Germany', 'India', 'Canada', 'United Kingdom', 'Japan'];
          const mockCities = ['New York', 'Berlin', 'Mumbai', 'Toronto', 'London', 'Tokyo'];
          const rand = Math.floor(Math.random() * mockCountries.length);
          country = mockCountries[rand];
          city = mockCities[rand];
        }
      } catch (e) {
        const mockCountries = ['United States', 'Germany', 'India', 'Canada', 'United Kingdom', 'Japan'];
        const mockCities = ['New York', 'Berlin', 'Mumbai', 'Toronto', 'London', 'Tokyo'];
        const rand = Math.floor(Math.random() * mockCountries.length);
        country = mockCountries[rand];
        city = mockCities[rand];
      }
    } else {
      const mockCountries = ['United States', 'Germany', 'India', 'Canada', 'United Kingdom', 'Japan'];
      const mockCities = ['New York', 'Berlin', 'Mumbai', 'Toronto', 'London', 'Tokyo'];
      const rand = Math.floor(Math.random() * mockCountries.length);
      country = mockCountries[rand];
      city = mockCities[rand];
    }

    // Insert Scan Log
    const insertLog = db.prepare(`
      INSERT INTO scan_logs (qr_id, ip_address, country, city, device, browser, operating_system, referrer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    await insertLog.run(qr.id, ip, country, city, device, browser, os, referrer);

    // Increment Scan Count
    await db.prepare('UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = ?').run(qr.id);

    // Handle destination routing
    let destinationContent;
    try {
      destinationContent = JSON.parse(qr.destination_content);
    } catch (e) {
      destinationContent = qr.destination_content;
    }

    if (qr.type === 'url') {
      let targetUrl = typeof destinationContent === 'object' ? destinationContent.url : destinationContent;
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'http://' + targetUrl;
      }
      return res.redirect(302, targetUrl);
    } else {
      return res.redirect(302, `${FRONTEND_URL}/display/${shortId}`);
    }
  } catch (err) {
    console.error('Scan processing error:', err);
    res.status(500).send('<h1>Internal Server Error processing scan</h1>');
  }
});

// Get Single QR
app.get('/qr/:id', authMiddleware, async (req, res) => {
  try {
    const qr = await db.prepare('SELECT * FROM qr_codes WHERE id = ?').get(req.params.id);
    if (!qr) {
      return res.status(404).json({ message: 'QR Code not found' });
    }

    // Auth validation: must be owner or admin
    if (qr.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access to this QR code' });
    }

    try {
      qr.destination_content = JSON.parse(qr.destination_content);
    } catch (e) {}
    try {
      qr.customization_settings = JSON.parse(qr.customization_settings);
    } catch (e) {
      qr.customization_settings = {};
    }

    res.json(qr);
  } catch (err) {
    console.error('Get QR error:', err);
    res.status(500).json({ message: 'Internal server error retrieving QR code' });
  }
});

// Update QR Destination / Customization
app.put('/qr/:id', authMiddleware, async (req, res) => {
  const { type, destination_content, customization_settings, folder, is_favorite, status } = req.body;

  try {
    const qr = await db.prepare('SELECT * FROM qr_codes WHERE id = ?').get(req.params.id);
    if (!qr) {
      return res.status(404).json({ message: 'QR Code not found' });
    }

    // Owner/Admin check
    if (qr.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized modification' });
    }

    const updatedType = type || qr.type;
    let updatedDest = qr.destination_content;
    if (destination_content) {
      updatedDest = typeof destination_content === 'object' ? JSON.stringify(destination_content) : destination_content;
    }
    const updatedCustom = customization_settings ? JSON.stringify(customization_settings) : qr.customization_settings;
    const updatedFolder = folder !== undefined ? folder : qr.folder;
    const updatedFav = is_favorite !== undefined ? (is_favorite ? 1 : 0) : qr.is_favorite;
    const updatedStatus = status || qr.status;

    const stmt = db.prepare(`
      UPDATE qr_codes
      SET type = ?, destination_content = ?, customization_settings = ?, folder = ?, is_favorite = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    await stmt.run(updatedType, updatedDest, updatedCustom, updatedFolder, updatedFav, updatedStatus, req.params.id);

    const updatedQr = await db.prepare('SELECT * FROM qr_codes WHERE id = ?').get(req.params.id);
    try {
      updatedQr.destination_content = JSON.parse(updatedQr.destination_content);
    } catch (e) {}
    try {
      updatedQr.customization_settings = JSON.parse(updatedQr.customization_settings);
    } catch (e) {}

    res.json(updatedQr);
  } catch (err) {
    console.error('Update QR error:', err);
    res.status(500).json({ message: 'Internal server error updating QR code' });
  }
});

// Delete (Soft) or Restore QR
app.delete('/qr/:id', authMiddleware, async (req, res) => {
  try {
    const qr = await db.prepare('SELECT * FROM qr_codes WHERE id = ?').get(req.params.id);
    if (!qr) {
      return res.status(404).json({ message: 'QR Code not found' });
    }

    if (qr.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Toggle soft delete status or permanently delete depending on query param
    const { permanent } = req.query;

    if (permanent === 'true') {
      await db.prepare('DELETE FROM qr_codes WHERE id = ?').run(req.params.id);
      res.json({ message: 'QR Code permanently deleted' });
    } else {
      await db.prepare("UPDATE qr_codes SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
      res.json({ message: 'QR Code moved to trash' });
    }
  } catch (err) {
    console.error('Delete QR error:', err);
    res.status(500).json({ message: 'Internal server error deleting QR code' });
  }
});

// Duplicate QR
app.post('/qr/:id/duplicate', authMiddleware, async (req, res) => {
  try {
    const qr = await db.prepare('SELECT * FROM qr_codes WHERE id = ?').get(req.params.id);
    if (!qr) {
      return res.status(404).json({ message: 'QR Code not found' });
    }

    if (qr.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const shortId = await generateShortId();
    const stmt = db.prepare(`
      INSERT INTO qr_codes (user_id, short_id, type, destination_content, customization_settings, folder, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `);
    const info = await stmt.run(req.user.id, shortId, qr.type, qr.destination_content, qr.customization_settings, qr.folder);

    const newQr = await db.prepare('SELECT * FROM qr_codes WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newQr);
  } catch (err) {
    console.error('Duplicate QR error:', err);
    res.status(500).json({ message: 'Internal server error duplicating QR code' });
  }
});

// ---------------- ANALYTICS ENDPOINT ----------------

app.get('/analytics/:id', authMiddleware, async (req, res) => {
  try {
    const qr = await db.prepare('SELECT * FROM qr_codes WHERE id = ?').get(req.params.id);
    if (!qr) {
      return res.status(404).json({ message: 'QR Code not found' });
    }

    if (qr.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get basic stats
    const totalScansRow = await db.prepare('SELECT COUNT(*) as count FROM scan_logs WHERE qr_id = ?').get(req.params.id);
    const totalScans = parseInt(totalScansRow.count, 10);

    // Daily scans (last 30 days)
    const dailyScans = await db.prepare(`
      SELECT date(scanned_at) as date, COUNT(*) as count
      FROM scan_logs
      WHERE qr_id = ? AND scanned_at >= date('now', '-30 days')
      GROUP BY date(scanned_at)
      ORDER BY date ASC
    `).all(req.params.id);
    dailyScans.forEach(row => row.count = parseInt(row.count, 10));

    // Device breakdown
    const devices = await db.prepare(`
      SELECT COALESCE(device, 'Unknown') as device, COUNT(*) as count
      FROM scan_logs
      WHERE qr_id = ?
      GROUP BY device
      ORDER BY count DESC
    `).all(req.params.id);
    devices.forEach(row => row.count = parseInt(row.count, 10));

    // OS breakdown
    const operatingSystems = await db.prepare(`
      SELECT COALESCE(operating_system, 'Unknown') as os, COUNT(*) as count
      FROM scan_logs
      WHERE qr_id = ?
      GROUP BY os
      ORDER BY count DESC
    `).all(req.params.id);
    operatingSystems.forEach(row => row.count = parseInt(row.count, 10));

    // Browser breakdown
    const browsers = await db.prepare(`
      SELECT COALESCE(browser, 'Unknown') as browser, COUNT(*) as count
      FROM scan_logs
      WHERE qr_id = ?
      GROUP BY browser
      ORDER BY count DESC
    `).all(req.params.id);
    browsers.forEach(row => row.count = parseInt(row.count, 10));

    // Country breakdown
    const countries = await db.prepare(`
      SELECT COALESCE(country, 'Unknown') as country, COUNT(*) as count
      FROM scan_logs
      WHERE qr_id = ?
      GROUP BY country
      ORDER BY count DESC
    `).all(req.params.id);
    countries.forEach(row => row.count = parseInt(row.count, 10));

    // City breakdown
    const cities = await db.prepare(`
      SELECT COALESCE(city, 'Unknown') as city, COUNT(*) as count
      FROM scan_logs
      WHERE qr_id = ?
      GROUP BY city
      ORDER BY count DESC
    `).all(req.params.id);
    cities.forEach(row => row.count = parseInt(row.count, 10));

    // Referrer breakdown
    const referrers = await db.prepare(`
      SELECT COALESCE(referrer, 'Direct') as referrer, COUNT(*) as count
      FROM scan_logs
      WHERE qr_id = ?
      GROUP BY referrer
      ORDER BY count DESC
    `).all(req.params.id);
    referrers.forEach(row => row.count = parseInt(row.count, 10));

    // Recent Scans
    const recentScans = await db.prepare(`
      SELECT * FROM scan_logs
      WHERE qr_id = ?
      ORDER BY scanned_at DESC
      LIMIT 20
    `).all(req.params.id);

    res.json({
      qr_id: qr.id,
      short_id: qr.short_id,
      total_scans: totalScans,
      daily_scans: dailyScans,
      devices,
      operating_systems: operatingSystems,
      browsers,
      countries,
      cities,
      referrers,
      recent_scans: recentScans
    });
  } catch (err) {
    console.error('Get Analytics error:', err);
    res.status(500).json({ message: 'Internal server error retrieving analytics' });
  }
});

// ---------------- ADMIN PANEL ENDPOINTS ----------------

// Admin Check Middleware
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden. Admin access required.' });
  }
};

// Admin: Get all users
app.get('/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await db.prepare('SELECT id, name, email, role, created_at FROM users').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving users' });
  }
});

// Admin: Delete user
app.delete('/admin/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.prepare('DELETE FROM users WHERE id = ?').run(req.params.userId);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Admin: Get all QR codes
app.get('/admin/qr-codes', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const qrs = await db.prepare(`
      SELECT qr.*, u.name as owner_name, u.email as owner_email
      FROM qr_codes qr
      JOIN users u ON qr.user_id = u.id
      ORDER BY qr.created_at DESC
    `).all();

    const parsedQrs = qrs.map(qr => {
      try { qr.destination_content = JSON.parse(qr.destination_content); } catch (e) {}
      try { qr.customization_settings = JSON.parse(qr.customization_settings); } catch (e) {}
      return qr;
    });
    res.json(parsedQrs);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving all QR codes' });
  }
});

// Admin: Delete/Suspend QR code
app.put('/admin/qr-codes/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: 'Status is required' });

  try {
    await db.prepare('UPDATE qr_codes SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: `QR Code status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ message: 'Error updating QR code status' });
  }
});

// Admin: Global stats
app.get('/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsersRow = await db.prepare('SELECT COUNT(*) as count FROM users').get();
    const totalUsers = parseInt(totalUsersRow.count, 10);
    
    const totalQRsRow = await db.prepare('SELECT COUNT(*) as count FROM qr_codes').get();
    const totalQRs = parseInt(totalQRsRow.count, 10);
    
    const totalScansRow = await db.prepare('SELECT COUNT(*) as count FROM scan_logs').get();
    const totalScans = parseInt(totalScansRow.count, 10);

    const qrByStatus = await db.prepare('SELECT status, COUNT(*) as count FROM qr_codes GROUP BY status').all();
    qrByStatus.forEach(row => row.count = parseInt(row.count, 10));

    const qrByType = await db.prepare('SELECT type, COUNT(*) as count FROM qr_codes GROUP BY type').all();
    qrByType.forEach(row => row.count = parseInt(row.count, 10));

    res.json({
      total_users: totalUsers,
      total_qr_codes: totalQRs,
      total_scans: totalScans,
      qr_by_status: qrByStatus,
      qr_by_type: qrByType
    });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving platform statistics' });
  }
});

// Single QR Content endpoint for frontend rendering
app.get('/qr/public/:shortId', async (req, res) => {
  try {
    const qr = await db.prepare('SELECT * FROM qr_codes WHERE short_id = ?').get(req.params.shortId);
    if (!qr) {
      return res.status(404).json({ message: 'QR Code not found' });
    }

    if (qr.status !== 'active') {
      return res.status(403).json({ message: 'QR Code is inactive' });
    }

    try {
      qr.destination_content = JSON.parse(qr.destination_content);
    } catch (e) {}

    res.json({
      type: qr.type,
      destination_content: qr.destination_content,
      created_at: qr.created_at
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching QR details' });
  }
});

// Start Server
db.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Express server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
