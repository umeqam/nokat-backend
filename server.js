'use strict';

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
require('dotenv').config();

const app        = express();
const PORT       = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'nokat-secret-2026';
const DB_FILE    = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// ─── JSON DATABASE ───────────────────────────────────────────
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    const empty = {
      users: [],
      posts: [],
      feedback: [],
      moderation_logs: [],
      immunity: { generation: 1, threshold: 30, accuracy: 0, total_feedback: 0 }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ─── TRUST PIPELINE ─────────────────────────────────────────
const WEIGHTS = { S1:1.0, S2:1.5, S3:2.0, S4:2.0, S5:0.8, S6:0.6, S7:0.5, S8:1.0, S9:1.3, S10:0.9, S11:1.1, S12:1.8 };

function computeSignals(title, desc) {
  const t = (title + ' ' + desc).toLowerCase();
  return {
    S1:  /srocno|срочно|derrew|gyssagly/.test(t) ? 1 : 0,
    S2:  /girdeji|заработ|invest|пассив/.test(t) ? 1 : 0,
    S3:  /bitcoin|btc|usdt|крипт/.test(t) ? 1 : 0,
    S4:  /предоплат|100% toleg|avans/.test(t) ? 1 : 0,
    S5:  ((title + ' ' + desc).match(/[A-Z]{4,}/g) || []).length > 2 ? 1 : 0,
    S6:  /\+?993\d{8}/.test(t) ? 1 : 0,
    S7:  desc.trim().length < 15 ? 1 : 0,
    S8:  /bejermek|derman|лечени|препарат/.test(t) ? 1 : 0,
    S9:  /kazyyet|sud|жалоб|прокурор/.test(t) ? 1 : 0,
    S10: /halas et|spasit|pomogi/.test(t) ? 1 : 0,
    S11: ((title+' '+desc).match(/\d+/g)||[]).map(Number).some(n=>n>500000) ? 1 : 0,
    S12: 0
  };
}

function computeR68(userId, signals, db) {
  let penalty = 0;
  for (const [k, v] of Object.entries(signals)) {
    if (v === 1) penalty += (WEIGHTS[k] || 1) * 10;
  }
  // S12 escalation
  if ([signals.S2, signals.S3, signals.S4].filter(Boolean).length >= 2) penalty += 18;
  const user = db.users.find(u => u.id === userId);
  const bonus = ((user?.trust_score || 80) - 80) * 0.2;
  return Math.round(Math.max(0, Math.min(100, 100 - penalty + bonus)));
}

// ─── MIDDLEWARE ──────────────────────────────────────────────
function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(h.slice(7), JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ─── ROUTES ──────────────────────────────────────────────────

app.get('/health', (_, res) => res.json({ status: 'OK', app: 'NOKAT PRO' }));

// REGISTER
app.post('/api/auth/register', (req, res) => {
  const { username, email, password, region } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Meydanlary doldur' });
  const db = loadDB();
  if (db.users.find(u => u.email === email.toLowerCase() || u.username === username)) {
    return res.status(400).json({ error: 'Bu ulanyjy eyyam bar' });
  }
  const user = {
    id: Date.now(),
    username: username.trim(),
    email: email.trim().toLowerCase(),
    password: bcrypt.hashSync(password, 10),
    region: region || 'Asgabat',
    trust_score: 80,
    created_at: new Date().toISOString()
  };
  db.users.push(user);
  saveDB(db);
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { username: user.username, region: user.region, trust_score: 80 } });
});

// LOGIN
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Meydanlary doldur' });
  const db = loadDB();
  const user = db.users.find(u => u.email === email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Yalnyş email ya-da parol' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { username: user.username, region: user.region, trust_score: user.trust_score } });
});

// CREATE POST
app.post('/api/posts/create', auth, (req, res) => {
  const { title, description, price, region, category, type } = req.body;
  if (!title || !description || !price) return res.status(400).json({ error: 'Meydanlary doldur' });
  const db = loadDB();
  const signals = computeSignals(title, description);
  const score   = computeR68(req.user.id, signals, db);
  const threshold = db.immunity.threshold;
  const visible   = score >= threshold;
  const post = {
    id: Date.now(),
    user_id: req.user.id,
    username: req.user.username,
    title: title.trim(),
    description: description.trim(),
    price: price.trim(),
    region: region || 'Asgabat',
    category: category || 'other',
    type: type || 'offer',
    visible: visible ? 1 : 0,
    r68_score: score,
    trust_score: db.users.find(u => u.id === req.user.id)?.trust_score || 80,
    likes: 0,
    responses: 0,
    created_at: new Date().toISOString()
  };
  db.posts.push(post);
  db.moderation_logs.push({ post_id: post.id, user_id: req.user.id, score, signals, decision: visible ? 'visible' : 'hidden', threshold, at: post.created_at });
  saveDB(db);
  res.json({
    message: visible ? 'Nesir edildi' : 'Moderasiya tarapyndan gizlenildi',
    post_id: post.id,
    visible,
    r68_score: score
  });
});

// LIST POSTS
app.get('/api/posts/list', (req, res) => {
  const db = loadDB();
  let posts = db.posts.filter(p => p.visible === 1);
  const { type } = req.query;
  if (type && type !== 'all') posts = posts.filter(p => p.type === type);
  posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ posts: posts.slice(0, 100) });
});

// MY POSTS
app.get('/api/posts/my', auth, (req, res) => {
  const db = loadDB();
  const posts = db.posts.filter(p => p.user_id === req.user.id).sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
  res.json({ posts });
});

// LIKE
app.post('/api/posts/:id/like', auth, (req, res) => {
  const db = loadDB();
  const post = db.posts.find(p => p.id == req.params.id);
  if (post) { post.likes = (post.likes || 0) + 1; saveDB(db); }
  res.json({ likes: post?.likes || 0 });
});

// FEEDBACK → IMMUNITY CORE
app.post('/api/trust/feedback', auth, (req, res) => {
  const { post_id, feedback } = req.body;
  if (!post_id || !['correct','incorrect'].includes(feedback)) return res.status(400).json({ error: 'Yalnyş maglumat' });
  const db = loadDB();
  db.feedback.push({ post_id, user_id: req.user.id, verdict: feedback, at: new Date().toISOString() });
  const total   = db.feedback.length;
  const wrong   = db.feedback.filter(f => f.verdict === 'incorrect').length;
  const accuracy = total > 0 ? (total - wrong) / total : 0;
  db.immunity.total_feedback = total;
  db.immunity.accuracy = accuracy;
  if (total % 10 === 0 && total > 0) {
    if (accuracy < 0.7) db.immunity.threshold = Math.min(50, db.immunity.threshold + 2);
    if (accuracy > 0.9) db.immunity.threshold = Math.max(20, db.immunity.threshold - 1);
    db.immunity.generation++;
  }
  saveDB(db);
  res.json({ message: 'Teswir kabul edildi, ulgam owrendi', total_feedback: total, accuracy: (accuracy*100).toFixed(1)+'%' });
});

// IMMUNITY STATS
app.get('/api/immunity/stats', (_, res) => {
  const db = loadDB();
  res.json({ generation: db.immunity.generation, r68_threshold: db.immunity.threshold, accuracy: db.immunity.accuracy, total_feedback: db.immunity.total_feedback });
});

// ─── START ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ================================
  NOKAT PRO — Backend v1.0
  http://localhost:${PORT}
  DB: ${DB_FILE}
  ================================
  `);
});
