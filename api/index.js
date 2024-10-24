const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

// Scraping functions for each search engine
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

async function scrapeBing(query) {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    try {
        const response = await axios.get(`https://www.bing.com/search?q=${query}`, { headers });
        return response.data;
    } catch (error) {
        console.error('Error scraping Bing:', error);
        return null;
    }
}

async function scrapeDuckDuckGo(query) {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    try {
        const response = await axios.get(`https://duckduckgo.com/?q=${query}`, { headers });
        return response.data;
    } catch (error) {
        console.error('Error scraping DuckDuckGo:', error);
        return null;
    }
}

async function scrapeYahoo(query) {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    try {
        const response = await axios.get(`https://search.yahoo.com/search?p=${query}`, { headers });
        return response.data;
    } catch (error) {
        console.error('Error scraping Yahoo:', error);
        return null;
    }
}

async function scrapeBaidu(query) {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    try {
        const response = await axios.get(`https://www.baidu.com/s?wd=${query}`, { headers });
        return response.data;
    } catch (error) {
        console.error('Error scraping Baidu:', error);
        return null;
    }
}

// Extract links function
function extractLinks(html, engine) {
    const $ = cheerio.load(html);
    const links = [];

    let selector;
    switch (engine) {
        case 'google':
            selector = 'a';
            break;
        case 'bing':
            selector = '.b_algo a';
            break;
        case 'duckduckgo':
            selector = '.result__a';
            break;
        case 'yahoo':
            selector = 'h3.title a';
            break;
        case 'baidu':
            selector = '.result a';
            break;
        default:
            selector = 'a';
    }
    $(selector).each((index, element) => {
        const link = $(element).attr('href');
        const anchorText = $(element).text().trim(); // Extract anchor text
        if (link) {
            links.push({ link, anchorText });
        }
    });
    return links;
}

// Metric calculations
function calculateDomainAuthority(links) {
    const uniqueDomains = new Set();
    links.forEach(({ link }) => {
        try {
            const fullLink = new URL(link, 'https://www.google.com');
            const domain = fullLink.hostname;
            uniqueDomains.add(domain);
        } catch (err) {
            console.error(`Invalid URL encountered: ${link}`, err);
        }
    });
    return uniqueDomains.size * 15;
}

function calculateHttpsPercentage(links) {
    const httpsLinks = links.filter(({ link }) => link.startsWith('https://')).length;
    return (httpsLinks / links.length) * 100;
}

function calculateBacklinkCount(links) {
    const externalLinks = links.filter(({ link }) => !link.includes('google.com')).length;
    return externalLinks;
}

function calculateUniqueDomainCount(links) {
    const uniqueDomains = new Set();
    links.forEach(({ link }) => {
        try {
            const fullLink = new URL(link, 'https://www.google.com');
            const domain = fullLink.hostname;
            uniqueDomains.add(domain);
        } catch (err) {
            console.error(`Invalid URL encountered: ${link}`, err);
        }
    });
    return uniqueDomains.size;
}

function calculateAverageAnchorTextLength(links) {
    const totalLength = links.reduce((acc, { anchorText }) => acc + anchorText.length, 0);
    return totalLength / links.length;
}
app.get('/', async (req, res) => {
    res.json({massage: 'welcome to Domain authority checker'})
});
// API route for domain metrics
app.get('/domain-metrics', async (req, res) => {
    const query = req.query.query;
    const engines = ['google', 'bing', 'duckduckgo', 'yahoo', 'baidu'];
    const result = {};

    if (!query) {
        return res.status(400).json({ success: false, message: 'Query parameter is required' });
    }

    for (const engine of engines) {
        let html;
        try {
            switch (engine) {
                case 'google':
                    html = await scrapeGoogle(query);
                    break;
                case 'bing':
                    html = await scrapeBing(query);
                    break;
                case 'duckduckgo':
                    html = await scrapeDuckDuckGo(query);
                    break;
                case 'yahoo':
                    html = await scrapeYahoo(query);
                    break;
                case 'baidu':
                    html = await scrapeBaidu(query);
                    break;
                default:
                    continue;
            }

            const links = extractLinks(html, engine);
            result[engine] = {
                domain_authority: calculateDomainAuthority(links),
                https_percentage: calculateHttpsPercentage(links),
                backlink_count: calculateBacklinkCount(links),
                unique_domain_count: calculateUniqueDomainCount(links),
                average_anchor_text_length: calculateAverageAnchorTextLength(links),
            };
        } catch (error) {
            console.error(`Error scraping ${engine}:`, error);
            result[engine] = { error: `Error scraping ${engine}` };
        }
    }

    res.json({
        success: true,
        message: 'Generated Domain Data Successfully',
        result
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
