"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { ModelConfig } from "@/lib/models"
import { Skeleton } from "@/components/ui/skeleton"
import { Copy, Check, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ModelResponsePanelProps {
  model: ModelConfig
  prompt: string | null
  promptId: number
}

type PanelStatus = "idle" | "streaming" | "done" | "error"

export function ModelResponsePanel({ model, prompt, promptId }: ModelResponsePanelProps) {
  const [copied, setCopied] = useState(false)
  const [responseText, setResponseText] = useState("")
  const [status, setStatus] = useState<PanelStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const streamResponse = useCallback(async (text: string) => {
    // Abort any previous request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setResponseText("")
    setStatus("streaming")
    setError(null)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", parts: [{ type: "text", text }] },
          ],
          model: model.id,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || `HTTP ${res.status}`)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let fullText = ""
      let streamFinished = false

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
            const parsed = JSON.parse(jsonStr)
            if (parsed.type === "text-delta" && parsed.textDelta) {
              fullText += parsed.textDelta
              setResponseText(fullText)
            } else if (parsed.type === "error") {
              throw new Error(parsed.error || "Stream error from server")
            } else if (parsed.type === "finish") {
              streamFinished = true
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message.startsWith("Stream error")) {
              throw parseErr
            }
            // skip unparseable chunks
          }
        }
      }

      if (streamFinished) {
        setStatus("done")
      } else if (fullText.length > 0) {
        // Stream ended without explicit finish event - could be premature termination
        // but we have partial content, so treat as successful completion
        setStatus("done")
      } else {
        // Stream ended with no content and no finish event - treat as error
        throw new Error("Stream ended unexpectedly")
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return
      setError(err instanceof Error ? err.message : "Failed to get response")
      setStatus("error")
    }
  }, [model.id])

  useEffect(() => {
    if (prompt && promptId > 0) {
      streamResponse(prompt)
    }
    return () => {
      abortRef.current?.abort()
    }
  }, [promptId, prompt, streamResponse])

  // Auto-scroll during streaming
  useEffect(() => {
    if (scrollRef.current && status === "streaming") {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [responseText, status])

  const isLoading = status === "streaming"

  const handleCopy = async () => {
    if (responseText) {
      await navigator.clipboard.writeText(responseText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRetry = () => {
    if (prompt) {
      streamResponse(prompt)
    }
  }

  return (
    <div className="flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: model.color }}
          />
          <div>
            <h3 className="text-sm font-semibold text-foreground">{model.name}</h3>
            <p className="text-xs text-muted-foreground">{model.provider}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isLoading && (
            <div className="flex items-center gap-1.5 mr-2">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: model.color }} />
              <span className="text-xs text-muted-foreground">Streaming</span>
            </div>
          )}
          {responseText && !isLoading && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleRetry}
                aria-label="Retry response"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
                aria-label="Copy response"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Response body */}
      <div className="flex-1 min-h-0 overflow-auto" ref={scrollRef}>
        <div className="p-4">
          {!prompt ? (
            <p className="text-sm text-muted-foreground italic">
              Waiting for your prompt...
            </p>
          ) : isLoading && !responseText ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-2/5" />
            </div>
          ) : responseText ? (
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
              {responseText}
              {isLoading && (
                <span
                  className="inline-block w-1.5 h-4 ml-0.5 animate-pulse rounded-sm align-text-bottom"
                  style={{ backgroundColor: model.color }}
                />
              )}
            </div>
          ) : status === "error" ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-sm text-destructive text-center max-w-xs">{error || "Failed to get response"}</p>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Retry
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
