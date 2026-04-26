import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const migrations: { description: string; sql: string }[] = [
  {
    description: 'create push_subscriptions table',
    sql: `
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `,
  },
  {
    description: 'add last_triggered_at to check_in_alerts',
    sql: `
      ALTER TABLE check_in_alerts
      ADD COLUMN IF NOT EXISTS last_triggered_at TIMESTAMP
    `,
  },
  {
    description: 'create alert_history table',
    sql: `
      CREATE TABLE IF NOT EXISTS alert_history (
        id SERIAL PRIMARY KEY,
        alert_id INTEGER,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        triggered_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `,
  },
  {
    description: 'create meeting_notes table',
    sql: `
      CREATE TABLE IF NOT EXISTS meeting_notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        template_id INTEGER,
        title TEXT NOT NULL,
        date TIMESTAMP NOT NULL,
        company TEXT,
        contact_name TEXT,
        purpose TEXT,
        location TEXT,
        attendees TEXT,
        sections TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `,
  },
  {
    description: 'create note_templates table',
    sql: `
      CREATE TABLE IF NOT EXISTS note_templates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        sections TEXT NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `,
  },
];

async function run() {
  const client = await pool.connect();
  try {
    for (const migration of migrations) {
      console.log(`Running migration: ${migration.description}`);
      await client.query(migration.sql);
      console.log(`Done: ${migration.description}`);
    }
    console.log('All migrations complete');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
