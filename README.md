# Twitter Bookmark Scraper

A cloud-based Twitter bookmark scraper designed for n8n automation workflows. Uses Puppeteer for reliable web scraping and deploys easily on Render.

## Features

- **Secure API**: Token-based authentication for n8n integration
- **Robust Scraping**: Uses Puppeteer with optimized browser settings
- **Cloud Ready**: Configured for Render deployment with health checks
- **Recent Filtering**: Automatically filters bookmarks from last 48 hours
- **Error Handling**: Comprehensive error responses and logging

## API Endpoints

### POST `/scrape`
Scrapes Twitter bookmarks for the authenticated user.

**Request Body:**
```json
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
      "id": "tweet_id",
      "text": "Tweet content...",
      "author": "Author Name",
      "created_at": "2024-01-01T00:00:00.000Z",
      "url": "https://twitter.com/user/status/123",
      "media_urls": ["https://..."]
    }
  ],
  "total_count": 5,
  "scraped_at": "2024-01-01T00:00:00.000Z",
  "user_id": "twitter_user_id"
}
```

### GET `/health`
Health check endpoint for monitoring.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TWITTER_SCRAPER_TOKEN` | Yes | Secure token for API authentication |
| `TWITTER_COOKIES` | Optional | Twitter session cookies in JSON format |
| `TWITTER_USER_ID` | Optional | Default Twitter user ID |
| `PORT` | No | Server port (auto-set by Render) |

## Deployment on Render

1. **Fork this repository**
2. **Connect to Render**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Create new Web Service
   - Connect your GitHub repository

3. **Configure Environment Variables**:
   ```
   TWITTER_SCRAPER_TOKEN=your_secure_random_token
   TWITTER_COOKIES=[{"name":"auth_token","value":"...","domain":".twitter.com","path":"/","secure":true,"httpOnly":true}]
   ```

4. **Deploy**: Render will automatically deploy using the `render.yaml` configuration

## n8n Integration

Use the HTTP Request node with:
- **URL**: `https://your-render-app.onrender.com/scrape`
- **Method**: POST
- **Body**: 
  ```json
  {
    "auth_token": "{{ $env.TWITTER_SCRAPER_TOKEN }}",
    "user_id": "{{ $env.TWITTER_USER_ID }}"
  }
  ```

## Getting Twitter Cookies

1. Open Twitter in your browser and log in
2. Open Developer Tools (F12)
3. Go to Application/Storage → Cookies → https://twitter.com
4. Find the `auth_token` cookie
5. Format as JSON array for the environment variable

## Local Development

```bash
# Clone repository
git clone https://github.com/Das-rebel/twitter-bookmark-scraper.git
cd twitter-bookmark-scraper

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# Start server
npm start
```

## Troubleshooting

### "Bad Gateway" Error
- Check that `TWITTER_SCRAPER_TOKEN` matches between n8n and Render
- Verify Twitter cookies are valid and properly formatted
- Check Render logs for detailed error messages

### Browser Installation Failed
If you see "Failed to install browsers" during deployment:
- This version now uses Puppeteer instead of Playwright to avoid browser installation issues
- Puppeteer comes with a pre-installed Chromium browser
- No additional browser installation is needed

### No Tweets Returned
- Ensure you have bookmarks on Twitter
- Check that cookies are from an authenticated session
- Verify the user has bookmarks within the last 48 hours

### Timeout Errors
- Twitter's anti-bot measures may be blocking requests
- Try refreshing your Twitter cookies
- Check if your IP is rate-limited

## License

MIT License - see LICENSE file for details.