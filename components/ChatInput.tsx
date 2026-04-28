'use client'

import { useRef, useState, KeyboardEvent } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { ArrowUp, Square } from 'lucide-react'

interface ChatInputProps {
  onSend: (content: string) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
}

export default function ChatInput({ onSend, onStop, isStreaming, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming || disabled) return
    onSend(trimmed)
    setValue('')
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const charCount = value.length
  const isNearLimit = charCount > 40_000

  return (
    <div className="shrink-0 border-t border-cream-200 bg-cream-50/90 backdrop-blur-sm px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <div
          className={`
            flex items-end gap-3 rounded-2xl border bg-white shadow-sm px-4 py-3
            transition-all duration-150
            ${isNearLimit ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-cream-200 focus-within:border-terracotta-400 focus-within:ring-2 focus-within:ring-terracotta-400/20'}
          `}
        >
          <TextareaAutosize
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="DeepSeekにメッセージを送る..."
            disabled={disabled}
            minRows={1}
            maxRows={12}
            className="flex-1 resize-none bg-transparent text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none leading-relaxed"
          />

          <div className="flex items-center gap-2 shrink-0 pb-0.5">
            {charCount > 200 && (
              <span className={`text-xs tabular-nums ${isNearLimit ? 'text-amber-600 font-medium' : 'text-stone-400'}`}>
                {charCount.toLocaleString()}
              </span>
            )}

            {isStreaming ? (
              <button
                onClick={onStop}
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-stone-800 text-white hover:bg-stone-700 transition-colors"
                title="生成を停止"
              >
                <Square size={13} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!value.trim() || disabled}
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-terracotta-500 text-white hover:bg-terracotta-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="送信 (Enter)"
              >
                <ArrowUp size={15} />
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-stone-400 text-center mt-2">
          Shift+Enter で改行 · Enter で送信
        </p>
      </div>
    </div>
  )
}
