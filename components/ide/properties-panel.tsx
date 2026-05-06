"use client"

import { X, Zap, Box } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"

interface PropertiesPanelProps {
  onShowBlocks: () => void
}

export function PropertiesPanel({ onShowBlocks }: PropertiesPanelProps) {
  const { 
    showProperties, setShowProperties, 
    selectedComponent, updateComponent,
    blocks, currentProject
  } = useIDEStore()

  if (!showProperties) return null

  const componentBlocks = blocks.filter(
    b => b.component === selectedComponent?.$Name
  )

  const handlePropertyChange = (key: string, value: string) => {
    if (selectedComponent) {
      updateComponent(selectedComponent.$Name, { [key]: value })
    }
  }

  // Build outline tree
  const renderOutline = () => {
    if (!currentProject) return null

    const renderNode = (comp: { $Name: string; $Components?: any[] }, depth: number = 0) => (
      <div key={comp.$Name}>
        <div 
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer hover:bg-secondary",
            selectedComponent?.$Name === comp.$Name && "bg-primary/20 text-primary"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <Box className="w-3 h-3 opacity-50" />
          <span>{comp.$Name}</span>
        </div>
        {comp.$Components?.map((child: any) => renderNode(child, depth + 1))}
      </div>
    )

    return renderNode(currentProject.Properties)
  }

  return (
    <aside className="w-[280px] bg-card border-l border-border flex flex-col shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex justify-between items-center">
        <h3 className="text-sm font-bold">PROPRIEDADES</h3>
        <X 
          className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground" 
          onClick={() => setShowProperties(false)}
        />
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedComponent ? (
          <>
            <div className="text-primary font-bold text-xs mb-4">
              {selectedComponent.$Name}
            </div>

            <div className="space-y-3">
              {Object.entries(selectedComponent)
                .filter(([key]) => !key.startsWith("$"))
                .map(([key, value]) => (
                  <div key={key}>
                    <Label className="text-[10px] text-muted-foreground uppercase">
                      {key}
                    </Label>
                    <Input
                      value={String(value)}
                      onChange={(e) => handlePropertyChange(key, e.target.value)}
                      className="bg-input border-border text-xs h-8 font-mono mt-1"
                    />
                  </div>
                ))
              }
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-8">
            Selecione um componente para ver suas propriedades.
          </p>
        )}
      </div>

      {/* Events Section */}
      <div className="p-4 border-t border-border bg-black/5">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          EVENTOS DO COMPONENTE
          <Zap className="w-3 h-3 text-amber-500" />
        </div>

        {componentBlocks.length > 0 ? (
          <div className="space-y-2">
            {componentBlocks.map((block, i) => (
              <div 
                key={i}
                className="bg-secondary border-l-4 border-amber-500 p-2 rounded text-xs"
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  {block.eventName}
                </div>
                <div className="text-muted-foreground text-[10px] mt-0.5">
                  {block.summary}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Nenhum evento configurado.
          </p>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-3 text-[10px]"
          onClick={onShowBlocks}
        >
          VER TODOS OS BLOCOS
        </Button>
      </div>

      {/* Outline */}
      <div className="p-4 border-t border-border">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          ÁRVORE DE COMPONENTES
        </div>
        <div className="max-h-[150px] overflow-y-auto">
          {renderOutline()}
        </div>
      </div>
    </aside>
  )
}
