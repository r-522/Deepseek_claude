'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { generateId, deriveTitle } from '@/lib/utils'
import {
  loadConversations,
  saveConversations,
  loadSelectedModel,
  saveSelectedModel,
} from '@/lib/storage'
import type { Conversation, Message, DeepSeekModel } from '@/lib/types'
import Sidebar from '@/components/Sidebar'
import ChatArea from '@/components/ChatArea'
import ChatInput from '@/components/ChatInput'
import ModelSelector from '@/components/ModelSelector'

export default function HomePage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<DeepSeekModel>('deepseek-v4-flash')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // クライアントサイドでlocalStorageから読み込む
  useEffect(() => {
    const stored = loadConversations()
    setConversations(stored)
    setSelectedModel(loadSelectedModel())
    if (stored.length > 0) setActiveConversationId(stored[0].id)
  }, [])

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null

  const handleNewConversation = useCallback(() => {
    const newConv: Conversation = {
      id: generateId(),
      title: '新しい会話',
      messages: [],
      model: selectedModel,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setConversations((prev) => {
      const updated = [newConv, ...prev]
      saveConversations(updated)
      return updated
    })
    setActiveConversationId(newConv.id)
  }, [selectedModel])

  const handleSelectConversation = useCallback((id: string) => {
    abortRef.current?.abort()
    setIsStreaming(false)
    setStreamingMessageId(null)
    setActiveConversationId(id)
  }, [])

  const handleDeleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id)
      saveConversations(filtered)
      if (activeConversationId === id) {
        setActiveConversationId(filtered[0]?.id ?? null)
      }
      return filtered
    })
  }, [activeConversationId])

  const handleModelChange = useCallback((model: DeepSeekModel) => {
    setSelectedModel(model)
    saveSelectedModel(model)
  }, [])

  const handleStopStreaming = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
    setStreamingMessageId(null)
  }, [])

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return

    // アクティブな会話がなければ新規作成
    let convId = activeConversationId
    let baseConversations = conversations

    if (!convId) {
      const newConv: Conversation = {
        id: generateId(),
        title: deriveTitle(content),
        messages: [],
        model: selectedModel,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      baseConversations = [newConv, ...conversations]
      setConversations(baseConversations)
      setActiveConversationId(newConv.id)
      convId = newConv.id
    }

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      createdAt: Date.now(),
    }

    const assistantMsg: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    }

    // 楽観的更新（ユーザーメッセージ + 空のアシスタントメッセージ）
    const optimisticConvs = baseConversations.map((c) => {
      if (c.id !== convId) return c
      return {
        ...c,
        title: c.messages.length === 0 ? deriveTitle(content) : c.title,
        messages: [...c.messages, userMsg, assistantMsg],
        updatedAt: Date.now(),
      }
    })
    setConversations(optimisticConvs)
    setIsStreaming(true)
    setStreamingMessageId(assistantMsg.id)

    // APIに送るメッセージ履歴（空のアシスタントメッセージは除く）
    const conv = optimisticConvs.find((c) => c.id === convId)!
    const apiMessages = conv.messages
      .filter((m) => m.id !== assistantMsg.id)
      .map((m) => ({ role: m.role, content: m.content }))

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel,
          systemPrompt: 'あなたは優秀なAIアシスタントです。明確で正確な回答を日本語または質問と同じ言語で提供してください。必要に応じてMarkdown形式を使用してください。',
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTPエラー ${res.status}` }))
        throw new Error(err.error ?? `HTTP ${res.status}`)
      }

      if (!res.body) throw new Error('レスポンスボディがありません')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data || data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data) as { type: string; text?: string; error?: string }
            if (parsed.type === 'text_delta' && parsed.text) {
              accumulated += parsed.text
              const currentAccumulated = accumulated
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id !== convId) return c
                  return {
                    ...c,
                    updatedAt: Date.now(),
                    messages: c.messages.map((m) =>
                      m.id === assistantMsg.id ? { ...m, content: currentAccumulated } : m
                    ),
                  }
                })
              )
            }
          } catch {
            // 不正なJSONチャンクはスキップ
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return
      const errorText = err instanceof Error ? err.message : 'エラーが発生しました'
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: `エラー: ${errorText}` }
                : m
            ),
          }
        })
      )
    } finally {
      setIsStreaming(false)
      setStreamingMessageId(null)
      abortRef.current = null
      setConversations((prev) => {
        saveConversations(prev)
        return prev
      })
    }
  }, [isStreaming, activeConversationId, conversations, selectedModel])

  return (
    <div className="flex h-screen bg-cream-50">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      <main className="flex flex-col flex-1 min-w-0 h-screen">
        {/* ヘッダー */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-cream-200 bg-cream-50/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">DeepSeek Chat</span>
          </div>
          <ModelSelector
            selectedModel={selectedModel}
            onChange={handleModelChange}
            disabled={isStreaming}
          />
        </header>

        {/* メッセージエリア */}
        <ChatArea
          conversation={activeConversation}
          streamingMessageId={streamingMessageId}
        />

        {/* 入力エリア */}
        <ChatInput
          onSend={handleSendMessage}
          onStop={handleStopStreaming}
          isStreaming={isStreaming}
        />
      </main>
    </div>
  )
}
