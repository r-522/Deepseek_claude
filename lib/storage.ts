import type { Conversation, DeepSeekModel } from './types'

const CONVERSATIONS_KEY = 'deepseek_conversations'
const MODEL_KEY = 'deepseek_selected_model'

function isClient(): boolean {
  return typeof window !== 'undefined'
}

export function loadConversations(): Conversation[] {
  if (!isClient()) return []
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY)
    return raw ? (JSON.parse(raw) as Conversation[]) : []
  } catch {
    return []
  }
}

export function saveConversations(conversations: Conversation[]): void {
  if (!isClient()) return
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations))
  } catch {
    // Storage quota exceeded — fail silently
  }
}

export function loadSelectedModel(): DeepSeekModel {
  if (!isClient()) return 'deepseek-v4-flash'
  try {
    const stored = localStorage.getItem(MODEL_KEY)
    if (stored === 'deepseek-v4-pro' || stored === 'deepseek-v4-flash') {
      return stored
    }
  } catch {
    // ignore
  }
  return 'deepseek-v4-flash'
}

export function saveSelectedModel(model: DeepSeekModel): void {
  if (!isClient()) return
  try {
    localStorage.setItem(MODEL_KEY, model)
  } catch {
    // ignore
  }
}
