const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');

async function runScan(url) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Set viewport for a standard experience
        await page.setViewport({ width: 1280, height: 800 });

        // Navigate to URL
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Inject axe-core and run analysis
        const results = await new AxePuppeteer(page)
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        return results;
    } catch (error) {
        console.error('Scan failed:', error);
        throw error;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { runScan };
