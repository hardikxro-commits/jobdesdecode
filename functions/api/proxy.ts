/*
 * Copyright (c) 2026 Hardik Nishad (@hardikxro-commits)
 *
 * Server-side proxy for AI API calls.
 * API keys are read from Cloudflare secrets (env), never exposed to the client.
 *
 * Set secrets with: npx wrangler pages secret put NVIDIA_API_KEY
 */

export async function onRequest(context) {
  const { request, env } = context

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const apiKey = env.NVIDIA_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured on server" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
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
    })

    const contentType = response.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      const data = await response.json()
      return new Response(JSON.stringify(data), {
        status: response.ok ? 200 : response.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    const text = await response.text()
    return new Response(JSON.stringify({
      error: text || `API returned non-JSON response (status ${response.status})`,
    }), {
      status: response.ok ? 200 : response.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Proxy failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
