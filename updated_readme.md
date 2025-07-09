# 🐦 Twitter Bookmark Scraper

A robust, cloud-based Twitter bookmark scraper designed for n8n automation workflows. Uses Puppeteer for reliable web scraping and deploys easily on Render with comprehensive error handling and monitoring.

## ✨ Features

- 🔒 **Secure API**: Token-based authentication for n8n integration
- 🚀 **Robust Scraping**: Uses Puppeteer with optimized browser settings for Render
- ☁️ **Cloud Ready**: Configured for Render deployment with health checks
- ⏰ **Recent Filtering**: Automatically filters bookmarks from last 48 hours
- 🛡️ **Error Handling**: Comprehensive error responses and detailed logging
- 📊 **Monitoring**: Built-in status endpoints and performance monitoring
- 🔧 **Optimized**: Memory-efficient configuration for free hosting tiers

## 🚀 Quick Start

### 1. Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Fork this repository
2. Connect to [Render Dashboard](https://dashboard.render.com)
3. Create new Web Service
4. Connect your GitHub repository
5. Configure environment variables (see below)
6. Deploy!

### 2. Environment Variables

Configure these in your Render dashboard:

```env
TWITTER_SCRAPER_TOKEN=your_secure_random_token_here
TWITTER_COOKIES=[{"name":"auth_token","value":"...","domain":".twitter.com","path":"/","secure":true,"httpOnly":true}]
TWITTER_USER_ID=your_twitter_user_id
NODE_ENV=production
```

### 3. Get Twitter Cookies

1. **Login to Twitter** in your browser
2. **Open Developer Tools** (F12)
3. **Go to Application → Cookies → https://twitter.com**
4. **Copy the following cookies:**
   - `auth_token` (required)
   - `ct0` (required for some requests)
5. **Format as JSON array:**

```json
[
  {
    "name": "auth_token",
    "value": "your_actual_auth_token_value_here",
    "domain": ".twitter.com",
    "path": "/",
    "secure": true,
    "httpOnly": true
  },
  {
    "name": "ct0", 
    "value": "your_ct0_value_here",
    "domain": ".twitter.com",
    "path": "/",
    "secure": true,
    "httpOnly": false
  }
]
```

> ⚠️ **Important**: Keep cookies on a single line in environment variables

## 📡 API Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "twitter-bookmark-scraper", 
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.1",
  "uptime": 3600,
  "memory": {
    "rss": "150 MB",
    "heapUsed": "75 MB"
  }
}
```

### Scrape Bookmarks
```http
POST /scrape
Content-Type: application/json

{
  "auth_token": "your_secure_token",
  "user_id": "twitter_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "bookmarks": [
    {
      "id": "1234567890",
      "text": "Tweet content...",
      "author": "Author Name",
      "created_at": "2024-01-01T00:00:00.000Z",
      "url": "https://twitter.com/user/status/1234567890",
      "media_urls": ["https://pbs.twimg.com/media/..."],
      "scraped_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total_count": 5,
  "total_found": 10,
  "scraped_at": "2024-01-01T00:00:00.000Z", 
  "user_id": "twitter_user_id",
  "processing_time_ms": 1500,
  "filter_applied": "last_48_hours"
}
```

### Detailed Status
```http
GET /status
```

Returns comprehensive service information including memory usage, configuration status, and system details.

## 🔧 Local Development

### Prerequisites
- Node.js 18+ 
- npm 8+

### Setup
```bash
# Clone repository
git clone https://github.com/Das-rebel/twitter-bookmark-scraper.git
cd twitter-bookmark-scraper

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start development server
npm run dev
```

### Testing
```bash
# Run basic tests
npm test

# Monitor performance
npm run test:monitor

# Validate cookie format
npm run validate:cookies "your_cookie_json_string"
```

## 🔗 n8n Integration

### HTTP Request Node Configuration

**URL:** `https://your-render-app.onrender.com/scrape`  
**Method:** `POST`  
**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "auth_token": "{{ $env.TWITTER_SCRAPER_TOKEN }}",
  "user_id": "{{ $env.TWITTER_USER_ID }}"
}
```

### Environment Variables in n8n
Set these in your n8n environment:
- `TWITTER_SCRAPER_TOKEN` - Your secure API token
- `TWITTER_USER_ID` - Your Twitter user ID (optional)

## 🛠️ Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **"Invalid auth token"** | Check `TWITTER_SCRAPER_TOKEN` matches between n8n and Render |
| **"Not logged in"** | Refresh Twitter cookies - they expire periodically |
| **"No bookmarks found"** | Ensure account has bookmarks within last 48 hours |
| **Timeout errors** | Twitter may be rate-limiting - wait and retry |
| **Memory issues**