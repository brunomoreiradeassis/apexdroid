"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Layout, Square, Type, ImageIcon, Plus, Upload, 
  Cloud, CheckCircle, LogOut, FolderGit2, GitBranch,
  Loader2, AlertCircle, RefreshCw, ArrowLeft, Monitor,
  FileImage, FileAudio, FileVideo, File
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIDEStore } from "@/lib/ide-store"
import { fetchUserRepos, fetchRepoTree, fetchFileContent } from "@/lib/github-service"
import { cn } from "@/lib/utils"
import type { GitHubRepo, ProjectAsset, ScreenFile } from "@/lib/ide-types"

const tabs = [
  { id: "componentes", label: "PALETA" },
  { id: "telas", label: "TELAS" },
  { id: "github", label: "PROJETOS" },
  { id: "assets", label: "ASSETS" },
  { id: "cloud", label: "CLOUD" }
]

const paletteComponents = [
  { name: "VerticalArrangement", icon: Layout },
  { name: "HorizontalArrangement", icon: Layout },
  { name: "Button", icon: Square },
  { name: "Label", icon: Type },
  { name: "Image", icon: ImageIcon }
]

interface SidebarProps {
  onLoginClick: () => void
}

function getAssetType(filename: string): "image" | "audio" | "video" | "other" {
  const ext = filename.split(".").pop()?.toLowerCase() || ""
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext)) return "image"
  if (["mp3", "wav", "ogg", "m4a", "aac"].includes(ext)) return "audio"
  if (["mp4", "webm", "mov", "avi"].includes(ext)) return "video"
  return "other"
}

function getAssetIcon(type: "image" | "audio" | "video" | "other") {
  switch (type) {
    case "image": return FileImage
    case "audio": return FileAudio
    case "video": return FileVideo
    default: return File
  }
}

