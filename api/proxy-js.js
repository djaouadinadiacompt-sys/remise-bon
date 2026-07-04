const https = require('https');
const http = require('http');

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzsrfkE3onWkL4XUm1qo_FF3agc4eDB896v3tALtCIgWfVwX_CF2TFWg9QuBYizlGsl/exec';

function fetchWithRedirects(url, maxRedirects) {
  if (maxRedirects === undefined) maxRedirects = 5;
  return new Promise(function (resolve, reject) {
    var lib = url.startsWith('https') ? https : http;
    lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, function (res) {
      if (
        (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) &&
        res.headers.location &&
        maxRedirects > 0
      ) {
        fetchWithRedirects(res.headers.location, maxRedirects - 1).then(resolve).catch(reject);
      } else {
        var data = '';
        res.on('data', function (chunk) { data += chunk; });
        res.on('end', function () { resolve(data); });
      }
    }).on('error', reject);
  });
}

// ── Format Vercel : export default function(req, res) ──
module.exports = async function (req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  var params = req.query || {};

  try {
    var qs = Object.keys(params).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    }).join('&');

    var url = SCRIPT_URL + (qs ? '?' + qs : '');
    var data = await fetchWithRedirects(url);

    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
