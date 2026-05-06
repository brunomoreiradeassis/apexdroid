"use client"

import { Edit3, Play, Zap, PlusCircle, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIDEStore } from "@/lib/ide-store"
import type { KodularComponent } from "@/lib/ide-types"
import { cn } from "@/lib/utils"

// Kodular color converter
function convertColor(k?: string): string {
  if (!k || k === "None" || k === "0") return "transparent"
  if (k.startsWith("&H")) {
    const hex = k.substring(2)
    if (hex.length === 8) {
      const a = parseInt(hex.substring(0, 2), 16) / 255
      const r = parseInt(hex.substring(2, 4), 16)
      const g = parseInt(hex.substring(4, 6), 16)
      const b = parseInt(hex.substring(6, 8), 16)
      return `rgba(${r},${g},${b},${a})`
    }
    return `#${hex}`
  }
  return k
}

function convertSize(v?: string | number): string {
  if (v === "-1" || v === -1) return "auto"
  if (v === "-2" || v === -2) return "100%"
  if (typeof v === "number" && v > 0) return `${v}px`
  if (typeof v === "string" && parseInt(v) > 0) return `${v}px`
  return "auto"
}

function convertAlignment(v?: string): string {
  if (v === "2") return "center"
  if (v === "3") return "flex-end"
  return "flex-start"
}

interface ComponentRendererProps {
  component: KodularComponent
  onSelect: (comp: KodularComponent) => void
  selectedName?: string
  appMode: "edit" | "run"
}

function ComponentRenderer({ component, onSelect, selectedName, appMode }: ComponentRendererProps) {
  const { $Type, $Name, $Components } = component

  // Non-visible components
  if (["Clock", "Sound", "Notifier", "TinyDB", "Web", "Firebase", "Cloudinary"].includes($Type)) {
    return null
  }

  const isSelected = selectedName === $Name

  const baseStyle: React.CSSProperties = {
    width: convertSize(component.Width),
    height: convertSize(component.Height),
    backgroundColor: convertColor(component.BackgroundColor || "&H00FFFFFF")
  }

  const handleClick = (e: React.MouseEvent) => {
    if (appMode === "edit") {
      e.stopPropagation()
      onSelect(component)
    }
  }

  if ($Type === "Button") {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "px-3 py-2 text-center rounded text-sm cursor-pointer transition-all",
          isSelected && "ring-2 ring-primary ring-offset-1"
        )}
        style={{
          ...baseStyle,
          backgroundColor: convertColor(component.BackgroundColor) || "#3b82f6",
          color: convertColor(component.TextColor) || "white"
        }}
      >
        {component.Text || "Button"}
      </div>
    )
  }

  if ($Type === "Label") {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "cursor-pointer transition-all px-1",
          isSelected && "ring-2 ring-primary ring-offset-1 rounded"
        )}
        style={{
          ...baseStyle,
          color: convertColor(component.TextColor || "&HFF000000"),
          fontSize: component.FontSize ? `${component.FontSize}px` : undefined,
          fontWeight: component.FontBold === "True" ? "bold" : undefined,
          textAlign: component.TextAlignment === "1" ? "center" : component.TextAlignment === "2" ? "right" : "left"
        }}
      >
        {component.Text || "Label"}
      </div>
    )
  }

  if ($Type === "TextBox") {
    return (
      <input
        type="text"
        placeholder={component.Hint as string || "Digite aqui..."}
        onClick={handleClick}
        readOnly={appMode === "edit"}
        className={cn(
          "px-3 py-2 rounded border text-sm w-full cursor-pointer",
          isSelected && "ring-2 ring-primary ring-offset-1"
        )}
        style={{
          ...baseStyle,
          borderColor: "#ccc",
          color: convertColor(component.TextColor || "&HFF000000")
        }}
      />
    )
  }

  if ($Type === "Image") {
    const imageSrc = component.Picture as string
    return (
      <div
        onClick={handleClick}
        className={cn(
          "cursor-pointer transition-all flex items-center justify-center",
          isSelected && "ring-2 ring-primary ring-offset-1 rounded"
        )}
        style={baseStyle}
      >
        {imageSrc ? (
          <img 
            src={imageSrc} 
            alt={$Name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
            Imagem
          </div>
        )}
      </div>
    )
  }

  if ($Type.includes("Arrangement")) {
    const isVertical = $Type.includes("Vertical")
    return (
      <div
        onClick={handleClick}
        className={cn(
          "flex gap-2 p-2 cursor-pointer transition-all min-h-[40px]",
          isSelected && "ring-2 ring-primary ring-offset-1 rounded"
        )}
        style={{
          ...baseStyle,
          flexDirection: isVertical ? "column" : "row",
          alignItems: convertAlignment(component.AlignHorizontal),
          justifyContent: convertAlignment(component.AlignVertical)
        }}
      >
        {$Components?.map((child) => (
          <ComponentRenderer
            key={child.$Name}
            component={child}
            onSelect={onSelect}
            selectedName={selectedName}
            appMode={appMode}
          />
        ))}
        {(!$Components || $Components.length === 0) && appMode === "edit" && (
          <div className="flex-1 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400 min-h-[30px]">
            Arraste componentes aqui
          </div>
        )}
      </div>
    )
  }

  if ($Type === "ListView") {
    const elements = (component.Elements as string)?.split(",") || []
    return (
      <div
        onClick={handleClick}
        className={cn(
          "cursor-pointer transition-all border rounded overflow-hidden",
          isSelected && "ring-2 ring-primary ring-offset-1"
        )}
        style={baseStyle}
      >
        {elements.length > 0 ? (
          elements.slice(0, 5).map((item, i) => (
            <div key={i} className="px-3 py-2 border-b last:border-b-0 text-sm">
              {item.trim()}
            </div>
          ))
        ) : (
          <div className="p-3 text-gray-400 text-sm text-center">ListView vazia</div>
        )}
      </div>
    )
  }

  // Default rendering for other components
  return (
    <div
      onClick={handleClick}
      className={cn(
        "cursor-pointer transition-all p-2 rounded bg-gray-100",
        isSelected && "ring-2 ring-primary ring-offset-1"
      )}
      style={baseStyle}
    >
      <span className="text-xs text-gray-500">[{$Type}] {$Name}</span>
      {component.Text && <div className="text-sm mt-1">{component.Text}</div>}
    </div>
  )
}

