/*
 * Copyright (c) 2026 Hardik Nishad (@hardikxro-commits)
 *
 * Local dev proxy for AI API calls.
 * Set NVIDIA_API_KEY in your .env file or environment variables.
 */

import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post("/api/proxy", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "NVIDIA_API_KEY not configured. Set it in .env or environment variables." });
    }

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
        top_p: 1,
        temperature: 1,
      }),
    });

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json();
      res.status(response.ok ? 200 : response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.ok ? 200 : response.status).json({
        error: text || `API returned non-JSON response (status ${response.status})`,
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Proxy failed" });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
});
