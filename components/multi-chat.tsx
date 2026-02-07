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

export function MultiChat() {
  const [selectedModels, setSelectedModels] = useState<string[]>(DEFAULT_MODELS)
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null)
  const [promptId, setPromptId] = useState(0)
  const [isStreaming, setIsStreaming] = useState(false)

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
      setCurrentPrompt(message)
      setPromptId((prev) => prev + 1)
      setIsStreaming(true)
      // Auto-disable after reasonable time
      setTimeout(() => setIsStreaming(false), 30000)
    },
    []
  )

  const handleClear = useCallback(() => {
    setCurrentPrompt(null)
    setPromptId(0)
    setIsStreaming(false)
  }, [])

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
          </div>

          {/* Model response grid */}
          <div className={`flex-1 min-h-0 grid ${gridCols} gap-4 p-4 overflow-auto`}>
            {activeModels.map((model) => (
              <ModelResponsePanel
                key={`${model.id}-${promptId}`}
                model={model}
                prompt={currentPrompt}
                promptId={promptId}
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
