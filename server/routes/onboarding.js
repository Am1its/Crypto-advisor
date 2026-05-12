import { Router } from 'express';
import pool from '../db/index.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

router.post('/', authMiddleware, async (req, res) => {
  const { crypto_assets, investor_type, content_types, avatar_emoji } = req.body;
  const userId = req.user.userId;

  if (!crypto_assets || !investor_type || !content_types) {
    return res.status(400).json({ error: 'All preference fields are required' });
  }

  const emoji = avatar_emoji || '🚀';

  try {
    const existing = await pool.query(
      'SELECT id FROM preferences WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE preferences SET crypto_assets = $1, investor_type = $2, content_types = $3, avatar_emoji = $4 WHERE user_id = $5',
        [crypto_assets, investor_type, content_types, emoji, userId]
      );
    } else {
      await pool.query(
        'INSERT INTO preferences (user_id, crypto_assets, investor_type, content_types, avatar_emoji) VALUES ($1, $2, $3, $4, $5)',
        [userId, crypto_assets, investor_type, content_types, emoji]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Onboarding error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
