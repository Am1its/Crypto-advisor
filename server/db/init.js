import pool from './index.js';

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        email      TEXT UNIQUE NOT NULL,
        name       TEXT,
        password   TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS preferences (
        id             SERIAL PRIMARY KEY,
        user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
        crypto_assets  TEXT[],
        investor_type  TEXT,
        content_types  TEXT[]
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        section    TEXT,
        item_id    TEXT,
        vote       TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Non-destructive migrations
    await client.query(`
      ALTER TABLE preferences
        ADD COLUMN IF NOT EXISTS widget_sizes JSONB DEFAULT '{}'::jsonb;
    `);
    await client.query(`
      ALTER TABLE preferences
        ADD COLUMN IF NOT EXISTS avatar_emoji TEXT DEFAULT '🚀';
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS price_alerts (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
        coin_id      TEXT NOT NULL,
        target_price NUMERIC NOT NULL,
        is_above     BOOLEAN NOT NULL,
        is_active    BOOLEAN DEFAULT TRUE,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✓ Tables created (users, preferences, votes, price_alerts)');
  } finally {
    client.release();
    await pool.end();
  }
};

createTables().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
