import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db/index.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  try {
    const [userResult, prefResult] = await Promise.all([
      pool.query('SELECT id, email, name FROM users WHERE id = $1', [userId]),
      pool.query('SELECT crypto_assets, investor_type, content_types FROM preferences WHERE user_id = $1', [userId]),
    ]);
    res.json({
      user: userResult.rows[0],
      preferences: prefResult.rows[0] || null,
    });
  } catch (err) {
    console.error('Profile GET error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/', authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { name, crypto_assets, investor_type, content_types } = req.body;
  try {
    if (name !== undefined) {
      await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, userId]);
    }

    if (crypto_assets || investor_type || content_types) {
      const existing = await pool.query('SELECT id FROM preferences WHERE user_id = $1', [userId]);
      if (existing.rows.length > 0) {
        await pool.query(
          'UPDATE preferences SET crypto_assets = $1, investor_type = $2, content_types = $3 WHERE user_id = $4',
          [crypto_assets, investor_type, content_types, userId]
        );
      } else {
        await pool.query(
          'INSERT INTO preferences (user_id, crypto_assets, investor_type, content_types) VALUES ($1, $2, $3, $4)',
          [userId, crypto_assets, investor_type, content_types]
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Profile PUT error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/password', authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Both fields are required.' });
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });

  try {
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ error: 'Current password is incorrect.' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, userId]);

    res.json({ success: true });
  } catch (err) {
    console.error('Password change error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
