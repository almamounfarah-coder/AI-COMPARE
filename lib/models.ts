export interface ModelConfig {
  id: string
  name: string
  provider: string
  description: string
  color: string
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    description: "Fast multimodal reasoning",
    color: "hsl(217, 90%, 60%)",
  },
  {
    id: "mistral/mistral-medium-latest",
    name: "Mistral Medium",
    provider: "Mistral",
    description: "Balanced performance",
    color: "hsl(25, 95%, 55%)",
  },
  {
    id: "google/gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    description: "Previous gen, fast",
    color: "hsl(30, 90%, 60%)",
  },
]

export const DEFAULT_MODELS = AVAILABLE_MODELS.map((m) => m.id)
