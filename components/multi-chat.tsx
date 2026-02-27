"use client"

import { useState, useCallback } from "react"
import { AVAILABLE_MODELS, DEFAULT_MODELS } from "@/lib/models"
import { ModelResponsePanel } from "@/components/model-response-panel"
import { ChatInput } from "@/components/chat-input"
import { ModelSelector } from "@/components/model-selector"
import { Header } from "@/components/header"
import { WelcomeScreen } from "@/components/welcome-screen"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PromptHistoryItem {
  id: number
  text: string
  createdAt: number
}

export function MultiChat() {
  const [selectedModels, setSelectedModels] = useState<string[]>(DEFAULT_MODELS)
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null)
  const [promptId, setPromptId] = useState(0)
  const [isStreaming, setIsStreaming] = useState(false)
  const [history, setHistory] = useState<PromptHistoryItem[]>([])
  const [bestModelByPrompt, setBestModelByPrompt] = useState<Record<number, string>>({})

  const handleToggleModel = useCallback((modelId: string) => {
    setSelectedModels((prev) => {
      if (prev.includes(modelId)) {
        if (prev.length <= 1) return prev
        return prev.filter((id) => id !== modelId)
      }
      return [...prev, modelId]
    })
  }, [])

  const handleSend = useCallback(
    (message: string) => {
      const nextPromptId = promptId + 1
      setCurrentPrompt(message)
      setPromptId(nextPromptId)
      setHistory((prev) => [
        { id: nextPromptId, text: message, createdAt: Date.now() },
        ...prev,
      ].slice(0, 10))
      setIsStreaming(true)
      // Auto-disable after reasonable time
      setTimeout(() => setIsStreaming(false), 30000)
    },
    [promptId]
  )

  const handleClear = useCallback(() => {
    setCurrentPrompt(null)
    setPromptId(0)
    setIsStreaming(false)
  }, [])

  const handleReusePrompt = useCallback((item: PromptHistoryItem) => {
    setCurrentPrompt(item.text)
    setPromptId(item.id)
    setIsStreaming(true)
    setTimeout(() => setIsStreaming(false), 30000)
  }, [])

  const handleMarkBest = useCallback((modelId: string) => {
    if (!promptId) return
    setBestModelByPrompt((prev) => ({ ...prev, [promptId]: modelId }))
  }, [promptId])

  const activeModels = AVAILABLE_MODELS.filter((m) =>
    selectedModels.includes(m.id)
  )

  const gridCols =
    activeModels.length === 1
      ? "grid-cols-1"
      : activeModels.length === 2
        ? "grid-cols-1 md:grid-cols-2"
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

  return (
    <div className="flex flex-col h-screen">
      <Header />

      {/* Model selector bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <ModelSelector
          selectedModels={selectedModels}
          onToggle={handleToggleModel}
        />
        {currentPrompt && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Main content area */}
      {!currentPrompt ? (
        <WelcomeScreen onSuggestionClick={handleSend} />
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* User prompt display */}
          <div className="px-6 py-4 border-b border-border">
            <div className="max-w-3xl mx-auto">
              <p className="text-xs text-muted-foreground mb-1">Your prompt</p>
              <p className="text-sm text-foreground">{currentPrompt}</p>
            </div>
            {history.length > 0 && (
              <div className="max-w-3xl mx-auto mt-3">
                <p className="text-xs text-muted-foreground mb-2">Recent prompts</p>
                <div className="flex flex-wrap gap-2">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleReusePrompt(item)}
                      className="px-2.5 py-1 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors max-w-[240px] truncate"
                      title={item.text}
                    >
                      {item.text}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Model response grid */}
          <div className={`flex-1 min-h-0 grid ${gridCols} gap-4 p-4 overflow-auto`}>
            {activeModels.map((model) => (
              <ModelResponsePanel
                key={`${model.id}-${promptId}`}
                model={model}
                prompt={currentPrompt}
                promptId={promptId}
                isBest={bestModelByPrompt[promptId] === model.id}
                onMarkBest={handleMarkBest}
              />
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="px-6 py-4 border-t border-border">
        <ChatInput onSend={handleSend} disabled={false} />
      </div>
    </div>
  )
}