interface PhonePreviewProps {
  onLoginClick: () => void
}

export function PhonePreview({ onLoginClick }: PhonePreviewProps) {
  const { 
    currentProject, appMode, setAppMode,
    selectedComponent, setSelectedComponent, setShowProperties,
    selectedRepo, currentScreenName, setActiveTab, screenFiles
  } = useIDEStore()

  const handleComponentSelect = (comp: KodularComponent) => {
    setSelectedComponent(comp)
    setShowProperties(true)
  }

  // Show welcome screen when no repo selected
  if (!selectedRepo) {
    return (
      <main className="flex-1 bg-background flex flex-col items-center justify-center overflow-hidden relative">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
              backgroundSize: "32px 32px"
            }}
          />
        </div>
        
        <div className="text-center px-10 relative z-10">
          <Zap className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">APEX DROID AI</h1>
          <p className="text-muted-foreground mb-10">
            O futuro do desenvolvimento Kodular, potencializado por IA.
          </p>

          <div className="flex gap-5 justify-center">
            <div 
              onClick={() => {
                onLoginClick()
              }}
              className="bg-secondary border border-border p-6 rounded-2xl max-w-[200px] cursor-pointer hover:-translate-y-1 hover:border-primary transition-all"
            >
              <Github className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Conectar GitHub</h3>
              <p className="text-xs text-muted-foreground">
                Importe seus projetos existentes e comece a editar.
              </p>
            </div>

            <div className="bg-secondary border border-border p-6 rounded-2xl max-w-[200px] cursor-pointer hover:-translate-y-1 hover:border-primary transition-all">
              <PlusCircle className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Novo Projeto</h3>
              <p className="text-xs text-muted-foreground">
                Inicie do zero com um template limpo e moderno.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-10">
            DICA: Pressione{" "}
            <kbd className="bg-secondary px-1.5 py-0.5 rounded font-mono text-[10px]">Ctrl</kbd>
            {" + "}
            <kbd className="bg-secondary px-1.5 py-0.5 rounded font-mono text-[10px]">K</kbd>
            {" "}para abrir a Paleta de Comandos.
          </p>
        </div>
      </main>
    )
  }

  // Repo selected but no screen loaded yet - show message to select a screen
  if (!currentProject) {
    return (
      <main className="flex-1 bg-background flex flex-col items-center justify-center overflow-hidden relative">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
              backgroundSize: "32px 32px"
            }}
          />
        </div>
        
        <div className="text-center relative z-10">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Projeto carregado</h2>
          <p className="text-muted-foreground text-sm mb-4 max-w-xs">
            Selecione uma tela na aba TELAS para visualizar e editar no preview.
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveTab("telas")}
          >
            Ver telas do projeto
          </Button>
        </div>
      </main>
    )
  }

  const props = currentProject.Properties

  return (
    <main className="flex-1 bg-background flex flex-col items-center justify-center relative overflow-hidden min-w-[400px]">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "32px 32px"
          }}
        />
      </div>

      {/* Mode Toggle */}
      <div className="absolute top-5 left-5 bg-card rounded-xl p-1 border border-border z-10 flex gap-1">
        <Button
          variant={appMode === "edit" ? "default" : "ghost"}
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setAppMode("edit")}
        >
          <Edit3 className="w-3.5 h-3.5" />
          Design
        </Button>
        <Button
          variant={appMode === "run" ? "default" : "ghost"}
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setAppMode("run")}
        >
          <Play className="w-3.5 h-3.5" />
          Live
        </Button>
      </div>

      {/* Current Screen Name */}
      {currentScreenName && (
        <div className="absolute top-5 right-5 bg-card rounded-lg px-3 py-1.5 border border-border z-10">
          <span className="text-xs text-muted-foreground">Tela: </span>
          <span className="text-xs font-medium">{currentScreenName}</span>
        </div>
      )}

      {/* Phone Mockup */}
      <div 
        className="w-[340px] h-[680px] bg-white rounded-[36px] shadow-2xl border-[10px] border-secondary overflow-hidden flex flex-col relative z-10"
        style={{ transform: "scale(0.9)" }}
      >
        {/* Status Bar / Title */}
        {props.TitleVisible !== "False" && (
          <div 
            className="px-4 py-3.5 text-sm font-semibold"
            style={{
              backgroundColor: convertColor(props.TitleBarColor || "&HFF6200EE"),
              color: "white"
            }}
          >
            {props.Title || props.$Name}
          </div>
        )}

        {/* Screen Content */}
        <div 
          className="flex-1 overflow-auto flex flex-col p-2"
          style={{
            backgroundColor: convertColor(props.BackgroundColor || "&HFFFFFFFF"),
            alignItems: convertAlignment(props.AlignHorizontal),
            justifyContent: convertAlignment(props.AlignVertical)
          }}
        >
          {props.$Components?.map((comp) => (
            <ComponentRenderer
              key={comp.$Name}
              component={comp}
              onSelect={handleComponentSelect}
              selectedName={selectedComponent?.$Name}
              appMode={appMode}
            />
          ))}
          
          {(!props.$Components || props.$Components.length === 0) && appMode === "edit" && (
            <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm m-2">
              Arraste componentes da paleta para ca
            </div>
          )}
        </div>

        {/* Non-Visible Bar */}
        {props.$Components?.some(c => 
          ["Clock", "Sound", "Notifier", "TinyDB", "Web", "Firebase", "Cloudinary"].includes(c.$Type)
        ) && (
          <div className="bg-gray-100 border-t border-gray-200 px-3 py-2 flex gap-2 overflow-x-auto">
            <span className="text-[10px] text-gray-400 opacity-50 shrink-0">NAO VISIVEIS</span>
            {props.$Components
              .filter(c => ["Clock", "Sound", "Notifier", "TinyDB", "Web", "Firebase", "Cloudinary"].includes(c.$Type))
              .map(c => (
                <div 
                  key={c.$Name}
                  className={cn(
                    "bg-white border px-2.5 py-1 rounded text-[10px] font-semibold cursor-pointer hover:border-primary shrink-0",
                    selectedComponent?.$Name === c.$Name ? "border-primary bg-primary/10" : "border-gray-300"
                  )}
                  onClick={() => handleComponentSelect(c)}
                >
                  {c.$Name}
                </div>
              ))
            }
          </div>
        )}
      </div>
    </main>
  )
}
