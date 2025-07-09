const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    const memoryUsage = process.memoryUsage();
    res.json({ 
        status: 'healthy', 
        service: 'twitter-bookmark-scraper',
        timestamp: new Date().toISOString(),
        version: '1.0.1',
        uptime: Math.floor(process.uptime()),
        memory: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB'
        },
        environment: {
            node_version: process.version,
            platform: process.platform,
            has_cookies: !!process.env.TWITTER_COOKIES,
            has_token: !!process.env.TWITTER_SCRAPER_TOKEN
        }
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Twitter Bookmark Scraper API',
        status: 'running',
        version: '1.0.1',
        endpoints: {
            health: 'GET /health - Service health check',
            scrape: 'POST /scrape - Scrape Twitter bookmarks',
            status: 'GET /status - Detailed status information'
        },
        documentation: 'https://github.com/Das-rebel/twitter-bookmark-scraper',
        timestamp: new Date().toISOString()
    });
});

// Status endpoint with detailed information
app.get('/status', (req, res) => {
    const memoryUsage = process.memoryUsage();
    res.json({
        service: 'twitter-bookmark-scraper',
        status: 'operational',
        uptime_seconds: Math.floor(process.uptime()),
        memory_usage: {
            rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
            heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            external_mb: Math.round(memoryUsage.external / 1024 / 1024)
        },
        environment: {
            node_version: process.version,
            platform: process.platform,
            arch: process.arch,
            pid: process.pid
        },
        configuration: {
            twitter_cookies_configured: !!process.env.TWITTER_COOKIES,
            auth_token_configured: !!process.env.TWITTER_SCRAPER_TOKEN,
            user_id_configured: !!process.env.TWITTER_USER_ID,
            port: PORT
        },
        timestamp: new Date().toISOString()
    });
});

