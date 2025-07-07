# 🐦 Twitter Bookmark Scraper

A headless scraper built with Playwright and Express.js to extract recent Twitter bookmarks.

## 🚀 Deploy on Render

### 1. Prerequisites
- Node.js 18+
- Twitter account with valid cookies
- Render.com account

### 2. Files Overview
- `index.js`: Main server with /scrape and /health routes
- `.env`: Stores `TWITTER_COOKIES` as JSON string
- `render.yaml`: Preconfigured for Render deployment
- `package.json`: Declares dependencies and postinstall script

### 3. Setup

#### Local
```bash
npm install
npx playwright install --with-deps
cp .env.example .env  # or set your actual cookie string
npm start
```

#### Render
- Upload repo to GitHub
- Connect repo to Render
- Confirm the following:
  - **Build Command**: `npm install && npx playwright install --with-deps`
  - **Start Command**: `npm start`
  - **Env Var**: `TWITTER_COOKIES` with your cookie string

### 4. Endpoints

- `GET /health` – check if server is live
- `POST /scrape` – returns recent tweets (last 48h) from bookmarks

### 5. Dependencies
- [express](https://www.npmjs.com/package/express) – Web server
- [playwright](https://www.npmjs.com/package/playwright) – Headless browser automation
- [dotenv](https://www.npmjs.com/package/dotenv) – Load environment variables

### 🛡️ Notes
- Make sure `TWITTER_COOKIES` is a valid JSON string representing your session cookies.
- This tool uses headless Chromium; Render must install browser binaries.

### 🧠 Tip
For long scraping sessions or batch exports, consider hosting with logs enabled and rate-limit detection.
