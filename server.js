import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

const PORT = process.env.PORT || 3000;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

if (!NVIDIA_API_KEY) {
  console.warn("WARNING: NVIDIA_API_KEY environment variable is not set.");
}

// flux.1-dev — pure text-to-image model
const INVOKE_URL =
  "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev";

const randomSeed = () => Math.floor(Math.random() * 4294967295);

app.post("/api/generate", async (req, res) => {
  try {
    if (!NVIDIA_API_KEY) {
      return res
        .status(500)
        .json({ error: "Server misconfigured: NVIDIA_API_KEY not set" });
    }

    const { prompt, aspect_ratio, steps, cfg_scale, seed } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }

    // Use caller's seed if provided; otherwise randomize per request
    // so every generation produces a different image.
    const finalSeed =
      seed !== undefined && seed !== null && seed !== ""
        ? Number(seed)
        : randomSeed();

    // Map aspect ratio to width/height (flux.1-dev rejects aspect_ratio)
    const SIZES = {
      "1:1":  { width: 1024, height: 1024 },
      "16:9": { width: 1344, height: 768 },
      "9:16": { width: 768,  height: 1344 },
      "4:3":  { width: 1152, height: 896 },
      "3:4":  { width: 896,  height: 1152 },
    };
    const size = SIZES[aspect_ratio] || SIZES["1:1"];

    const payload = {
      prompt,
      mode: "base",
      width: size.width,
      height: size.height,
      steps: steps ?? 50,
      cfg_scale: cfg_scale ?? 3.5,
      seed: finalSeed,
    };

    const response = await fetch(INVOKE_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        Accept: "application/json",
      },
    });

    if (response.status !== 200) {
      const errBody = await response.text();
      return res
        .status(response.status)
        .json({ error: "NVIDIA API request failed", details: errBody });
    }

    const data = await response.json();
    // Return the seed used so the client can display/reuse it.
    res.json({ seed_used: finalSeed, ...data });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use(express.static("public"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
