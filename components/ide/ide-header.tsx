"use client"

import { Zap, GitBranch, Package, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIDEStore } from "@/lib/ide-store"

interface IDEHeaderProps {
  onBuildClick: () => void
  onSettingsClick: () => void
}

export function IDEHeader({ onBuildClick, onSettingsClick }: IDEHeaderProps) {
  const { ghToken, cloudUser } = useIDEStore()

  return (
    <header className="h-[52px] bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2.5 font-extrabold text-sm tracking-tight text-foreground select-none">
        <Zap className="w-5 h-5 text-primary" style={{ fill: "var(--primary)" }} />
        APEX DROID AI
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 mr-3 text-xs text-muted-foreground">
          <span 
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: ghToken ? "var(--success)" : "var(--muted-foreground)" }}
          />
          <span>{cloudUser ? "Sincronizado" : "Local"}</span>
        </div>

        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
          <GitBranch className="w-3.5 h-3.5" />
          Commit
        </Button>
        
        <Button size="sm" className="gap-1.5 text-xs h-8" onClick={onBuildClick}>
          <Package className="w-3.5 h-3.5" />
          Build APK
        </Button>
        
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={onSettingsClick}>
          <Settings className="w-3.5 h-3.5" />
          IA
        </Button>
      </div>
    </header>
  )
}
