# MatchZone Live

A standalone sports scores & streaming website powered by the Prince API.

## Setup

**1. Set your API URL**

Open `index.html` and find this line near the top of the `<script>` block:

```js
const API_BASE = 'https://your-prince-api.com';
```

Replace the URL with the deployed URL of your Prince API (e.g. `https://prince-api.com`).

**2. Install & run locally**

```bash
npm install
npm start
```

The site will be available at `http://localhost:3000`.

## Deploy

This is a pure static site (one HTML file). You can deploy it on:

- **Vercel** — drag the `matchzone-site/` folder into vercel.com
- **Netlify** — drag the folder into app.netlify.com
- **GitHub Pages** — push to a repo and enable Pages
- **Replit** — create a new Static Repl and upload the folder
- **Any static host** — just serve `index.html`

## API Endpoints Used

All endpoints are served from your Prince API under `/matchzone/data/`:

| Endpoint | Data |
|---|---|
| `GET /matchzone/data/football-live` | Live football scores |
| `GET /matchzone/data/basketball` | Live basketball scores |
| `GET /matchzone/data/streaming?sport=all` | Streamable matches with watch links |
| `GET /matchzone/data/news?tag=football` | Sports news |

> **CORS** is enabled on all `/matchzone/data/*` routes so cross-origin requests work from any domain.
