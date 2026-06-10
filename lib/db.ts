import knex from 'knex';

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.warn("DATABASE_URL is not set. Supabase Knex connection will fail.");
}

const db = knex({
  client: 'pg',
  connection: dbUrl,
  // Optional: add pool settings if needed
});

export default db;
