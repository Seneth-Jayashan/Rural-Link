const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');
const { optimizeRoute } = require('../services/routeOptimization');

// Route optimization endpoint for delivery users
router.post('/optimize-route', auth, roles('deliver'), (req, res) => {
  const { start, stops } = req.body;
  if (!start || !stops || !Array.isArray(stops) || stops.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }
  const result = optimizeRoute(start, stops);
  res.json({ success: true, data: result });
});

// Google Translate proxy endpoint
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLang } = req.body || {};
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) return res.status(500).json({ success: false, message: 'Translation API not configured' });
    if (!targetLang || !text || (Array.isArray(text) && text.length === 0)) {
      return res.status(400).json({ success: false, message: 'Missing text or targetLang' });
    }

    const texts = Array.isArray(text) ? text : [text];

    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: texts, target: targetLang, format: 'text', source: 'en' })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ success: false, message: 'Translate failed', error: err });
    }
    const json = await response.json();
    const translations = json?.data?.translations?.map(t => t.translatedText) || [];
    return res.json({ success: true, data: translations });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;


