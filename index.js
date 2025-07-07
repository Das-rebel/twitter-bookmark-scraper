import express from 'express';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/scrape', async (req, res) => {
    const { auth_token, user_id } = req.body;
    
    // Validate required parameters
    if (!auth_token) {
        return res.status(400).json({ 
            error: 'Missing auth_token', 
            message: 'auth_token is required in request body' 
        });
    }
    
    if (!user_id) {
        return res.status(400).json({ 
            error: 'Missing user_id', 
            message: 'user_id is required in request body' 
        });
    }

    // Validate auth token against environment variable
    const validToken = process.env.TWITTER_SCRAPER_TOKEN;
    if (validToken && auth_token !== validToken) {
        return res.status(401).json({ 
            error: 'Invalid auth_token', 
            message: 'Provided auth_token does not match configured token' 
        });
    }

    let browser;
    try {
        // Parse cookies from environment or use auth token
        let cookies = [];
        if (process.env.TWITTER_COOKIES) {
            try {
                cookies = JSON.parse(process.env.TWITTER_COOKIES);
            } catch (e) {
                console.warn('Invalid TWITTER_COOKIES format, proceeding without cookies');
            }
        }

        // Launch browser with appropriate options for Render
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--single-process'
            ]
        });

        const page = await browser.newPage();
        
        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Set cookies if available
        if (cookies && cookies.length > 0) {
            await page.setCookie(...cookies);
        }

        // Navigate to bookmarks page
        await page.goto('https://twitter.com/i/bookmarks', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });

        // Wait for tweets to load
        await page.waitForSelector('[data-testid="tweet"]', { timeout: 30000 });

        // Scroll to load more tweets
        let lastHeight = 0;
        let newHeight = await page.evaluate(() => document.body.scrollHeight);
        let scrollAttempts = 0;
        const maxScrollAttempts = 5;

        while (lastHeight < newHeight && newHeight < 15000 && scrollAttempts < maxScrollAttempts) {
            lastHeight = newHeight;
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(2000);
            newHeight = await page.evaluate(() => document.body.scrollHeight);
            scrollAttempts++;
        }

        // Extract tweet data
        const tweets = await page.$$eval('[data-testid="tweet"]', (els) =>
            els.map((tweet) => {
                const timestampElement = tweet.querySelector('time');
                const datetime = timestampElement ? timestampElement.getAttribute('datetime') : null;
                
                const media = Array.from(tweet.querySelectorAll('[data-testid="tweetPhoto"] img, video')).map(
                    (el) => el.src || el.poster
                );

                const tweetTextElement = tweet.querySelector('[data-testid="tweetText"]');
                const authorElement = tweet.querySelector('[data-testid="User-Name"]');
                const linkElement = tweet.querySelector('a[href*="/status/"]');

                return {
                    id: tweet.getAttribute('data-item-id') || `tweet-${Date.now()}-${Math.random()}`,
                    text: tweetTextElement?.textContent || '',
                    author: authorElement?.textContent?.split('·')[0].trim() || '',
                    created_at: datetime || new Date().toISOString(),
                    url: linkElement ? 'https://twitter.com' + linkElement.getAttribute('href') : '',
                    media_urls: media
                };
            })
        );

        // Filter for recent tweets (last 48 hours)
        const recent = tweets.filter((t) => {
            const tweetDate = new Date(t.created_at);
            const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
            return tweetDate > cutoff;
        });

        res.json({
            success: true,
            bookmarks: recent,
            total_count: recent.length,
            scraped_at: new Date().toISOString(),
            user_id: user_id
        });

    } catch (err) {
        console.error('Scraping error:', err);
        res.status(500).json({ 
            error: 'Scraping failed', 
            message: err.message,
            timestamp: new Date().toISOString()
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Twitter bookmark scraper running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
});