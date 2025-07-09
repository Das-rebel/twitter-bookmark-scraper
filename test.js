# Twitter Bookmark Scraper - Complete Project Files

## 📁 Project Structure

```
twitter-bookmark-scraper/
├── server.js              # Main application server
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore patterns
├── README.md             # Project documentation
├── render.yaml           # Render deployment configuration
├── test.js              # Testing utilities
├── Dockerfile           # Docker configuration (optional)
└── .github/
    └── workflows/
        └── deploy.yml    # GitHub Actions (optional)
```

## 📦 Files to Create/Update

### 1. Download Instructions

**Save each file below to your project directory with the exact filename shown.**

---

## 🗂️ FILE CONTENTS

### `server.js`
*[Already provided in previous artifact - use the "Fixed server.js" content]*

### `package.json`
*[Already provided in previous artifact - use the "Fixed package.json" content]*

### `.env.example`
*[Already provided in previous artifact - use the ".env.example" content]*

### `README.md`
*[Already provided in previous artifact - use the "Updated README.md" content]*

---

## 📄 Additional Required Files

### `.gitignore`
```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage
.grunt

# Bower dependency directory
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
jspm_packages/

# TypeScript v1 declaration files
typings/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# Logs
logs
*.log

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Render specific
.render/

# Puppeteer
.local-chromium/
```

### `render.yaml`
```yaml
services:
  - type: web
    name: twitter-bookmark-scraper
    env: node
    plan: free
    buildCommand: npm install --production
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PUPPETEER_SKIP_CHROMIUM_DOWNLOAD
        value: false
      - key: PUPPETEER_EXECUTABLE_PATH
        value: /opt/render/project/.render/chrome/opt/google/chrome/google-chrome
    disk:
      name: render-disk
      mountPath: /opt/render/project/.render
      sizeGB: 1
```

