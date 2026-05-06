"use client"

import { useState, useEffect } from "react"
import { IDEHeader } from "@/components/ide/ide-header"
import { AIChat } from "@/components/ide/ai-chat"
import { Sidebar } from "@/components/ide/sidebar"
import { PhonePreview } from "@/components/ide/phone-preview"
import { PropertiesPanel } from "@/components/ide/properties-panel"
import { BuildModal } from "@/components/ide/build-modal"
import { BlocksModal } from "@/components/ide/blocks-modal"
import { SettingsModal } from "@/components/ide/settings-modal"
import { LoginModal } from "@/components/ide/login-modal"
import { CommandPalette } from "@/components/ide/command-palette"
import { ToastContainer } from "@/components/ide/toast"
import { useIDEStore } from "@/lib/ide-store"

export default function IDEPage() {
  const [buildModalOpen, setBuildModalOpen] = useState(false)
  const [blocksModalOpen, setBlocksModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const { 
    selectedComponent, 
    removeComponent,
    undo 
  } = useIDEStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault()
        undo()
      }
      if (e.key === "Delete" && selectedComponent) {
        removeComponent(selectedComponent.$Name)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedComponent, removeComponent, undo])

  if (!mounted) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <IDEHeader 
        onBuildClick={() => setBuildModalOpen(true)}
        onSettingsClick={() => setSettingsModalOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <AIChat />
        <Sidebar onLoginClick={() => setLoginModalOpen(true)} />
        <PhonePreview onLoginClick={() => setLoginModalOpen(true)} />
        <PropertiesPanel onShowBlocks={() => setBlocksModalOpen(true)} />
      </div>

      {/* Modals */}
      <BuildModal 
        isOpen={buildModalOpen} 
        onClose={() => setBuildModalOpen(false)} 
      />
      <BlocksModal 
        isOpen={blocksModalOpen} 
        onClose={() => setBlocksModalOpen(false)} 
      />
      <SettingsModal 
        isOpen={settingsModalOpen} 
        onClose={() => setSettingsModalOpen(false)} 
      />
      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />

      {/* Command Palette */}
      <CommandPalette
        onBuildClick={() => setBuildModalOpen(true)}
        onSettingsClick={() => setSettingsModalOpen(true)}
        onLoginClick={() => setLoginModalOpen(true)}
        onBlocksClick={() => setBlocksModalOpen(true)}
      />

      {/* Toast Container */}
      <ToastContainer />
    </div>
  )
}
