import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" })); // generous limit in case base64 images are sent

const PORT = process.env.PORT || 3000;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

if (!NVIDIA_API_KEY) {
  console.warn("WARNING: NVIDIA_API_KEY environment variable is not set.");
}

const INVOKE_URL =
  "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-kontext-dev";

app.post("/api/generate", async (req, res) => {
  try {
    if (!NVIDIA_API_KEY) {
      return res.status(500).json({ error: "Server misconfigured: NVIDIA_API_KEY not set" });
    }

    const { prompt, image, aspect_ratio, steps, cfg_scale, seed } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }

    const payload = {
      prompt,
      image: image || "data:image/png;example_id,0",
      aspect_ratio: aspect_ratio || "match_input_image",
      steps: steps ?? 30,
      cfg_scale: cfg_scale ?? 3.5,
      seed: seed ?? 0,
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
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use(express.static("public"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
