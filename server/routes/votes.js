import { Router } from 'express';
import pool from '../db/index.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

router.post('/', authMiddleware, async (req, res) => {
  const { section, item_id, vote } = req.body;
  const userId = req.user.userId;

  if (!section || !item_id || !['up', 'down'].includes(vote)) {
    return res.status(400).json({ error: 'section, item_id, and vote ("up"|"down") are required' });
  }

  try {
    await pool.query(
      'INSERT INTO votes (user_id, section, item_id, vote) VALUES ($1, $2, $3, $4)',
      [userId, section, item_id, vote]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Vote error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
