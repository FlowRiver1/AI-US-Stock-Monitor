// Quick API connection test — reads key from config
const fs = require('fs');
const path = require('path');
const https = require('https');

const configPath = path.join(__dirname, '..', '..', 'config', 'server-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

console.log('Testing with:');
console.log('  URL:', `${config.baseUrl}/v1/messages`);
console.log('  Model:', config.model);
console.log('  Key preview:', config.apiKey.slice(0, 9) + '...');
console.log();

const data = JSON.stringify({
  model: config.model,
  max_tokens: 5,
  messages: [{ role: 'user', content: 'Hi' }]
});

const url = new URL(config.baseUrl + '/v1/messages');
const req = https.request(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': config.apiKey,
    'anthropic-version': '2023-06-01'
  }
}, res => {
  console.log('HTTP Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('Response body (first 500 chars):');
    console.log(body.slice(0, 500));
    if (res.statusCode === 200) {
      console.log('\n✅ Connection OK!');
    } else if (res.statusCode === 404) {
      console.log('\n❌ 404 — URL not found. The endpoint path may be incorrect.');
      console.log('   Tried: ' + config.baseUrl + '/v1/messages');
    } else if (res.statusCode === 401) {
      console.log('\n❌ 401 — API Key invalid or expired.');
    }
  });
});
req.on('error', e => console.log('ERROR:', e.message));
req.write(data);
req.end();
