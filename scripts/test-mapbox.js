const https = require('https');

// Çalıştırma: node --env-file=.env scripts/test-mapbox.js
const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (!mapboxToken) throw new Error('EXPO_PUBLIC_MAPBOX_TOKEN .env içinde tanımlı değil');
const url = `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${mapboxToken}`;

https.get(url, (res) => {
  console.log(`Mapbox Style API status: ${res.statusCode} ${res.statusMessage}`);
}).on('error', (err) => {
  console.log(`Mapbox error: ${err.message}`);
});
