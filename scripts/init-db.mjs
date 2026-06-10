import knex from 'knex';
import 'dotenv/config';

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("DATABASE_URL is not set in environment variables.");
  process.exit(1);
}

const db = knex({
  client: 'pg',
  connection: dbUrl,
});

async function init() {
  try {
    const exists = await db.schema.hasTable('orders');
    if (!exists) {
      await db.schema.createTable('orders', (table) => {
        table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
        table.string('food_name').notNullable();
        table.string('restaurant_name').notNullable();
        table.string('status').notNullable().defaultTo('pending'); // 'pending', 'approved', 'rejected'
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('Successfully created "orders" table.');
    } else {
      console.log('"orders" table already exists.');
    }
  } catch (error) {
    console.error('Error creating database schema:', error);
  } finally {
    await db.destroy();
  }
}

init();
