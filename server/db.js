// Persistent SQLite Database for BitBuild using Node.js v24 built-in node:sqlite and node:crypto
import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), 'bitbuild.sqlite');
const db = new DatabaseSync(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_progress (
    user_id TEXT PRIMARY KEY,
    current_xp INTEGER DEFAULT 0,
    completed_lessons TEXT DEFAULT '[]',
    completed_pieces TEXT DEFAULT '[]',
    current_lesson_id TEXT DEFAULT 'move',
    code_drafts TEXT DEFAULT '{}',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function registerUser(username, email, password) {
  if (!username || username.trim().length < 3) {
    throw new Error('Username must be at least 3 characters');
  }
  if (!email || !email.includes('@')) {
    throw new Error('Valid email address is required');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username.trim(), email.trim());
  if (existing) {
    throw new Error('Username or email already exists');
  }

  const id = 'usr_' + crypto.randomBytes(8).toString('hex');
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);

  const insertUser = db.prepare('INSERT INTO users (id, username, email, password_hash, salt) VALUES (?, ?, ?, ?, ?)');
  insertUser.run(id, username.trim(), email.trim(), passwordHash, salt);

  // Initialize progress
  const initProgress = db.prepare("INSERT INTO user_progress (user_id, current_xp, completed_lessons, completed_pieces, current_lesson_id, code_drafts) VALUES (?, 0, '[]', '[]', 'move', '{}')");
  initProgress.run(id);

  const token = createSession(id);
  const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(id);
  return { user, token };
}

export function loginUser(usernameOrEmail, password) {
  if (!usernameOrEmail || !password) {
    throw new Error('Username/email and password required');
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(usernameOrEmail.trim(), usernameOrEmail.trim());
  if (!user) {
    throw new Error('Invalid username/email or password');
  }

  const checkHash = hashPassword(password, user.salt);
  if (!crypto.timingSafeEqual(Buffer.from(checkHash, 'hex'), Buffer.from(user.password_hash, 'hex'))) {
    throw new Error('Invalid username/email or password');
  }

  const token = createSession(user.id);
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at
    },
    token
  };
}

export function createSession(userId) {
  const token = 'tok_' + crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(); // 30 days
  const insert = db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)');
  insert.run(token, userId, expiresAt);
  return token;
}

export function getUserFromSession(token) {
  if (!token) return null;
  const session = db.prepare('SELECT user_id, expires_at FROM sessions WHERE token = ?').get(token);
  if (!session) return null;

  if (new Date(session.expires_at) < new Date()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }

  const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(session.user_id);
  return user || null;
}

export function logoutUser(token) {
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
}

export function getUserProgress(userId) {
  const row = db.prepare('SELECT * FROM user_progress WHERE user_id = ?').get(userId);
  if (!row) return null;

  return {
    currentXp: row.current_xp || 0,
    completedLessonIds: JSON.parse(row.completed_lessons || '[]'),
    completedPieceIds: JSON.parse(row.completed_pieces || '[]'),
    currentLessonId: row.current_lesson_id || 'move',
    codeDrafts: JSON.parse(row.code_drafts || '{}')
  };
}

export function saveUserProgress(userId, progressData) {
  const existing = db.prepare('SELECT user_id FROM user_progress WHERE user_id = ?').get(userId);
  const completedLessons = JSON.stringify(progressData.completedLessonIds || []);
  const completedPieces = JSON.stringify(progressData.completedPieceIds || []);
  const codeDrafts = JSON.stringify(progressData.codeDrafts || {});
  const xp = typeof progressData.currentXp === 'number' ? progressData.currentXp : 0;
  const currentLessonId = progressData.currentLessonId || 'move';

  if (existing) {
    const update = db.prepare(`
      UPDATE user_progress 
      SET current_xp = ?, completed_lessons = ?, completed_pieces = ?, current_lesson_id = ?, code_drafts = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);
    update.run(xp, completedLessons, completedPieces, currentLessonId, codeDrafts, userId);
  } else {
    const insert = db.prepare(`
      INSERT INTO user_progress (user_id, current_xp, completed_lessons, completed_pieces, current_lesson_id, code_drafts)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insert.run(userId, xp, completedLessons, completedPieces, currentLessonId, codeDrafts);
  }

  return getUserProgress(userId);
}
