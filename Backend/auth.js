const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const user = await register(email, password);
    res.json(user);
  } catch (e) {
    console.error('register error', e);
    res.status(500).json({ error: 'internal error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const token = await login(email, password);
    if (!token) return res.status(401).json({ error: 'invalid credentials' });
    res.json({ token });
  } catch (e) {
    console.error('login error', e);
    res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;
