export type DeepSeekModel = 'deepseek-v4-pro' | 'deepseek-v4-flash'

export type MessageRole = 'user' | 'assistant'

export interface Message {
  id: string
  role: MessageRole
  content: string
  createdAt: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  model: DeepSeekModel
  createdAt: number
  updatedAt: number
}

export interface ChatRequestBody {
  messages: Array<{ role: MessageRole; content: string }>
  model: DeepSeekModel
  systemPrompt?: string
}

export interface StreamChunk {
  type: 'text_delta' | 'error' | 'done'
  text?: string
  error?: string
}
