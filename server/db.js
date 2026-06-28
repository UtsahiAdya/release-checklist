const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const migrate = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS releases (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      due_date   TIMESTAMPTZ NOT NULL,
      info       TEXT,
      steps      JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("Database migrated ✓");
};

module.exports = { pool, migrate };
