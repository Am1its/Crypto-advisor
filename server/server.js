import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './db/index.js';
import authRouter from './routes/auth.js';
import onboardingRouter from './routes/onboarding.js';
import dashboardRouter from './routes/dashboard.js';
import votesRouter from './routes/votes.js';
import profileRouter from './routes/profile.js';

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

async function runStartupMigrations() {
  try {
    await pool.query(`
      ALTER TABLE preferences
        ADD COLUMN IF NOT EXISTS widget_sizes JSONB DEFAULT '{}'::jsonb
    `);
    console.log('✓ DB migrations applied');
  } catch (err) {
    console.error('Startup migration warning:', err.message);
  }
}

runStartupMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

export default app;
