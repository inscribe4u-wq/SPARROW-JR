/*
 * SPARROW Jr. — Netlify Function
 * Secure proxy for Anthropic API calls
 * Built by Inscribe4u
 */

const https = require('https');

exports.handler = async function(event, context) {

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get API key from environment
  const apiKey = process.env.sparrowjr_api_key;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

  return new Promise((resolve) => {
    try {
      const body = event.body;
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: data
          });
        });
      });

      req.on('error', (err) => {
        resolve({
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Request failed: ' + err.message })
        });
      });

      req.write(body);
      req.end();

    } catch (err) {
      resolve({
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Handler error: ' + err.message })
      });
    }
  });
};
