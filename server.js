'use strict';

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const cors    = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app        = express();
const PORT       = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'nokat-secret-2026';

app.use(cors());
app.use(express.json());

// ─── POSTGRESQL ──────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      region TEXT DEFAULT 'Asgabat',
      trust_score REAL DEFAULT 80,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      username TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price TEXT NOT NULL,
      region TEXT NOT NULL,
      category TEXT DEFAULT 'other',
      type TEXT DEFAULT 'offer',
      visible INTEGER DEFAULT 1,
      r68_score REAL DEFAULT 0,
      trust_score REAL DEFAULT 80,
      likes INTEGER DEFAULT 0,
      responses INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      verdict TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS immunity_stats (
      id SERIAL PRIMARY KEY,
      generation INTEGER DEFAULT 1,
      threshold REAL DEFAULT 30,
      accuracy REAL DEFAULT 0,
      total_feedback INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW()
    );
    INSERT INTO immunity_stats (generation, threshold)
    SELECT 1, 30 WHERE NOT EXISTS (SELECT 1 FROM immunity_stats);
  `);
  console.log('DB initialized');
}

// ─── TRUST PIPELINE ─────────────────────────────────────────
const W = { S1:1.0, S2:1.5, S3:2.0, S4:2.0, S5:0.8, S6:0.6, S7:0.5, S8:1.0, S9:1.3, S10:0.9, S11:1.1, S12:1.8 };

function computeSignals(title, desc) {
  const t = (title + ' ' + desc).toLowerCase();
  const s = {
    S1: /srocno|срочно|derrew|gyssagly/.test(t) ? 1 : 0,
    S2: /girdeji|заработ|invest|пассив/.test(t) ? 1 : 0,
    S3: /bitcoin|btc|usdt|крипт/.test(t) ? 1 : 0,
    S4: /предоплат|100% toleg|avans/.test(t) ? 1 : 0,
    S5: ((title+' '+desc).match(/[A-Z]{4,}/g)||[]).length > 2 ? 1 : 0,
    S6: /\+?993\d{8}/.test(t) ? 1 : 0,
    S7: desc.trim().length < 15 ? 1 : 0,
    S8: /bejermek|derman|лечени|препарат/.test(t) ? 1 : 0,
    S9: /kazyyet|sud|жалоб|прокурор/.test(t) ? 1 : 0,
    S10: /halas et|spasit|pomogi/.test(t) ? 1 : 0,
    S11: ((title+' '+desc).match(/\d+/g)||[]).map(Number).some(n=>n>500000) ? 1 : 0,
    S12: 0
  };
  s.S12 = ([s.S2,s.S3,s.S4].filter(Boolean).length >= 2) ? 1 : 0;
  return s;
}

async function computeR68(userId, signals) {
  let penalty = 0;
  for (const [k,v] of Object.entries(signals)) { if (v===1) penalty += (W[k]||1)*10; }
  const { rows } = await pool.query('SELECT trust_score FROM users WHERE id=$1', [userId]);
  const bonus = ((rows[0]?.trust_score||80) - 80) * 0.2;
  return Math.round(Math.max(0, Math.min(100, 100 - penalty + bonus)));
}

// ─── MIDDLEWARE ──────────────────────────────────────────────
function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(h.slice(7), JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ─── ROUTES ─────────────────────────────────────────────────

app.get('/health', (_, res) => res.json({ status: 'OK', app: 'NOKAT PRO', db: 'PostgreSQL' }));

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, region } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Meydanlary doldur' });
    const hash = bcrypt.hashSync(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (username,email,password,region) VALUES ($1,$2,$3,$4) RETURNING id',
      [username.trim(), email.trim().toLowerCase(), hash, region||'Asgabat']
    );
    const token = jwt.sign({ id: rows[0].id, username: username.trim() }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { username: username.trim(), region: region||'Asgabat', trust_score: 80 } });
  } catch(e) {
    res.status(400).json({ error: e.message.includes('unique') ? 'Bu ulanyjy eyyam bar' : e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email?.trim().toLowerCase()]);
    if (!rows[0] || !bcrypt.compareSync(password, rows[0].password)) {
      return res.status(401).json({ error: 'Yalnyş email ya-da parol' });
    }
    const token = jwt.sign({ id: rows[0].id, username: rows[0].username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { username: rows[0].username, region: rows[0].region, trust_score: rows[0].trust_score } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/posts/create', auth, async (req, res) => {
  try {
    const { title, description, price, region, category, type } = req.body;
    if (!title || !description || !price) return res.status(400).json({ error: 'Meydanlary doldur' });
    const signals = computeSignals(title, description);
    const score = await computeR68(req.user.id, signals);
    const { rows: imm } = await pool.query('SELECT threshold FROM immunity_stats ORDER BY updated_at DESC LIMIT 1');
    const threshold = imm[0]?.threshold || 30;
    const visible = score >= threshold ? 1 : 0;
    const { rows } = await pool.query(
      `INSERT INTO posts (user_id,username,title,description,price,region,category,type,visible,r68_score,trust_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [req.user.id, req.user.username, title.trim(), description.trim(), price.trim(),
       region||'Asgabat', category||'other', type||'offer', visible, score, 80]
    );
    res.json({ message: visible ? 'Nesir edildi' : 'Moderasiya tarapyndan gizlenildi', post_id: rows[0].id, visible: visible===1, r68_score: score });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/posts/list', async (req, res) => {
  try {
    const { type } = req.query;
    let sql = 'SELECT * FROM posts WHERE visible=1';
    const params = [];
    if (type && type !== 'all') { sql += ' AND type=$1'; params.push(type); }
    sql += ' ORDER BY created_at DESC LIMIT 100';
    const { rows } = await pool.query(sql, params);
    res.json({ posts: rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/posts/my', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM posts WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ posts: rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/posts/:id/like', auth, async (req, res) => {
  await pool.query('UPDATE posts SET likes=likes+1 WHERE id=$1', [req.params.id]);
  const { rows } = await pool.query('SELECT likes FROM posts WHERE id=$1', [req.params.id]);
  res.json({ likes: rows[0]?.likes || 0 });
});

app.post('/api/trust/feedback', auth, async (req, res) => {
  try {
    const { post_id, feedback } = req.body;
    if (!['correct','incorrect'].includes(feedback)) return res.status(400).json({ error: 'bad' });
    await pool.query('INSERT INTO feedback (post_id,user_id,verdict) VALUES ($1,$2,$3)', [post_id, req.user.id, feedback]);
    const { rows: t } = await pool.query('SELECT COUNT(*) as c FROM feedback');
    const { rows: w } = await pool.query("SELECT COUNT(*) as c FROM feedback WHERE verdict='incorrect'");
    const total = parseInt(t[0].c);
    const wrong = parseInt(w[0].c);
    const accuracy = total > 0 ? (total-wrong)/total : 0;
    const { rows: imm } = await pool.query('SELECT * FROM immunity_stats ORDER BY updated_at DESC LIMIT 1');
    let threshold = imm[0]?.threshold || 30;
    let generation = imm[0]?.generation || 1;
    if (total % 10 === 0 && total > 0) {
      if (accuracy < 0.7) threshold = Math.min(50, threshold+2);
      if (accuracy > 0.9) threshold = Math.max(20, threshold-1);
      generation++;
    }
    await pool.query('UPDATE immunity_stats SET total_feedback=$1,accuracy=$2,threshold=$3,generation=$4,updated_at=NOW() WHERE id=$5',
      [total, accuracy, threshold, generation, imm[0].id]);
    res.json({ message: 'Teswir kabul edildi', total_feedback: total, accuracy: (accuracy*100).toFixed(1)+'%' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/immunity/stats', async (_, res) => {
  const { rows } = await pool.query('SELECT * FROM immunity_stats ORDER BY updated_at DESC LIMIT 1');
  res.json(rows[0] || { generation:1, threshold:30, accuracy:0, total_feedback:0 });
});

// ─── START ───────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => console.log(`NOKAT PRO on :${PORT} | PostgreSQL`));
}).catch(e => { console.error(e); process.exit(1); });
