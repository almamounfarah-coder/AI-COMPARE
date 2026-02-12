import { Zap } from "lucide-react"

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground tracking-tight">MultiChat AI</h1>
          <p className="text-xs text-muted-foreground">Compare models side by side</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground hidden sm:block">
          Powered by Vercel AI SDK
        </span>
      </div>
    </header>
  )
}
