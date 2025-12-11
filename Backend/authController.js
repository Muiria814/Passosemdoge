const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'db', 'database.sqlite');

// WARNING: This is a minimal example. Passwords are stored in plain text here.
// For production, use bcrypt hashing and proper session/JWT handling.

function runQuery(sql, params=[]) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.run(sql, params, function(err) {
      if (err) { db.close(); return reject(err); }
      const id = this.lastID;
      db.close();
      resolve(id);
    });
  });
}

function getQuery(sql, params=[]) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.get(sql, params, (err, row) => {
      db.close();
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function register(email, password) {
  // simple check
  const existing = await getQuery('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) throw new Error('user exists');
  const id = await runQuery('INSERT INTO users (email, password) VALUES (?, ?)', [email, password]);
  return { id, email };
}

async function login(email, password) {
  const user = await getQuery('SELECT id, password FROM users WHERE email = ?', [email]);
  if (!user) return null;
  if (user.password !== password) return null;
  // Return APP_SECRET as token for simplicity (same as server middleware expects)
  return process.env.APP_SECRET || 'troco-secreto-mude-isto';
}

module.exports = { register, login };
