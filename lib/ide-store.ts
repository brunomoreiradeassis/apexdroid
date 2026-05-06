"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { 
  KodularComponent, 
  ProjectData, 
  GitHubFile, 
  ChatMessage, 
  Block,
  AISettings,
  CloudUser,
  BuildLog,
  GitHubRepo,
  GitHubTreeItem,
  ProjectAsset,
  ScreenFile
} from "./ide-types"

interface IDEState {
  // GitHub
  ghToken: string | null
  setGhToken: (token: string | null) => void
  ghRepos: GitHubRepo[]
  setGhRepos: (repos: GitHubRepo[]) => void
  ghReposLoading: boolean
  setGhReposLoading: (loading: boolean) => void
  ghReposError: string | null
  setGhReposError: (error: string | null) => void
  selectedRepo: GitHubRepo | null
  setSelectedRepo: (repo: GitHubRepo | null) => void
  repoTree: GitHubTreeItem[]
  setRepoTree: (tree: GitHubTreeItem[]) => void
  repoTreeLoading: boolean
  setRepoTreeLoading: (loading: boolean) => void
  
  // Project
  currentProject: ProjectData | null
  setCurrentProject: (project: ProjectData | null) => void
  currentFile: GitHubFile | null
  setCurrentFile: (file: GitHubFile | null) => void
  screens: string[]
  setScreens: (screens: string[]) => void
  screenFiles: ScreenFile[]
  setScreenFiles: (files: ScreenFile[]) => void
  currentScreenName: string | null
  setCurrentScreenName: (name: string | null) => void
  projectAssets: ProjectAsset[]
  setProjectAssets: (assets: ProjectAsset[]) => void
  currentBkyContent: string | null
  setCurrentBkyContent: (content: string | null) => void
  
  // Selection
  selectedComponent: KodularComponent | null
  setSelectedComponent: (comp: KodularComponent | null) => void
  
  // UI State
  activeTab: string
  setActiveTab: (tab: string) => void
  showProperties: boolean
  setShowProperties: (show: boolean) => void
  showWelcome: boolean
  setShowWelcome: (show: boolean) => void
  appMode: "edit" | "run"
  setAppMode: (mode: "edit" | "run") => void
  
  // Chat
  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void
  
  // Blocks
  blocks: Block[]
  setBlocks: (blocks: Block[]) => void
  
  // AI Settings
  aiSettings: AISettings
  setAISettings: (settings: AISettings) => void
  
  // Cloud User
  cloudUser: CloudUser | null
  setCloudUser: (user: CloudUser | null) => void
  
  // Build
  buildStatus: "idle" | "active" | "completed" | "failed"
  setBuildStatus: (status: "idle" | "active" | "completed" | "failed") => void
  buildProgress: number
  setBuildProgress: (progress: number) => void
  buildLogs: BuildLog[]
  addBuildLog: (log: BuildLog) => void
  clearBuildLogs: () => void
  
  // History for undo
  history: string[]
  historyIndex: number
  saveSnapshot: () => void
  undo: () => void
  
  // Component operations
  updateComponent: (name: string, props: Record<string, unknown>) => void
  addComponent: (parentName: string, type: string) => void
  removeComponent: (name: string) => void
  findComponent: (root: KodularComponent, name: string) => KodularComponent | null
}

