const { Client } = require('pg');

async function test() {
  console.log('Testing SNI servername vpxhxaqwnukbqbjvfrpq.supabase.co...');
  const client = new Client({
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.vpxhxaqwnukbqbjvfrpq',
    password: 'vtANuxQ0PahR0n0L',
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log('SUCCESS!');
    await client.end();
  } catch (err) {
    console.log('FAILED:', err.message);
  }
}

test();
