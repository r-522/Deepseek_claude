'use client'

import { useEffect, useRef } from 'react'
import { Bot } from 'lucide-react'
import type { Conversation } from '@/lib/types'
import MessageBubble from './MessageBubble'

interface ChatAreaProps {
  conversation: Conversation | null
  streamingMessageId: string | null
}

const EXAMPLE_PROMPTS = [
  'Pythonでウェブスクレイパーを書いて',
  '量子もつれをわかりやすく説明して',
  '∫ e^x sin(x) dx を解いて',
  'Reactのベストプラクティスを教えて',
]

export default function ChatArea({ conversation, streamingMessageId }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages.length, conversation?.messages.at(-1)?.content])

  if (!conversation || conversation.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 bg-cream-50">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-terracotta-500/10 border border-terracotta-500/20">
          <Bot size={30} className="text-terracotta-500" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-semibold text-stone-800 mb-2">何でも聞いてください</h2>
          <p className="text-stone-500 text-sm leading-relaxed">
            分析・執筆・コード・数学など、あらゆることをお手伝いします。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center max-w-lg mt-1">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <span
              key={prompt}
              className="px-3 py-1.5 text-xs rounded-full bg-cream-100 border border-cream-200 text-stone-600 select-none"
            >
              {prompt}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-cream-50">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {conversation.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={message.id === streamingMessageId}
          />
        ))}
        <div ref={bottomRef} className="h-2" />
      </div>
    </div>
  )
}
