const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// SQLite setup (favorites persistence)
const db = new sqlite3.Database('dataforge.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY,
    session_id TEXT,
    prompt_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, prompt_id)
  )`);
});

// Load API data
let API_DATA;
try {
'api-data-clean.json'
} catch (e) {
  console.error('Error loading api-data.json:', e);
  process.exit(1);
}

// API Routes
app.get('/api/prompts', (req, res) => {
  res.json(API_DATA.prompts);
});

app.get('/api/followups', (req, res) => {
  res.json(API_DATA.followups);
});

app.get('/api/tips', (req, res) => {
  res.json(API_DATA.tips);
});

app.get('/api/workflow', (req, res) => {
  res.json(API_DATA.workflow);
});

app.get('/api/howto', (req, res) => {
  res.json(API_DATA.howto);
});

app.get('/api/categories', (req, res) => {
  res.json(API_DATA.categories);
});

app.get('/api/fupcats', (req, res) => {
  res.json(API_DATA.fupCats);
});

app.get('/api/app', (req, res) => {
  res.json(API_DATA.app);
});

app.get('/api/colors', (req, res) => {
  res.json(API_DATA.colors || {});
});

// Advanced: Favorites API (session-based)
app.get('/api/favs/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  db.all('SELECT prompt_id FROM favorites WHERE session_id = ?', [sessionId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => r.prompt_id));
  });
});

app.post('/api/favs/:sessionId/:promptId', (req, res) => {
  const { sessionId, promptId } = req.params;
  db.run('INSERT OR IGNORE INTO favorites (session_id, prompt_id) VALUES (?, ?)', [sessionId, parseInt(promptId)], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

app.delete('/api/favs/:sessionId/:promptId', (req, res) => {
  const { sessionId, promptId } = req.params;
  db.run('DELETE FROM favorites WHERE session_id = ? AND prompt_id = ?', [sessionId, parseInt(promptId)], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', version: API_DATA.app.version, timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 DataForge API Server running at http://localhost:${PORT}`);
  console.log(`📊 API Endpoints: /api/prompts, /api/followups, /api/favs/:sessionId`);
  console.log(`💾 SQLite DB: dataforge.db (favorites persistent)`);
});

