import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db/index.js';

const router = Router();
const SALT_ROUNDS = 10;

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      'INSERT INTO users (email, name, password) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, name, hashed]
    );
    const user = rows[0];
    res.status(201).json({ token: signToken(user.id), user });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already in use' });
    }
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, password, created_at FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password: _, ...safeUser } = user;
    res.json({ token: signToken(user.id), user: safeUser });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    // Always return success to avoid leaking which emails exist
    if (!rows.length) return res.json({ success: true });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [rows[0].id, token, expires]
    );

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'CryptoAdvisor <noreply@resend.dev>',
        to: email,
        subject: 'Reset your CryptoAdvisor password',
        html: `<p>Click the link below to reset your password. It expires in 1 hour.</p>
               <a href="${resetUrl}">${resetUrl}</a>`,
      });
      res.json({ success: true });
    } else {
      // Demo mode: return the link directly
      res.json({ success: true, resetUrl });
    }
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW()',
      [token]
    );
    if (!rows.length) return res.status(400).json({ error: 'Invalid or expired reset link' });

    const hashed = await bcrypt.hash(password, 10);
    await Promise.all([
      pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, rows[0].user_id]),
      pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [rows[0].id]),
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