export function Sidebar({ onLoginClick }: SidebarProps) {
  const { 
    activeTab, setActiveTab, cloudUser, setCloudUser,
    currentProject, addComponent, ghToken,
    ghRepos, setGhRepos, ghReposLoading, setGhReposLoading,
    ghReposError, setGhReposError, selectedRepo, setSelectedRepo,
    repoTree, setRepoTree, repoTreeLoading, setRepoTreeLoading,
    setCurrentProject, setCurrentFile, saveSnapshot, setShowWelcome,
    screenFiles, setScreenFiles, currentScreenName, setCurrentScreenName,
    projectAssets, setProjectAssets, setCurrentBkyContent
  } = useIDEStore()
  
  const [draggedComp, setDraggedComp] = useState<string | null>(null)
  const [loadingScreen, setLoadingScreen] = useState<string | null>(null)

  const loadRepos = useCallback(async () => {
    if (!ghToken) return
    
    setGhReposLoading(true)
    setGhReposError(null)
    
    try {
      const repos = await fetchUserRepos(ghToken)
      setGhRepos(repos)
    } catch (error) {
      setGhReposError(error instanceof Error ? error.message : "Erro ao carregar repositorios")
    } finally {
      setGhReposLoading(false)
    }
  }, [ghToken, setGhRepos, setGhReposLoading, setGhReposError])

  const processRepoFiles = useCallback(async (repo: GitHubRepo) => {
    if (!ghToken) return
    
    setRepoTreeLoading(true)
    setSelectedRepo(repo)
    
    try {
      const [owner] = repo.full_name.split("/")
      const tree = await fetchRepoTree(ghToken, owner, repo.name, repo.default_branch)
      setRepoTree(tree)
      
      // Find all .scm files (screens) and their corresponding .bky files
      const scmFiles = tree.filter(item => item.path.endsWith(".scm"))
      const bkyFiles = tree.filter(item => item.path.endsWith(".bky"))
      
      const screens: ScreenFile[] = scmFiles.map(scm => {
        const screenName = scm.path.replace(".scm", "")
        const bky = bkyFiles.find(b => b.path.replace(".bky", "") === screenName)
        return {
          name: scm.path.split("/").pop()?.replace(".scm", "") || screenName,
          scmPath: scm.path,
          bkyPath: bky?.path || null
        }
      })
      
      setScreenFiles(screens)
      
      // Find assets (usually in assets/ folder or src/assets/)
      const assetFiles = tree.filter(item => {
        const isAssetFolder = item.path.includes("assets/") || item.path.includes("Assets/")
        const isFile = item.type === "blob"
        const ext = item.path.split(".").pop()?.toLowerCase() || ""
        const isMediaFile = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "mp3", "wav", "ogg", "mp4", "webm"].includes(ext)
        return isAssetFolder && isFile && isMediaFile
      })
      
      const assets: ProjectAsset[] = assetFiles.map(file => ({
        name: file.path.split("/").pop() || file.path,
        path: file.path,
        url: `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/${file.path}`,
        type: getAssetType(file.path)
      }))
      
      setProjectAssets(assets)
      
      // Switch to screens tab to show available screens
      setActiveTab("telas")
      setCurrentProject(null)
      setCurrentScreenName(null)
    } catch (error) {
      console.error("Erro ao processar repositorio:", error)
      setRepoTree([])
      setScreenFiles([])
      setProjectAssets([])
    } finally {
      setRepoTreeLoading(false)
    }
  }, [ghToken, setSelectedRepo, setRepoTree, setRepoTreeLoading, setScreenFiles, setProjectAssets, setActiveTab, setCurrentProject, setCurrentScreenName])

  const loadScreen = async (screen: ScreenFile, repo?: GitHubRepo, ownerOverride?: string) => {
    const currentRepo = repo || selectedRepo
    console.log("[v0] loadScreen called:", { screen: screen.name, repo: currentRepo?.name, ghToken: !!ghToken })
    
    if (!ghToken || !currentRepo) {
      console.log("[v0] loadScreen aborted - missing token or repo")
      return
    }
    
    setLoadingScreen(screen.name)
    const [owner] = ownerOverride ? [ownerOverride] : currentRepo.full_name.split("/")
    
    try {
      // Load .scm file (screen components)
      const { content: scmContent, sha } = await fetchFileContent(ghToken, owner, currentRepo.name, screen.scmPath)
      
      // Parse the SCM content - Kodular/App Inventor format
      // The content might have a prefix like "#|\n$JSON\n" that needs to be stripped
      let jsonContent = scmContent
      if (scmContent.includes("$JSON")) {
        const jsonStart = scmContent.indexOf("{")
        if (jsonStart !== -1) {
          jsonContent = scmContent.substring(jsonStart)
        }
      }
      
      try {
        const projectData = JSON.parse(jsonContent)
        console.log("[v0] Parsed project data:", projectData?.Properties?.$Name)
        setCurrentProject(projectData)
        setCurrentScreenName(screen.name)
        setCurrentFile({
          repo: currentRepo.full_name,
          path: screen.scmPath,
          sha,
          branch: currentRepo.default_branch,
          originalContent: scmContent,
          content: scmContent
        })
        
        // Load .bky file if exists (blocks)
        if (screen.bkyPath) {
          try {
            const { content: bkyContent } = await fetchFileContent(ghToken, owner, currentRepo.name, screen.bkyPath)
            setCurrentBkyContent(bkyContent)
          } catch {
            setCurrentBkyContent(null)
          }
        } else {
          setCurrentBkyContent(null)
        }
        
        saveSnapshot()
        setActiveTab("telas")
      } catch (parseError) {
        console.error("Erro ao parsear SCM:", parseError)
      }
    } catch (error) {
      console.error("Erro ao carregar tela:", error)
    } finally {
      setLoadingScreen(null)
    }
  }

  // Carregar repos quando o token mudar
  useEffect(() => {
    if (ghToken && ghRepos.length === 0 && !ghReposLoading) {
      loadRepos()
    }
  }, [ghToken, ghRepos.length, ghReposLoading, loadRepos])

  const handleDragStart = (compName: string) => {
    setDraggedComp(compName)
  }

  const handleComponentClick = (compName: string) => {
    if (currentProject) {
      addComponent(currentProject.Properties.$Name, compName)
    }
  }

  return (
    <aside className="w-[260px] bg-card border-r border-border flex flex-col shrink-0">
      {/* Tabs */}
      <div className="flex p-1 bg-card border-b border-border gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-2 px-1 text-center text-[10px] font-bold uppercase tracking-wider rounded transition-all",
              activeTab === tab.id 
                ? "text-primary bg-primary/20" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Palette Tab */}
        {activeTab === "componentes" && (
          <div className="grid grid-cols-2 gap-1.5">
            {paletteComponents.map((comp) => (
              <div
                key={comp.name}
                draggable
                onClick={() => handleComponentClick(comp.name)}
                onDragStart={() => handleDragStart(comp.name)}
                className="bg-card border border-border rounded-lg p-2.5 flex flex-col items-center gap-1.5 cursor-grab hover:border-primary hover:bg-secondary transition-all text-muted-foreground hover:text-foreground"
              >
                <comp.icon className="w-4 h-4" />
                <span className="text-[10px] font-semibold">{comp.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Screens Tab */}
        {activeTab === "telas" && (
          <div>
            <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              TELAS DO PROJETO
              <Plus className="w-3.5 h-3.5 cursor-pointer hover:text-foreground" />
            </div>
            {screenFiles.length === 0 ? (
              <div className="text-center py-8">
                <Monitor className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs text-muted-foreground">
                  Nenhuma tela carregada.
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Selecione um repositorio na aba PROJETOS.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {screenFiles.map((screen) => (
                  <div
                    key={screen.scmPath}
                    onClick={() => loadScreen(screen)}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all",
                      currentScreenName === screen.name 
                        ? "bg-primary/20 border border-primary text-primary" 
                        : "hover:bg-secondary border border-transparent"
                    )}
                  >
                    {loadingScreen === screen.name ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Monitor className="w-4 h-4" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium truncate block">{screen.name}</span>
                      {screen.bkyPath && (
                        <span className="text-[10px] text-muted-foreground">+ blocos</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GitHub Tab */}
        {activeTab === "github" && (
          <div>
            {!ghToken ? (
              <>
                <div className="flex flex-col items-center py-6 text-center">
                  <FolderGit2 className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium mb-1">Conecte ao GitHub</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Importe projetos Kodular/App Inventor diretamente dos seus repositorios.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={onLoginClick}
                >
                  <GitBranch className="w-4 h-4 mr-2" />
                  Conectar GitHub
                </Button>
              </>
            ) : selectedRepo ? (
              // Repository selected - show screens summary
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => {
                      setSelectedRepo(null)
                      setRepoTree([])
                      setScreenFiles([])
                      setProjectAssets([])
                      setCurrentProject(null)
                      setCurrentScreenName(null)
                      setShowWelcome(true)
                    }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{selectedRepo.name}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      {selectedRepo.default_branch}
                    </div>
                  </div>
                </div>
                
                {repoTreeLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">Carregando projeto...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-secondary rounded-lg p-3">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        RESUMO DO PROJETO
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Telas:</span>
                          <span className="font-medium">{screenFiles.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Assets:</span>
                          <span className="font-medium">{projectAssets.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Blocos:</span>
                          <span className="font-medium">{screenFiles.filter(s => s.bkyPath).length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-muted-foreground text-center">
                      Use as abas TELAS e ASSETS para navegar pelo projeto.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Repository list
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    SEUS REPOSITORIOS
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={loadRepos}
                    disabled={ghReposLoading}
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", ghReposLoading && "animate-spin")} />
                  </Button>
                </div>
                
                {ghReposLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : ghReposError ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <AlertCircle className="w-8 h-8 text-destructive mb-2" />
                    <p className="text-xs text-muted-foreground mb-3">{ghReposError}</p>
                    <Button variant="outline" size="sm" onClick={loadRepos}>
                      Tentar novamente
                    </Button>
                  </div>
                ) : ghRepos.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Nenhum repositorio encontrado.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {ghRepos.map((repo) => (
                      <div
                        key={repo.id}
                        onClick={() => processRepoFiles(repo)}
                        className="p-2.5 rounded-lg border border-border hover:border-primary hover:bg-secondary cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <FolderGit2 className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-xs font-medium truncate">{repo.name}</span>
                          {repo.private && (
                            <span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                              Privado
                            </span>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-[10px] text-muted-foreground line-clamp-2 ml-6">
                            {repo.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === "assets" && (
          <div>
            <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              ASSETS DO PROJETO
              <Upload className="w-3.5 h-3.5 cursor-pointer hover:text-foreground" />
            </div>
            {projectAssets.length === 0 ? (
              <div className="text-center py-8">
                <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs text-muted-foreground">
                  Nenhum asset encontrado.
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Assets devem estar na pasta assets/ do repositorio.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {projectAssets.map((asset) => {
                  const IconComponent = getAssetIcon(asset.type)
                  return (
                    <div
                      key={asset.path}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-secondary cursor-pointer transition-all border border-transparent hover:border-border"
                    >
                      {asset.type === "image" ? (
                        <div className="w-8 h-8 rounded bg-secondary border border-border overflow-hidden flex-shrink-0">
                          <img 
                            src={asset.url} 
                            alt={asset.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium truncate block">{asset.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{asset.type}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Cloud Tab */}
        {activeTab === "cloud" && (
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
              <Cloud className="w-3.5 h-3.5" />
              CONTA E NUVEM
            </div>

            {!cloudUser ? (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  Sincronize seus projetos, historico de chat e builds entre dispositivos.
                </p>
                <Button 
                  className="w-full"
                  onClick={onLoginClick}
                >
                  LOGAR NA CONTA
                </Button>
              </>
            ) : (
              <>
                <div className="bg-secondary p-3 rounded-lg border border-border mb-4">
                  <div className="font-semibold text-sm">{cloudUser.name}</div>
                  <div className="text-xs text-muted-foreground">{cloudUser.email}</div>
                </div>

                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  SINCRONIZACAO
                </div>

                <div className="space-y-1 mb-4">
                  {["Historico de Chat", "Configuracoes IA", "GitHub Token"].map((item) => (
                    <div key={item} className="flex items-center gap-2 px-2 py-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs">{item}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  variant="outline" 
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => setCloudUser(null)}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  SAIR DA CONTA
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
