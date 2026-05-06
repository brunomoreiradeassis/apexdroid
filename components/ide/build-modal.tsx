"use client"

import { useEffect } from "react"
import { Package, X, Download, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"

interface BuildModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BuildModal({ isOpen, onClose }: BuildModalProps) {
  const { 
    buildStatus, setBuildStatus, 
    buildProgress, setBuildProgress,
    buildLogs, addBuildLog, clearBuildLogs,
    currentProject
  } = useIDEStore()

  const startBuild = () => {
    if (!currentProject) return
    
    setBuildStatus("active")
    clearBuildLogs()
    setBuildProgress(0)

    addBuildLog({
      timestamp: new Date(),
      message: `Iniciando build para ${currentProject.Properties.$Name}`,
      type: "info"
    })
    setBuildProgress(10)

    // Simulate build process
    setTimeout(() => {
      addBuildLog({
        timestamp: new Date(),
        message: "Validando arquivos .scm e .bky...",
        type: "log"
      })
      setBuildProgress(30)
    }, 2000)

    setTimeout(() => {
      addBuildLog({
        timestamp: new Date(),
        message: "Otimizando assets...",
        type: "log"
      })
      addBuildLog({
        timestamp: new Date(),
        message: "Gerando classes Java...",
        type: "log"
      })
      setBuildProgress(60)
    }, 5000)

    setTimeout(() => {
      addBuildLog({
        timestamp: new Date(),
        message: "Assinando APK com keystore de debug...",
        type: "log"
      })
      addBuildLog({
        timestamp: new Date(),
        message: "Alinhando APK...",
        type: "log"
      })
      setBuildProgress(90)
    }, 8000)

    setTimeout(() => {
      addBuildLog({
        timestamp: new Date(),
        message: "BUILD CONCLUÍDO COM SUCESSO!",
        type: "info"
      })
      setBuildProgress(100)
      setBuildStatus("completed")
    }, 10000)
  }

  const handleClose = () => {
    if (buildStatus === "active") {
      if (!confirm("O build ainda está em execução. Deseja fechar a janela?")) {
        return
      }
    }
    onClose()
  }

  useEffect(() => {
    if (!isOpen) {
      setBuildStatus("idle")
      setBuildProgress(0)
      clearBuildLogs()
    }
  }, [isOpen, setBuildStatus, setBuildProgress, clearBuildLogs])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Build APK</h2>
          </div>
          <X 
            className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground" 
            onClick={handleClose}
          />
        </div>

        {/* Body */}
        <div className="p-5">
          {buildStatus === "idle" && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Inicie o processo de compilação do seu aplicativo. Isso gerará um arquivo APK pronto para instalação.
              </p>
              <Button 
                className="w-full" 
                onClick={startBuild}
                disabled={!currentProject}
              >
                INICIAR COMPILAÇÃO
              </Button>
              {!currentProject && (
                <p className="text-xs text-destructive text-center mt-2">
                  Carregue um projeto primeiro.
                </p>
              )}
            </>
          )}

          {(buildStatus === "active" || buildStatus === "completed") && (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className={cn(
                  "text-xs font-bold uppercase",
                  buildStatus === "completed" ? "text-success" : "text-primary"
                )}>
                  {buildStatus === "completed" ? "CONCLUÍDO" : "COMPILANDO..."}
                </span>
                <span className="text-xs text-muted-foreground">
                  {buildProgress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_12px_var(--primary)]"
                  style={{ width: `${buildProgress}%` }}
                />
              </div>

              {/* Logs */}
              <div className="h-[150px] bg-background rounded-lg p-3 font-mono text-[11px] text-success overflow-y-auto border border-border">
                {buildLogs.map((log, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "mb-1 leading-snug",
                      log.type === "error" && "text-destructive",
                      log.type === "info" && "text-primary"
                    )}
                  >
                    [{log.timestamp.toLocaleTimeString()}] {log.message}
                  </div>
                ))}
              </div>

              {/* Actions */}
              {buildStatus === "completed" && (
                <div className="flex gap-2 mt-4">
                  <Button className="flex-1 gap-2">
                    <Download className="w-4 h-4" />
                    DOWNLOAD APK
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2">
                    <Share2 className="w-4 h-4" />
                    COMPARTILHAR
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
