const express = require('express');
const router = express.Router();
const { convertStepsToDoge } = require('../controllers/cryptoController');

// POST /api/crypto/convert
// body: { steps: number }
router.post('/convert', (req, res) => {
  const { steps } = req.body;
  if (typeof steps !== 'number' || steps < 0) return res.status(400).json({ error: 'steps must be a non-negative number' });

  try {
    const result = convertStepsToDoge(steps);
    res.json(result);
  } catch (err) {
    console.error('crypto convert error', err);
    res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;
