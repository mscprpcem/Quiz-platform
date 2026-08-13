const express = require('express');
const router = express.Router();
const https = require('https');

// Helper to fetch JSON from a URL
const fetchJson = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Failed to fetch JSON, status code: ${res.statusCode}`));
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON received from URL'));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds cache

const DEFAULT_BRANDING = {
  club_name: 'Microsoft Student Club PRPCEM',
  chapter_name: 'Microsoft Student Club PRPCEM',
  signing_authority: 'Prof. S. R. Patil',
  domain_name: 'mscprpcem.tech',
  chapter_identifier: 'MSC-PRPCEM-4112',
  chapter_code: 'MSC-PRPCEM-4112',
  logo_path: 'logo.png',
  primary_color: '#0078d4',
  footer_text: 'Powered by Microsoft Student Club PRPCEM Quiz Platform',
  qr_logo_size: 28
};

const getBrandingSettings = async () => {
  const url = process.env.AZURE_BRANDING_URL;
  if (!url) {
    return DEFAULT_BRANDING;
  }

  // Return cached version if still valid
  const now = Date.now();
  if (cache && (now - cacheTime < CACHE_TTL)) {
    return cache;
  }

  try {
    const fetched = await fetchJson(url);
    cache = {
      club_name: fetched.club_name || DEFAULT_BRANDING.club_name,
      chapter_name: fetched.chapter_name || DEFAULT_BRANDING.chapter_name,
      signing_authority: fetched.signing_authority || DEFAULT_BRANDING.signing_authority,
      domain_name: fetched.domain_name || DEFAULT_BRANDING.domain_name,
      chapter_identifier: fetched.chapter_identifier || DEFAULT_BRANDING.chapter_identifier,
      chapter_code: fetched.chapter_code || DEFAULT_BRANDING.chapter_code,
      logo_path: fetched.logo_path || DEFAULT_BRANDING.logo_path,
      primary_color: fetched.primary_color || DEFAULT_BRANDING.primary_color,
      footer_text: fetched.footer_text || DEFAULT_BRANDING.footer_text,
      qr_logo_size: fetched.qr_logo_size !== undefined ? parseInt(fetched.qr_logo_size, 10) : 28
    };
    cacheTime = now;
    return cache;
  } catch (error) {
    console.warn("Branding remote fetch fallback (using default chapter settings):", error.message);
    if (cache) {
      return cache; // return stale cache if fetch fails
    }
    // Return robust chapter identity default
    return DEFAULT_BRANDING;
  }
};

// ----------------------------------------------------
// GET /api/branding — Public (no auth needed so QR cards work)
// ----------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const settings = await getBrandingSettings();
    return res.json(settings);
  } catch (error) {
    console.error('Fetch branding error:', error);
    return res.status(500).json({ error: 'Server error fetching branding settings' });
  }
});

// Disable all mutating endpoints
router.put('/', (req, res) => {
  return res.status(405).json({ error: 'Branding settings are read-only and configured in backend.' });
});

router.post('/logo', (req, res) => {
  return res.status(405).json({ error: 'Logo upload is disabled. Logo path should be configured in backend.' });
});

router.delete('/logo', (req, res) => {
  return res.status(405).json({ error: 'Logo deletion is disabled. Logo path should be configured in backend.' });
});

module.exports = router;
