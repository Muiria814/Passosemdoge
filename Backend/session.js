const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'db', 'database.sqlite');

// Create a simple endpoint to add steps to a user's session
router.post('/add-steps', (req, res) => {
  const { user_id, steps } = req.body;
  if (!user_id || typeof steps !== 'number') return res.status(400).json({ error: 'user_id and numeric steps required' });

  const db = new sqlite3.Database(dbPath);
  db.run('INSERT INTO sessions (user_id, steps) VALUES (?, ?)', [user_id, steps], function(err) {
    db.close();
    if (err) { console.error(err); return res.status(500).json({ error: 'db error' }); }
    res.json({ id: this.lastID, user_id, steps });
  });
});

module.exports = router;
