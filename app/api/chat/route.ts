export const maxDuration = 60

interface UIMessagePart {
  type: string
  text?: string
}

interface UIMessage {
  role: string
  parts?: UIMessagePart[]
}

function extractText(msg: UIMessage): string {
  if (!msg.parts) return ""
  return msg.parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text!)
    .join("")
}

async function streamGoogle(
  model: string,
  messages: UIMessage[],
  signal: AbortSignal
): Promise<Response> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GOOGLE_GENERATIVE_AI_API_KEY not set" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  const modelName = model.replace("google/", "")
  const googleMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: extractText(m) || " " }],
    }))

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: googleMessages,
        generationConfig: { temperature: 0.7 },
      }),
      signal,
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    console.error("[v0] Google API error:", res.status, errText)
    return new Response(errText, { status: res.status })
  }

  return transformSSE(res, (jsonStr) => {
    const parsed = JSON.parse(jsonStr)
    return parsed?.candidates?.[0]?.content?.parts?.[0]?.text || ""
  })
}

async function streamMistral(
  model: string,
  messages: UIMessage[],
  signal: AbortSignal
): Promise<Response> {
  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "MISTRAL_API_KEY not set" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  const modelName = model.replace("mistral/", "")
  const mistralMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: extractText(m) || " ",
    }))

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: mistralMessages,
      stream: true,
      temperature: 0.7,
    }),
    signal,
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error("[v0] Mistral API error:", res.status, errText)
    return new Response(errText, { status: res.status })
  }

  return transformSSE(res, (jsonStr) => {
    const parsed = JSON.parse(jsonStr)
    return parsed?.choices?.[0]?.delta?.content || ""
  })
}

function transformSSE(
  upstream: Response,
  extractTextFromChunk: (jsonStr: string) => string
): Response {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const readable = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader()
      let buffer = ""
      const messageId = crypto.randomUUID()

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "start", messageId })}\n\n`
        )
      )

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith("data:")) continue
            const jsonStr = trimmed.slice(5).trim()
            if (!jsonStr || jsonStr === "[DONE]") continue

            try {
              const text = extractTextFromChunk(jsonStr)
              if (text) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text-delta", textDelta: text })}\n\n`
                  )
                )
              }
            } catch {
              // skip unparseable chunks
            }
          }
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "finish", finishReason: "stop" })}\n\n`
          )
        )
      } catch (err) {
        console.error("[v0] Stream error:", err)
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: errorMessage })}\n\n`
          )
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

export async function POST(req: Request) {
  const { messages, model }: { messages: UIMessage[]; model: string } =
    await req.json()

  if (model.startsWith("mistral/")) {
    return streamMistral(model, messages, req.signal)
  }
  return streamGoogle(model, messages, req.signal)
}
