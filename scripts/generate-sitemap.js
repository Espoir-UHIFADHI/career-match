
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DATA_PATH = path.join(__dirname, '../src/data/seo-careers.json');
const PUBLIC_PATH = path.join(__dirname, '../public/sitemap.xml');
const BASE_URL = 'https://careermatch.fr';

// Static Routes
const routes = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/pricing', priority: '0.8', changefreq: 'monthly' },
    { path: '/contact', priority: '0.5', changefreq: 'monthly' },
    { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { path: '/terms', priority: '0.3', changefreq: 'yearly' },
    // /app is behind auth mostly, but the landing is public?
    // Let's exclude /app as it's the app itself.
];

// Helper to format date
const formatDate = (date) => date.toISOString().split('T')[0];

async function generateSitemap() {
    console.log('Generating sitemap...');

    // Read careers data
    let careers = [];
    try {
        const data = fs.readFileSync(DATA_PATH, 'utf8');
        careers = JSON.parse(data);
    } catch (err) {
        console.warn('Could not read seo-careers.json:', err.message);
    }

    const today = formatDate(new Date());

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add Static Routes
    routes.forEach(route => {
        sitemap += `
  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
    });

    // Add Career Routes
    careers.forEach(career => {
        sitemap += `
  <url>
    <loc>${BASE_URL}/career/${career.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    try {
        fs.writeFileSync(PUBLIC_PATH, sitemap);
        console.log(`Sitemap generated at ${PUBLIC_PATH}`);
    } catch (err) {
        console.error('Error writing sitemap:', err);
    }
}

generateSitemap();
