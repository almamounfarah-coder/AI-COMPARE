'use client';

import { MessageSquare, Zap, BarChart3 } from "lucide-react"

const SUGGESTIONS = [
  "Explain quantum computing in simple terms",
  "Write a Python function to reverse a linked list",
  "What are the pros and cons of microservices?",
  "Summarize the history of artificial intelligence",
]

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void
}

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
        <Zap className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2 text-balance text-center">
        Compare AI Models Instantly
      </h2>
      <p className="text-muted-foreground text-sm mb-10 max-w-md text-center text-pretty">
        Send one prompt and see how different AI models respond. Compare quality, speed, and style side by side.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mb-10">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestionClick(suggestion)}
            className="text-left px-4 py-3 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-secondary/80 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-8 text-muted-foreground">
        <div className="flex items-center gap-2 text-xs">
          <MessageSquare className="h-4 w-4" />
          <span>Multi-model</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Zap className="h-4 w-4" />
          <span>Real-time streaming</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <BarChart3 className="h-4 w-4" />
          <span>Side by side</span>
        </div>
      </div>
    </div>
  )
}
