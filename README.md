# Flux Image Generator

A simple Node/Express app that proxies image generation requests to NVIDIA's
`black-forest-labs/flux.1-kontext-dev` API, with a minimal web UI included.
Ready to deploy on [Render](https://render.com).

## Project structure

```
flux-app/
├── server.js          # Express server + NVIDIA API proxy
├── package.json
├── render.yaml         # Render deployment config
├── public/
│   └── index.html      # Simple test UI
├── .env.example        # Template for local env vars
└── .gitignore
```

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and add your NVIDIA API key:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```
   NVIDIA_API_KEY=your_actual_key_here
   ```

3. Run the server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API

### `POST /api/generate`

Request body:
```json
{
  "prompt": "a cat in a spacesuit",
  "steps": 30,
  "cfg_scale": 3.5,
  "seed": 0
}
```

Response: whatever JSON the NVIDIA API returns (passed through as-is).

### `GET /health`

Returns `{ "status": "ok" }` — useful for uptime checks.

## Deploying to Render

### Option A: via render.yaml (recommended)

1. Push this project to a GitHub repository.
2. In the Render dashboard: **New → Blueprint**, then connect your repo.
   Render will detect `render.yaml` automatically.
3. When prompted, set the `NVIDIA_API_KEY` environment variable value
   (it's marked `sync: false` so Render asks for it rather than storing it in the repo).
4. Click **Apply** — Render builds and deploys automatically.

### Option B: manual web service

1. Push this project to GitHub.
2. In Render: **New → Web Service** → connect your repo.
3. Settings:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
4. Under **Environment**, add:
   - `NVIDIA_API_KEY` = your key
5. Deploy. Render will give you a public URL like `https://your-app.onrender.com`.

## Notes

- **Never commit your `.env` file or API key.** `.gitignore` already excludes `.env`.
- Render's free tier spins the service down after ~15 minutes of inactivity;
  the next request will have a cold-start delay of 30-60 seconds.
- The response shape from the NVIDIA API may differ slightly depending on the
  model/version — check the raw response in `public/index.html`'s fallback
  `<pre>` output and adjust the image-rendering logic in the `<script>` block
  if needed (currently checks `data.image` and `data.artifacts[0].base64`).
- CORS is enabled for all origins by default (`cors()`), so a mobile app
  (Flutter, etc.) can call this API directly once deployed. Restrict this in
  `server.js` if you want to lock it down to a specific app/domain.