export const useIDEStore = create<IDEState>()(
  persist(
    (set, get) => ({
      // GitHub
      ghToken: null,
      setGhToken: (token) => set({ ghToken: token }),
      ghRepos: [],
      setGhRepos: (repos) => set({ ghRepos: repos }),
      ghReposLoading: false,
      setGhReposLoading: (loading) => set({ ghReposLoading: loading }),
      ghReposError: null,
      setGhReposError: (error) => set({ ghReposError: error }),
      selectedRepo: null,
      setSelectedRepo: (repo) => set({ selectedRepo: repo }),
      repoTree: [],
      setRepoTree: (tree) => set({ repoTree: tree }),
      repoTreeLoading: false,
      setRepoTreeLoading: (loading) => set({ repoTreeLoading: loading }),
      
      // Project
      currentProject: null,
      setCurrentProject: (project) => set({ currentProject: project }),
      currentFile: null,
      setCurrentFile: (file) => set({ currentFile: file }),
      screens: [],
      setScreens: (screens) => set({ screens }),
      screenFiles: [],
      setScreenFiles: (files) => set({ screenFiles: files }),
      currentScreenName: null,
      setCurrentScreenName: (name) => set({ currentScreenName: name }),
      projectAssets: [],
      setProjectAssets: (assets) => set({ projectAssets: assets }),
      currentBkyContent: null,
      setCurrentBkyContent: (content) => set({ currentBkyContent: content }),
      
      // Selection
      selectedComponent: null,
      setSelectedComponent: (comp) => set({ selectedComponent: comp }),
      
      // UI State
      activeTab: "componentes",
      setActiveTab: (tab) => set({ activeTab: tab }),
      showProperties: false,
      setShowProperties: (show) => set({ showProperties: show }),
      showWelcome: true,
      setShowWelcome: (show) => set({ showWelcome: show }),
      appMode: "edit",
      setAppMode: (mode) => set({ appMode: mode }),
      
      // Chat
      chatMessages: [
        { id: "1", role: "assistant", content: "Olá! Eu sou o APEX DROID. Como posso ajudar com seu projeto hoje?" }
      ],
      addChatMessage: (message) => set((state) => ({ 
        chatMessages: [...state.chatMessages, message] 
      })),
      clearChat: () => set({ chatMessages: [
        { id: "1", role: "assistant", content: "Olá! Eu sou o APEX DROID. Como posso ajudar com seu projeto hoje?" }
      ]}),
      
      // Blocks
      blocks: [],
      setBlocks: (blocks) => set({ blocks }),
      
      // AI Settings
      aiSettings: {
        provider: "openai",
        model: "gpt-4-turbo",
        apiKey: "",
        baseUrl: "https://api.openai.com/v1"
      },
      setAISettings: (settings) => set({ aiSettings: settings }),
      
      // Cloud User
      cloudUser: null,
      setCloudUser: (user) => set({ cloudUser: user }),
      
      // Build
      buildStatus: "idle",
      setBuildStatus: (status) => set({ buildStatus: status }),
      buildProgress: 0,
      setBuildProgress: (progress) => set({ buildProgress: progress }),
      buildLogs: [],
      addBuildLog: (log) => set((state) => ({ 
        buildLogs: [...state.buildLogs, log] 
      })),
      clearBuildLogs: () => set({ buildLogs: [] }),
      
      // History
      history: [],
      historyIndex: -1,
      saveSnapshot: () => {
        const { currentProject, history, historyIndex } = get()
        if (!currentProject) return
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(JSON.stringify(currentProject))
        set({ history: newHistory, historyIndex: newHistory.length - 1 })
      },
      undo: () => {
        const { history, historyIndex } = get()
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1
          const project = JSON.parse(history[newIndex])
          set({ historyIndex: newIndex, currentProject: project })
        }
      },
      
      // Component operations
      findComponent: (root, name) => {
        if (root.$Name === name) return root
        if (root.$Components) {
          for (const c of root.$Components) {
            const found = get().findComponent(c, name)
            if (found) return found
          }
        }
        return null
      },
      
      updateComponent: (name, props) => {
        const { currentProject, findComponent, saveSnapshot } = get()
        if (!currentProject) return
        const comp = findComponent(currentProject.Properties, name)
        if (comp) {
          Object.assign(comp, props)
          saveSnapshot()
          set({ currentProject: { ...currentProject } })
        }
      },
      
      addComponent: (parentName, type) => {
        const { currentProject, findComponent, saveSnapshot } = get()
        if (!currentProject) return
        const parent = findComponent(currentProject.Properties, parentName)
        if (parent) {
          if (!parent.$Components) parent.$Components = []
          
          // Generate unique name
          let counter = 1
          const isNameUnique = (name: string): boolean => {
            const check = (root: KodularComponent): boolean => {
              if (root.$Name === name) return false
              if (root.$Components) {
                for (const c of root.$Components) {
                  if (!check(c)) return false
                }
              }
              return true
            }
            return check(currentProject.Properties)
          }
          
          while (!isNameUnique(type + counter)) counter++
          const newName = type + counter
          
          const newComp: KodularComponent = {
            $Type: type,
            $Name: newName
          }
          
          parent.$Components.push(newComp)
          saveSnapshot()
          set({ currentProject: { ...currentProject } })
        }
      },
      
      removeComponent: (name) => {
        const { currentProject, saveSnapshot } = get()
        if (!currentProject) return
        if (name === currentProject.Properties.$Name) return
        
        const removeFromParent = (root: KodularComponent): boolean => {
          if (root.$Components) {
            const idx = root.$Components.findIndex(c => c.$Name === name)
            if (idx !== -1) {
              root.$Components.splice(idx, 1)
              return true
            }
            for (const c of root.$Components) {
              if (removeFromParent(c)) return true
            }
          }
          return false
        }
        
        if (removeFromParent(currentProject.Properties)) {
          saveSnapshot()
          set({ currentProject: { ...currentProject }, selectedComponent: null })
        }
      }
    }),
    {
      name: "apex-droid-ide-storage",
      partialize: (state) => ({
        ghToken: state.ghToken,
        aiSettings: state.aiSettings,
        cloudUser: state.cloudUser
      })
    }
  )
)
