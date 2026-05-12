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

    // Non-destructive migration: add widget_sizes if it doesn't exist yet
    await client.query(`
      ALTER TABLE preferences
        ADD COLUMN IF NOT EXISTS widget_sizes JSONB DEFAULT '{}'::jsonb;
    `);

    console.log('✓ Tables created (users, preferences, votes)');
  } finally {
    client.release();
    await pool.end();
  }
};

createTables().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
