const express = require('express');
const cors = require('cors');
const { runScan } = require('./_scanner');
const { supabase } = require('./_db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

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

// Middleware to verify API Key
const verifyApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ error: 'Missing API Key' });

    const { data, error } = await supabase
        .from('Klijenti')
        .select('*')
        .eq('API_Key', apiKey)
        .eq('status_pretplate', 'active')
        .single();

    if (error || !data) {
        return res.status(403).json({ error: 'Invalid or inactive API Key' });
    }

    req.clientData = data;
    next();
};

app.post('/api/scan', verifyApiKey, async (req, res) => {
    const { url } = req.body;
    // Basic validation: ensure the URL matches the registered client URL
    if (!url || !url.includes(req.clientData.URL_stranice)) {
        return res.status(400).json({ error: 'URL mismatch or missing' });
    }

    try {
        const results = await runScan(url);
        const report = {
            url: url,
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
        res.status(500).json({ error: 'Skeniranje nije uspjelo' });
    }
});

module.exports = app;