### `test.js`
```javascript
// test.js - Test script for Twitter bookmark scraper
const axios = require('axios');

const BASE_URL = process.env.SCRAPER_URL || 'https://twitter-bookmark-scraper.onrender.com';
const AUTH_TOKEN = process.env.TWITTER_SCRAPER_TOKEN || 'your_secure_token_here';
const USER_ID = process.env.TWITTER_USER_ID || '';

async function runTests() {
    console.log('🧪 Testing Twitter Bookmark Scraper');
    console.log(`🔗 Testing URL: ${BASE_URL}`);
    console.log('=====================================\n');

    const results = {
        health: false,
        root: false,
        auth: false,
        scrape: false
    };

    // Test 1: Health Check
    try {
        console.log('1️⃣ Testing health endpoint...');
        const healthResponse = await axios.get(`${BASE_URL}/health`, {
            timeout: 10000
        });
        
        if (healthResponse.status === 200 && healthResponse.data.status === 'healthy') {
            results.health = true;
            console.log('✅ Health check passed');
            console.log(`   Status: ${healthResponse.data.status}`);
            console.log(`   Version: ${healthResponse.data.version}`);
            console.log(`   Uptime: ${healthResponse.data.uptime}s`);
            console.log(`   Memory: ${healthResponse.data.memory?.heapUsed || 'N/A'}`);
        } else {
            console.log('❌ Health check failed - invalid response');
        }
    } catch (error) {
        console.log('❌ Health check failed');
        console.log(`   Error: ${error.message}`);
        if (error.code === 'ECONNREFUSED') {
            console.log('   Service appears to be down or unreachable');
        }
    }

    console.log('\n');

    // Test 2: Root endpoint
    try {
        console.log('2️⃣ Testing root endpoint...');
        const rootResponse = await axios.get(`${BASE_URL}/`, {
            timeout: 10000
        });
        
        if (rootResponse.status === 200 && rootResponse.data.message) {
            results.root = true;
            console.log('✅ Root endpoint passed');
            console.log(`   Message: ${rootResponse.data.message}`);
            console.log(`   Status: ${rootResponse.data.status}`);
        }
    } catch (error) {
        console.log('❌ Root endpoint failed');
        console.log(`   Error: ${error.message}`);
    }

    console.log('\n');

    // Test 3: Authentication validation
    try {
        console.log('3️⃣ Testing authentication...');
        const authResponse = await axios.post(`${BASE_URL}/scrape`, {}, {
            timeout: 10000
        });
        console.log('❌ Authentication test failed - should have rejected empty request');
    } catch (error) {
        if (error.response && error.response.status === 401) {
            results.auth = true;
            console.log('✅ Authentication validation working');
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Error: ${error.response.data.error}`);
        } else {
            console.log('❌ Authentication test failed - unexpected error');
            console.log(`   Error: ${error.message}`);
        }
    }

    console.log('\n');

    // Test 4: Scraping (if auth token provided)
    if (AUTH_TOKEN && AUTH_TOKEN !== 'your_secure_token_here') {
        try {
            console.log('4️⃣ Testing scrape endpoint...');
            console.log('   This may take 30-60 seconds...');
            
            const scrapeResponse = await axios.post(`${BASE_URL}/scrape`, {
                auth_token: AUTH_TOKEN,
                user_id: USER_ID
            }, {
                timeout: 70000 // 70 second timeout
            });
            
            if (scrapeResponse.status === 200 && scrapeResponse.data.success) {
                results.scrape = true;
                console.log('✅ Scraping test passed');
                console.log(`   Success: ${scrapeResponse.data.success}`);
                console.log(`   Total bookmarks: ${scrapeResponse.data.total_count}`);
                console.log(`   Processing time: ${scrapeResponse.data.processing_time_ms}ms`);
                
                if (scrapeResponse.data.bookmarks && scrapeResponse.data.bookmarks.length > 0) {
                    const sample = scrapeResponse.data.bookmarks[0];
                    console.log('   Sample bookmark:');
                    console.log(`     Author: ${sample.author}`);
                    console.log(`     Text: ${sample.text.substring(0, 50)}...`);
                }
            }
        } catch (error) {
            console.log('❌ Scraping test failed');
            console.log(`   Error: ${error.message}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
            }
        }
    } else {
        console.log('4️⃣ Skipping scrape test - AUTH_TOKEN not configured');
        console.log('   Set TWITTER_SCRAPER_TOKEN environment variable to test scraping');
    }

    // Summary
    console.log('\n=====================================');
    console.log('📊 Test Results Summary:');
    console.log(`   Health Check: ${results.health ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Root Endpoint: ${results.root ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Authentication: ${results.auth ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Scraping: ${results.scrape ? '✅ PASS' : '⏭️ SKIPPED'}`);
    
    const passCount = Object.values(results).filter(Boolean).length;
    const totalTests = AUTH_TOKEN !== 'your_secure_token_here' ? 4 : 3;
    
    console.log(`\n🎯 Overall: ${passCount}/${totalTests} tests passed`);
    
    if (passCount === totalTests) {
        console.log('🎉 All tests passed! Service is working correctly.');
    } else if (results.health && results.root) {
        console.log('⚠️ Service is running but some features may not work.');
    } else {
        console.log('🚨 Service has critical issues that need attention.');
    }
    
    console.log('=====================================');
}

// Performance monitoring
async function monitorService(duration = 60000, interval = 5000) {
    console.log(`📊 Monitoring service for ${duration/1000} seconds...\n`);
    
    const results = [];
    const startTime = Date.now();
    
    while (Date.now() - startTime < duration) {
        try {
            const start = Date.now();
            const response = await axios.get(`${BASE_URL}/health`, { 
                timeout: interval - 1000 
            });
            const responseTime = Date.now() - start;
            
            results.push({
                timestamp: new Date().toISOString(),
                responseTime,
                status: response.status,
                healthy: response.data.status === 'healthy'
            });
            
            process.stdout.write(`⏱️ ${responseTime}ms `);
            
        } catch (error) {
            results.push({
                timestamp: new Date().toISOString(),
                responseTime: null,
                status: 'error',
                healthy: false,
                error: error.message
            });
            process.stdout.write(`❌ Error `);
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    // Calculate statistics
    const successful = results.filter(r => r.healthy);
    const failed = results.filter(r => !r.healthy);
    
    console.log('\n\n📈 Performance Summary:');
    console.log(`   Total requests: ${results.length}`);
    console.log(`   Successful: ${successful.length} (${Math.round(successful.length/results.length*100)}%)`);
    console.log(`   Failed: ${failed.length} (${Math.round(failed.length/results.length*100)}%)`);
    
    if (successful.length > 0) {
        const times = successful.map(r => r.responseTime);
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        
        console.log(`   Avg response time: ${Math.round(avgTime)}ms`);
        console.log(`   Min response time: ${minTime}ms`);
        console.log(`   Max response time: ${maxTime}ms`);
        
        if (avgTime < 1000) {
            console.log('   Performance: ✅ Excellent');
        } else if (avgTime < 3000) {
            console.log('   Performance: ⚠️ Good');
        } else {
            console.log('   Performance: 🐌 Slow');
        }
    }
}

// Cookie validation helper
function validateCookies(cookieString) {
    try {
        const cookies = JSON.parse(cookieString);
        
        if (!Array.isArray(cookies)) {
            return { valid: false, error: 'Cookies must be an array' };
        }
        
        const requiredFields = ['name', 'value', 'domain'];
        const requiredCookies = ['auth_token'];
        
        const cookieNames = cookies.map(c => c.name);
        const missingRequired = requiredCookies.filter(name => !cookieNames.includes(name));
        
        if (missingRequired.length > 0) {
            return { 
                valid: false, 
                error: `Missing required cookies: ${missingRequired.join(', ')}` 
            };
        }
        
        for (const cookie of cookies) {
            for (const field of requiredFields) {
                if (!cookie[field]) {
                    return { 
                        valid: false, 
                        error: `Missing ${field} in cookie: ${cookie.name || 'unnamed'}` 
                    };
                }
            }
        }
        
        return { valid: true, cookieCount: cookies.length };
        
    } catch (error) {
        return { valid: false, error: `Invalid JSON: ${error.message}` };
    }
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--monitor')) {
        const duration = parseInt(args[args.indexOf('--monitor') + 1]) || 60000;
        monitorService(duration);
    } else if (args.includes('--validate-cookies')) {
        const cookieString = args[args.indexOf('--validate-cookies') + 1];
        if (cookieString) {
            const result = validateCookies(cookieString);
            if (result.valid) {
                console.log(`✅ Cookie validation passed (${result.cookieCount} cookies)`);
            } else {
                console.log(`❌ Cookie validation failed: ${result.error}`);
            }
        } else {
            console.log('Usage: node test.js --validate-cookies "cookie_json_string"');
        }
    } else {
        runTests();
    }
}

module.exports = {
    runTests,
    monitorService,
    validateCookies
};
```

### `Dockerfile` (Optional)
```dockerfile
# Use official Puppeteer image which includes Chrome
FROM ghcr.io/puppeteer/puppeteer:21.6.1

# Set working directory
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create non-root user for security
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /usr/src/app

# Switch to non-root user
USER pptruser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start application
CMD ["npm", "start"]
```

---

## 🚀 Deployment Instructions

### Step 1: Download Files
1. Copy each file content above into separate files
2. Save with exact filenames shown
3. Ensure proper file structure

### Step 2: Update Environment Variables
1. Copy `.env.example` to `.env` 
2. Fill in your actual values:
   - Generate a secure token for `TWITTER_SCRAPER_TOKEN`
   - Get fresh Twitter cookies for `TWITTER_COOKIES`
   - Set your Twitter user ID for `TWITTER_USER_ID`

### Step 3: Test Locally (Optional)
```bash
npm install
npm test
npm start
```

### Step 4: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - Twitter bookmark scraper"
git remote add origin https://github.com/Das-rebel/twitter-bookmark-scraper.git
git push -u origin main
```

### Step 5: Deploy to Render
1. Connect GitHub repo to Render
2. Set environment variables in Render dashboard
3. Deploy!

---

## 📋 Checklist

- [ ] All files created with correct names
- [ ] Environment variables configured
- [ ] Fresh Twitter cookies obtained
- [ ] Secure token generated
- [ ] Local testing completed (optional)
- [ ] Pushed to GitHub
- [ ] Deployed to Render
- [ ] Endpoints tested

---

## 🆘 Getting Help

If you encounter issues:

1. **Check Render logs** for detailed error messages
2. **Run local tests** using `npm test`
3. **Validate cookies** using `npm run validate:cookies`
4. **Monitor performance** using `npm run test:monitor`

Common issues:
- **Expired cookies**: Refresh from Twitter
- **Invalid token**: Generate new secure token
- **Memory errors**: Restart Render service
- **Timeout errors**: Twitter rate limiting

The scraper should now work reliably on Render! 🎉
