const https = require('https');

// Çalıştırma: node --env-file=.env scripts/test-supabase.js
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !anonKey) throw new Error('Supabase değişkenleri .env içinde tanımlı değil');

async function checkTable(tableName) {
  return new Promise((resolve) => {
    const url = new URL(`${supabaseUrl}/rest/v1/${tableName}?select=count`);
    const options = {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Range': '0-0'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          table: tableName,
          status: res.statusCode,
          statusMessage: res.statusMessage,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      resolve({ table: tableName, error: err.message });
    });

    req.end();
  });
}

async function run() {
  console.log('Testing Supabase Connection...');
  const tables = ['profiles', 'trips', 'waypoints', 'user_visited_regions'];
  for (const t of tables) {
    const res = await checkTable(t);
    console.log(`Table '${t}': status=${res.status || 'ERR'}, info=${res.data || res.error}`);
  }
}

run();
