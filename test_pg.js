import pkg from 'pg';
const { Client } = pkg;

async function testSync() {
  const client = new Client({
    connectionString: process.env.TARGET_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to external DB!');
    const res = await client.query('SELECT count(*) FROM auth.users');
    console.log('User count:', res.rows[0].count);
    await client.end();
  } catch (err) {
    console.error('Connection error:', err.message);
  }
}

testSync();
