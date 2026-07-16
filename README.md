# Flux Image Generator (v1.1)

Node/Express app that proxies image generation to NVIDIA's Flux APIs, with a
web UI. Ready to deploy on [Render](https://render.com).

## What changed in v1.1 (fixes "same image every time")

1. **Random seed by default** — if no seed is sent, the server generates a
   random one per request, so every generation is different. The seed used is
   returned as `seed_used` and shown in the UI so you can reproduce an image.
2. **Model selection** — supports three models:
   - `flux.1-dev` — text-to-image, best quality (**new default**)
   - `flux.1-schnell` — text-to-image, fast (4 steps)
   - `flux.1-kontext-dev` — image *editing* (the original model; it transforms
     an input image, which is why outputs looked similar even across seeds)
3. **Better response handling** — the UI now handles multiple NVIDIA response
   shapes (`image`, `artifacts[].base64`, `data[].b64_json`) and dumps raw JSON
   if the shape is unknown.

## Local setup

```bash
npm install
cp .env.example .env   # then put your real key in .env
npm start
# open http://localhost:3000
```

## API

### `POST /api/generate`

```json
{
  "prompt": "a cat in a spacesuit",
  "model": "flux.1-dev",
  "steps": 30,
  "cfg_scale": 3.5,
  "seed": 12345
}
```

All fields except `prompt` are optional. Omit `seed` for a random one.
Response includes `seed_used` and `model_used` plus the NVIDIA payload.

### `GET /api/models`
Lists supported models.

### `GET /health`
Returns `{"status":"ok"}`.

## Deploy to Render

1. Push to GitHub (e.g. `git@github-vaibhav:vaibhav734/flux-app.git`).
2. Render → **New → Blueprint** → connect repo (detects `render.yaml`).
3. Enter `NVIDIA_API_KEY` when prompted → **Apply**.

Or manually: **New → Web Service**, build `npm install`, start `npm start`,
add env var `NVIDIA_API_KEY`.

## Updating an existing deployment

```bash
git add .
git commit -m "v1.1: random seed default + model selection"
git push
```

Render auto-redeploys on push. Then **hard refresh the browser
(Cmd+Shift+R)** — cached frontend JS is a common reason changes don't appear.

## Notes

- Never commit `.env` (already gitignored).
- Render free tier sleeps after ~15 min idle; first request after that is slow.
- If NVIDIA's endpoint/payload shape for dev/schnell differs from kontext in
  your account's catalog version, check the raw error/response shown in the UI
  and adjust the payload block in `server.js` — it's clearly separated per model.
