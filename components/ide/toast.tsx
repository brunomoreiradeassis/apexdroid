"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface ToastProps {
  message: string
  type?: "success" | "error" | "info"
  onClose: () => void
}

export function Toast({ message, type = "info", onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div 
      className={cn(
        "fixed bottom-5 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-lg text-white text-xs font-medium z-[9999] transition-all duration-300",
        type === "success" && "bg-success",
        type === "error" && "bg-destructive",
        type === "info" && "bg-primary",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
    >
      {message}
    </div>
  )
}

// Toast manager for global access
type ToastType = "success" | "error" | "info"

interface ToastMessage {
  id: number
  message: string
  type: ToastType
}

let toastId = 0
let setToastsGlobal: React.Dispatch<React.SetStateAction<ToastMessage[]>> | null = null

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  
  useEffect(() => {
    setToastsGlobal = setToasts
    return () => { setToastsGlobal = null }
  }, [])

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

export const showToast = (message: string, type: ToastType = "info") => {
  if (setToastsGlobal) {
    const id = ++toastId
    setToastsGlobal(prev => [...prev, { id, message, type }])
  }
}
