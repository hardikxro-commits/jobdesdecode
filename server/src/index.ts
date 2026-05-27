import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const ALLOWED_PROXY_HOSTS = [
  "api.anthropic.com",
  "api.openai.com",
  "generativelanguage.googleapis.com",
  "api.deepseek.com",
  "integrate.api.nvidia.com",
]

app.post("/api/proxy", async (req, res) => {
  try {
    const { url, headers, body } = req.body;

    if (!ALLOWED_PROXY_HOSTS.some(h => url.includes(h))) {
      return res.status(403).json({ error: "Proxy target not allowed" })
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
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
