import { Router } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db/index.js';

const router = Router();

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).userId;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM price_alerts WHERE user_id = $1 AND is_active = TRUE ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /alerts error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  const { coin_id, target_price, is_above } = req.body;
  if (!coin_id || target_price == null || is_above == null) {
    return res.status(400).json({ error: 'coin_id, target_price, and is_above are required' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO price_alerts (user_id, coin_id, target_price, is_above) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, coin_id, parseFloat(target_price), Boolean(is_above)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /alerts error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE price_alerts SET is_active = FALSE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /alerts error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
