'use client'

import { memo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import { Bot, User, Copy, Check } from 'lucide-react'
import type { Message } from '@/lib/types'
import type { Components } from 'react-markdown'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
}

function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = getText()
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2.5 right-2.5 opacity-0 group-hover/code:opacity-100 transition-opacity flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'コピー済' : 'コピー'}
    </button>
  )
}

const markdownComponents: Components = {
  pre({ children, ...props }) {
    let codeText = ''
    const child = children as React.ReactElement<{ children?: string }>
    if (child?.props?.children && typeof child.props.children === 'string') {
      codeText = child.props.children
    }
    return (
      <div className="relative group/code my-3">
        <pre {...props} className="!bg-[#1e1e2e] !text-gray-100 !rounded-xl !p-4 !overflow-x-auto !text-[0.82rem] !leading-relaxed">
          {children}
        </pre>
        <CopyButton getText={() => codeText} />
      </div>
    )
  },
  table({ children, ...props }) {
    return (
      <div className="overflow-x-auto rounded-lg border border-cream-200 my-3">
        <table {...props} className="min-w-full text-sm">{children}</table>
      </div>
    )
  },
  a({ children, href, ...props }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-terracotta-600 underline decoration-dotted hover:text-terracotta-700"
        {...props}
      >
        {children}
      </a>
    )
  },
}

const MessageBubble = memo(function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 animate-fade-in">
        <div className="max-w-[82%]">
          <div className="bg-clay-100 border border-clay-200 rounded-2xl rounded-tr-sm px-4 py-3">
            <p className="text-stone-800 whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
          </div>
        </div>
        <div className="flex items-start pt-0.5 shrink-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-terracotta-500 text-white">
            <User size={13} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 group animate-fade-in">
      <div className="flex items-start pt-0.5 shrink-0">
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-full bg-cream-200 border border-cream-300 ${isStreaming ? 'animate-pulse' : ''}`}
        >
          <Bot size={13} className="text-terracotta-500" />
        </div>
      </div>

      <div className="flex-1 min-w-0 pb-2">
        <div className="prose text-sm text-stone-800 max-w-none">
          {message.content ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeHighlight]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <span className="inline-block w-2 h-4 bg-terracotta-400 rounded-sm animate-[cursor-blink_1s_step-end_infinite]" />
          )}

          {isStreaming && message.content && (
            <span className="inline-block w-0.5 h-4 bg-terracotta-400 rounded-full animate-[cursor-blink_1s_step-end_infinite] ml-0.5 align-text-bottom" />
          )}
        </div>

        {!isStreaming && message.content && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-stone-500 hover:bg-cream-200 hover:text-stone-700 transition-colors"
            >
              {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
              {copied ? 'コピー済' : 'コピー'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

export default MessageBubble
