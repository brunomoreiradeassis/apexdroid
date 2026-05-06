export interface KodularComponent {
  $Type: string
  $Name: string
  $Components?: KodularComponent[]
  Text?: string
  Width?: string | number
  Height?: string | number
  BackgroundColor?: string
  TextColor?: string
  Title?: string
  TitleVisible?: string
  AlignHorizontal?: string
  AlignVertical?: string
  [key: string]: unknown
}

export interface ProjectData {
  Properties: KodularComponent
  [key: string]: unknown
}

export interface GitHubFile {
  repo: string
  path: string
  sha: string
  branch: string
  originalContent: string
  content: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

export interface Block {
  type: "event" | "action"
  component: string
  eventName: string
  summary: string
}

export interface AISettings {
  provider: string
  model: string
  apiKey: string
  baseUrl: string
}

export interface CloudUser {
  id: string
  name: string
  email: string
}

export interface BuildLog {
  timestamp: Date
  message: string
  type: "log" | "info" | "error"
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  default_branch: string
  updated_at: string
}

export interface GitHubContent {
  name: string
  path: string
  sha: string
  size: number
  type: "file" | "dir"
  download_url: string | null
}

export interface GitHubTreeItem {
  path: string
  mode: string
  type: "blob" | "tree"
  sha: string
  size?: number
}

export interface ProjectAsset {
  name: string
  path: string
  url: string
  type: "image" | "audio" | "video" | "other"
}

export interface ScreenFile {
  name: string
  scmPath: string
  bkyPath: string | null
}
