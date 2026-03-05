const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from root directory
app.use(express.static(path.join(__dirname)));

// Croatian Translation Map
const translations = {
    "accesskeys": "Jedinstvene pristupne tipke",
    "area-alt": "Alternativni tekst za područja slike",
    "aria-allowed-attr": "Dozvoljeni ARIA atributi",
    "aria-hidden-body": "Aria-hidden na body elementu",
    "color-contrast": "Kontrast boja",
    "document-title": "Naslov dokumenta",
    "image-alt": "Alternativni tekst slike",
    "label": "Oznake obrazaca",
    "link-name": "Naziv poveznice"
};

// Supabase (lazy-loaded so it doesn't crash if env vars are missing)
let supabase;
try {
    const { createClient } = require('@supabase/supabase-js');
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    }
} catch (e) {
    console.warn('Supabase not configured:', e.message);
}

// Middleware to verify API Key
const verifyApiKey = async (req, res, next) => {
    if (!supabase) return res.status(503).json({ error: 'Database not configured' });
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ error: 'Missing API Key' });

    const { data, error } = await supabase
        .from('Klijenti')
        .select('*')
        .eq('API_Key', apiKey)
        .eq('status_pretplate', 'active')
        .single();

    if (error || !data) return res.status(403).json({ error: 'Invalid or inactive API Key' });
    req.clientData = data;
    next();
};

// Health check (no auth required)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Scan endpoint
app.post('/api/scan', verifyApiKey, async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        // axe-core scanner - only load puppeteer on demand
        const { runScan } = require('./api/_scanner');
        const results = await runScan(url);
        const report = {
            url,
            timestamp: new Date().toISOString(),
            stats: { violations: results.violations.length },
            violations: results.violations.map(v => ({
                id: v.id,
                naziv: translations[v.id] || v.id,
                impact: v.impact,
                nodes: v.nodes.length
            }))
        };
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: 'Skeniranje nije uspjelo: ' + error.message });
    }
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

module.exports = app;
