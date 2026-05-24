import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post("/api/proxy", async (req, res) => {
  try {
    const { url, headers, body } = req.body;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    res.status(response.ok ? 200 : response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Proxy failed" });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
});
