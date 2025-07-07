import express from 'express';
import { chromium } from 'playwright';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString()
  });
});

app.post('/scrape', async (req, res) => {
  let browser;
  try {
    const rawCookies = process.env.TWITTER_COOKIES;
    if (!rawCookies) {
      throw new Error('TWITTER_COOKIES env var is missing');
    }

    const cookies = JSON.parse(rawCookies);
    if (!Array.isArray(cookies)) {
      throw new Error('TWITTER_COOKIES must be a JSON array');
    }

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: { cookies, origins: [] } });
    const page = await context.newPage();

    console.log('Navigating to Twitter bookmarks...');
    await page.goto('https://twitter.com/i/bookmarks');
    await page.waitForSelector('[data-testid="tweet"]', { timeout: 30000 });

    let lastHeight = 0;
    let newHeight = await page.evaluate(() => document.body.scrollHeight);

    while (lastHeight < newHeight && newHeight < 10000) {
      lastHeight = newHeight;
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      newHeight = await page.evaluate(() => document.body.scrollHeight);
    }

    const tweets = await page.$$eval('[data-testid="tweet"]', (els) =>
      els.map((tweet) => {
        const timestampElement = tweet.querySelector('time');
        const datetime = timestampElement ? timestampElement.getAttribute('datetime') : null;

        const media = Array.from(tweet.querySelectorAll('[data-testid="tweetPhoto"] img, video')).map(
          (el) => el.src || el.poster
        );

        return {
          id: tweet.getAttribute('data-item-id'),
          text: tweet.querySelector('[data-testid="tweetText"]')?.textContent || '',
          author: tweet.querySelector('[data-testid="User-Name"]')?.textContent?.split('·')[0].trim() || '',
          created_at: datetime || new Date().toISOString(),
          url: 'https://twitter.com' + (tweet.querySelector('a[href*="/status/"]')?.getAttribute('href') || ''),
          media_urls: media
        };
      })
    );

    const recent = tweets.filter((t) => {
      const d = new Date(t.created_at);
      return d > new Date(Date.now() - 48 * 60 * 60 * 1000);
    });

    res.json(recent);
  } catch (err) {
    console.error('❌ Scraper error:', err);
    res.status(500).json({ error: 'Scraping failed', detail: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Scraper running at http://localhost:${PORT}`);
});
