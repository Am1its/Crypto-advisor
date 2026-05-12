import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './db/index.js';
import authRouter from './routes/auth.js';
import onboardingRouter from './routes/onboarding.js';
import dashboardRouter from './routes/dashboard.js';
import votesRouter from './routes/votes.js';
import profileRouter from './routes/profile.js';
import alertsRouter from './routes/alerts.js';
import { startPriceAlertCron } from './cron/priceAlerts.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/votes', votesRouter);
app.use('/api/profile', profileRouter);
app.use('/api/alerts', alertsRouter);

async function runStartupMigrations() {
  try {
    await pool.query(`
      ALTER TABLE preferences
        ADD COLUMN IF NOT EXISTS widget_sizes JSONB DEFAULT '{}'::jsonb
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS price_alerts (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
        coin_id      TEXT NOT NULL,
        target_price NUMERIC NOT NULL,
        is_above     BOOLEAN NOT NULL,
        is_active    BOOLEAN DEFAULT TRUE,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      ALTER TABLE preferences
        ADD COLUMN IF NOT EXISTS avatar_emoji TEXT DEFAULT '🚀'
    `);
    console.log('✓ DB migrations applied');
  } catch (err) {
    console.error('Startup migration warning:', err.message);
  }
}

runStartupMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startPriceAlertCron();
  });
});

export default app;
