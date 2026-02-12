"use client"

import { AVAILABLE_MODELS, type ModelConfig } from "@/lib/models"
import { Check } from "lucide-react"

interface ModelSelectorProps {
  selectedModels: string[]
  onToggle: (modelId: string) => void
}

export function ModelSelector({ selectedModels, onToggle }: ModelSelectorProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {AVAILABLE_MODELS.map((model: ModelConfig) => {
        const isSelected = selectedModels.includes(model.id)
        return (
          <button
            key={model.id}
            type="button"
            onClick={() => onToggle(model.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isSelected
                ? "border-border bg-secondary text-foreground"
                : "border-transparent bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
            aria-pressed={isSelected}
            aria-label={`Toggle ${model.name}`}
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: model.color,
                opacity: isSelected ? 1 : 0.4,
              }}
            />
            <span>{model.name}</span>
            {isSelected && <Check className="h-3 w-3 text-primary" />}
          </button>
        )
      })}
    </div>
  )
}
