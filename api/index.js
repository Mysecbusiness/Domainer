const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());
// app.use(express.static('public'));  // Serve static files from 'public' folder

// Scraping function
async function scrapeGoogle(query) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    try {
        const response = await axios.get(`https://www.google.com/search?q=${query}`, { headers });
        return response.data;
    } catch (error) {
        console.error('Error scraping Google:', error);
        return null;
    }
}

// Extract links function
function extractLinks(html) {
    const $ = cheerio.load(html);
    const links = [];

    $('a').each((index, element) => {
        const link = $(element).attr('href');
        if (link) {
            links.push(link);
        }
    });

    return links;
}

// Metric calculation functions
function calculateDomainPower(links) {
    return links.length * 10;
}

function calculateOrganicClicks(links) {
    return links.length * 50;
}

function calculateAverageRank(links) {
    const ranks = links.map((_, index) => index + 1);
    return ranks.reduce((a, b) => a + b, 0) / ranks.length;
}

function calculateKeywordsRank(links) {
    return links.length * 20;
}

// API route for domain metrics
app.get('/domain-metrics', async (req, res) => {
    const query = req.query.query;  // Accept 'query' parameter in the GET request

    if (!query) {
        return res.status(400).json({ success: false, message: 'Query parameter is required' });
    }

    const html = await scrapeGoogle(query);
    if (!html) {
        return res.status(500).json({ success: false, message: 'Failed to scrape data' });
    }

    const links = extractLinks(html);
    const domainPower = calculateDomainPower(links);
    const organicClicks = calculateOrganicClicks(links);
    const averageRank = calculateAverageRank(links);
    const keywordsRank = calculateKeywordsRank(links);

    res.json({
        success: true,
        message: 'Generated Domain Data Successfully',
        result: {
            domain_power: domainPower,
            organic_clicks: organicClicks,
            average_rank: averageRank,
            keywords_rank: keywordsRank
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
