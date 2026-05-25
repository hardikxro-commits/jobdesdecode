export async function onRequest(context) {
  const { request } = context

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const { url, headers, body } = await request.json()

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
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