// Main scraper endpoint
app.post('/scrape', async (req, res) => {
    let browser = null;
    const startTime = Date.now();
    
    try {
        console.log('🚀 Starting scrape request...');
        
        // Validate request body
        const { auth_token, user_id } = req.body;
        
        // Authentication check
        if (!auth_token) {
            console.log('❌ Missing auth token');
            return res.status(401).json({ 
                success: false, 
                error: 'Missing auth_token in request body',
                timestamp: new Date().toISOString()
            });
        }
        
        if (auth_token !== process.env.TWITTER_SCRAPER_TOKEN) {
            console.log('❌ Invalid auth token');
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid auth token',
                timestamp: new Date().toISOString()
            });
        }

        // Environment validation
        if (!process.env.TWITTER_COOKIES) {
            console.log('❌ Twitter cookies not configured');
            return res.status(500).json({
                success: false,
                error: 'Twitter cookies not configured in environment variables',
                timestamp: new Date().toISOString()
            });
        }

        console.log('✅ Authentication successful');
        console.log('🌐 Launching browser...');
        
        // Launch browser with optimized settings for Render
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI,VizDisplayCompositor',
                '--disable-ipc-flooding-protection',
                '--memory-pressure-off',
                '--max_old_space_size=512',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-images',
                '--disable-javascript-harmony-shipping',
                '--disable-background-networking',
                '--disable-default-apps',
                '--disable-sync'
            ],
            timeout: 30000,
            protocolTimeout: 30000,
            ignoreDefaultArgs: ['--disable-extensions']
        });

        console.log('✅ Browser launched successfully');
        
        const page = await browser.newPage();
        
        // Optimize page settings
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Disable images and fonts to speed up loading
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (resourceType === 'image' || resourceType === 'font') {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Parse and set cookies
        let cookies;
        try {
            cookies = JSON.parse(process.env.TWITTER_COOKIES);
            if (!Array.isArray(cookies)) {
                throw new Error('Cookies must be an array');
            }
            console.log(`🍪 Setting ${cookies.length} cookies...`);
        } catch (error) {
            console.error('❌ Cookie parsing error:', error);
            return res.status(500).json({
                success: false,
                error: 'Invalid cookie format in environment variables',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }

        await page.setCookie(...cookies);
        console.log('✅ Cookies set successfully');

        // Navigate to bookmarks page
        const targetUserId = user_id || process.env.TWITTER_USER_ID || 'i';
        const bookmarksUrl = `https://twitter.com/${targetUserId}/bookmarks`;
        
        console.log(`🔗 Navigating to: ${bookmarksUrl}`);
        
        await page.goto(bookmarksUrl, { 
            waitUntil: 'domcontentloaded', 
            timeout: 25000 
        });

        // Wait for page to stabilize
        await page.waitForTimeout(3000);

        // Check if we're logged in
        console.log('🔐 Checking login status...');
        const isLoggedIn = await page.evaluate(() => {
            // Check for multiple indicators of being logged in
            return !!(
                document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]') ||
                document.querySelector('[data-testid="AppTabBar_Home_Link"]') ||
                document.querySelector('[aria-label="Home timeline"]') ||
                document.querySelector('[data-testid="primaryColumn"]')
            );
        });

        if (!isLoggedIn) {
            console.log('❌ Not logged in');
            
            // Check if we're on login page
            const isLoginPage = await page.evaluate(() => {
                return !!(
                    document.querySelector('[data-testid="loginButton"]') ||
                    document.querySelector('input[name="password"]') ||
                    document.title.toLowerCase().includes('login')
                );
            });

            return res.status(401).json({
                success: false,
                error: 'Authentication failed - not logged in to Twitter',
                details: isLoginPage ? 'Redirected to login page' : 'Login indicators not found',
                suggestion: 'Please refresh your Twitter cookies',
                timestamp: new Date().toISOString()
            });
        }

        console.log('✅ Successfully logged in to Twitter');
        console.log('📖 Scraping bookmarks...');
        
        // Wait for bookmarks to load
        try {
            await page.waitForSelector('[data-testid="tweet"], [data-testid="cellInnerDiv"]', { 
                timeout: 15000 
            });
        } catch (waitError) {
            console.log('⚠️ No tweets found immediately, proceeding anyway...');
        }

        // Scrape bookmarks with improved selector strategy
        const bookmarks = await page.evaluate(() => {
            const tweets = [];
            
            // Try multiple selectors for tweets
            const selectors = [
                '[data-testid="tweet"]',
                '[data-testid="cellInnerDiv"] article',
                'article[data-testid="tweet"]',
                '[role="article"]'
            ];
            
            let tweetElements = [];
            for (const selector of selectors) {
                tweetElements = document.querySelectorAll(selector);
                if (tweetElements.length > 0) {
                    console.log(`Found ${tweetElements.length} tweets using selector: ${selector}`);
                    break;
                }
            }
            
            if (tweetElements.length === 0) {
                console.log('No tweet elements found with any selector');
                return [];
            }
            
            tweetElements.forEach((element, index) => {
                try {
                    // Extract tweet text with multiple fallbacks
                    const textSelectors = [
                        '[data-testid="tweetText"]',
                        '[lang] span',
                        '.css-901oao.css-16my406',
                        'div[lang] span'
                    ];
                    
                    let text = '';
                    for (const selector of textSelectors) {
                        const textElement = element.querySelector(selector);
                        if (textElement && textElement.innerText.trim()) {
                            text = textElement.innerText.trim();
                            break;
                        }
                    }
                    
                    // Extract author with fallbacks
                    const authorSelectors = [
                        '[data-testid="User-Name"] span:first-child',
                        '[data-testid="User-Name"] span',
                        'a[role="link"] span',
                        '.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0'
                    ];
                    
                    let author = '';
                    for (const selector of authorSelectors) {
                        const authorElement = element.querySelector(selector);
                        if (authorElement && authorElement.innerText.trim()) {
                            author = authorElement.innerText.trim();
                            break;
                        }
                    }
                    
                    // Extract time
                    const timeElement = element.querySelector('time');
                    const created_at = timeElement ? 
                        timeElement.getAttribute('datetime') || timeElement.title : 
                        new Date().toISOString();
                    
                    // Extract tweet URL
                    const linkSelectors = [
                        'a[href*="/status/"]',
                        'time[datetime]',
                        '[data-testid="User-Name"] + div a'
                    ];
                    
                    let url = '';
                    for (const selector of linkSelectors) {
                        const linkElement = element.querySelector(selector);
                        if (linkElement) {
                            const href = linkElement.getAttribute('href');
                            if (href && href.includes('/status/')) {
                                url = href.startsWith('http') ? href : `https://twitter.com${href}`;
                                break;
                            }
                        }
                    }
                    
                    // Extract tweet ID from URL
                    const idMatch = url.match(/status\/(\d+)/);
                    const id = idMatch ? idMatch[1] : `bookmark_${Date.now()}_${index}`;
                    
                    // Extract media URLs
                    const mediaElements = element.querySelectorAll('img[src*="pbs.twimg.com"], img[src*="video_thumb"]');
                    const media_urls = Array.from(mediaElements).map(img => {
                        const src = img.src;
                        // Get higher quality images
                        return src.replace(/&name=\w+/, '&name=large');
                    });
                    
                    // Only add if we have meaningful content
                    if (text || author || url) {
                        tweets.push({
                            id,
                            text: text || '[No text content]',
                            author: author || '[Unknown author]',
                            created_at,
                            url: url || '',
                            media_urls,
                            scraped_at: new Date().toISOString()
                        });
                    }
                } catch (error) {
                    console.error('Error extracting tweet:', error);
                }
            });
            
            return tweets;
        });

        const processingTime = Date.now() - startTime;
        console.log(`✅ Found ${bookmarks.length} bookmarks in ${processingTime}ms`);

        // Filter recent bookmarks (last 48 hours) if requested
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const recentBookmarks = bookmarks.filter(bookmark => {
            if (!bookmark.created_at) return true; // Include if no date
            const bookmarkDate = new Date(bookmark.created_at);
            return bookmarkDate > twoDaysAgo;
        });

        const response = {
            success: true,
            bookmarks: recentBookmarks,
            total_count: recentBookmarks.length,
            total_found: bookmarks.length,
            scraped_at: new Date().toISOString(),
            user_id: targetUserId,
            processing_time_ms: processingTime,
            filter_applied: 'last_48_hours'
        };

        console.log(`🎉 Scraping completed successfully! ${recentBookmarks.length}/${bookmarks.length} bookmarks returned`);
        res.json(response);

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('❌ Scraping error:', error);
        
        // Determine error type for better user feedback
        let errorType = 'unknown_error';
        let userMessage = error.message;
        
        if (error.message.includes('timeout')) {
            errorType = 'timeout_error';
            userMessage = 'Request timeout - Twitter may be slow or blocking requests';
        } else if (error.message.includes('net::')) {
            errorType = 'network_error';
            userMessage = 'Network connection error';
        } else if (error.message.includes('Protocol error')) {
            errorType = 'browser_error';
            userMessage = 'Browser communication error';
        }
        
        res.status(500).json({
            success: false,
            error: userMessage,
            error_type: errorType,
            processing_time_ms: processingTime,
            timestamp: new Date().toISOString(),
            suggestions: [
                'Check if Twitter cookies are valid and recent',
                'Verify Twitter account has bookmarks',
                'Try again in a few minutes if rate limited'
            ]
        });
    } finally {
        // Cleanup browser
        if (browser) {
            try {
                await browser.close();
                console.log('🧹 Browser closed successfully');
            } catch (closeError) {
                console.error('⚠️ Error closing browser:', closeError);
            }
        }
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('💥 Unhandled application error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        message: 'An unexpected error occurred'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
        available_endpoints: ['/', '/health', '/status', '/scrape'],
        timestamp: new Date().toISOString()
    });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n🚀 Twitter Bookmark Scraper Server Started');
    console.log('=====================================');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Status check: http://localhost:${PORT}/status`);
    console.log('\n🔧 Environment Configuration:');
    console.log(`   • Auth Token: ${process.env.TWITTER_SCRAPER_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`   • Twitter Cookies: ${process.env.TWITTER_COOKIES ? '✅ Set' : '❌ Missing'}`);
    console.log(`   • Twitter User ID: ${process.env.TWITTER_USER_ID || '❌ Not set (will use default)'}`);
    console.log(`   • Node Version: ${process.version}`);
    console.log(`   • Platform: ${process.platform}`);
    console.log('=====================================\n');
});

// Graceful shutdown handling
const gracefulShutdown = () => {
    console.log('\n🛑 Received shutdown signal, closing server gracefully...');
    server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        console.log('⚠️ Forcing server shutdown...');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown();
});