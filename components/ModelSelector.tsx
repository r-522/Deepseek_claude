'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Zap, Brain } from 'lucide-react'
import type { DeepSeekModel } from '@/lib/types'

interface ModelSelectorProps {
  selectedModel: DeepSeekModel
  onChange: (model: DeepSeekModel) => void
  disabled?: boolean
}

const MODEL_INFO: Record<DeepSeekModel, { label: string; description: string; icon: React.ReactNode }> = {
  'deepseek-v4-flash': {
    label: 'Flash',
    description: '高速・軽量 — 日常タスク向け',
    icon: <Zap size={13} className="text-amber-500" />,
  },
  'deepseek-v4-pro': {
    label: 'Pro',
    description: '高度な推論 — 複雑な問題向け',
    icon: <Brain size={13} className="text-terracotta-500" />,
  },
}

export default function ModelSelector({ selectedModel, onChange, disabled = false }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = MODEL_INFO[selectedModel]

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cream-200 bg-white text-sm text-stone-700 hover:bg-cream-50 hover:border-cream-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {current.icon}
        <span className="font-medium">DeepSeek {current.label}</span>
        <ChevronDown size={12} className={`text-stone-500 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-cream-200 bg-white shadow-lg overflow-hidden">
          {(Object.keys(MODEL_INFO) as DeepSeekModel[]).map((key) => {
            const info = MODEL_INFO[key]
            const active = key === selectedModel
            return (
              <button
                key={key}
                onClick={() => { onChange(key); setOpen(false) }}
                className={`flex items-start gap-3 w-full px-4 py-3 text-left text-sm transition-colors ${active ? 'bg-clay-50' : 'hover:bg-cream-50'}`}
              >
                <span className="mt-0.5 shrink-0">{info.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${active ? 'text-terracotta-700' : 'text-stone-800'}`}>
                    DeepSeek {info.label}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">{info.description}</p>
                </div>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500 mt-1.5 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
