'use client'

import { useState } from 'react'
import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Conversation } from '@/lib/types'
import { formatRelativeTime } from '@/lib/utils'

interface SidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <aside
      className={`flex flex-col h-screen bg-cream-100 border-r border-cream-200 shrink-0 transition-all duration-300 ease-in-out ${collapsed ? 'w-14' : 'w-64'}`}
    >
      {/* ヘッダー */}
      <div className={`flex items-center border-b border-cream-200 px-3 py-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <span className="text-xs font-semibold text-stone-500 tracking-widest uppercase">チャット</span>
        )}
        <div className="flex items-center gap-1">
          {!collapsed && (
            <button
              onClick={onNewConversation}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-terracotta-600 hover:bg-clay-50 transition-colors"
              title="新しい会話"
            >
              <Plus size={15} />
              <span>新規</span>
            </button>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-cream-200 transition-colors"
            title={collapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
      </div>

      {/* 折りたたみ時の新規ボタン */}
      {collapsed && (
        <div className="px-2 py-2.5">
          <button
            onClick={onNewConversation}
            className="flex items-center justify-center w-full p-2 rounded-lg text-terracotta-600 hover:bg-clay-50 transition-colors"
            title="新しい会話"
          >
            <Plus size={17} />
          </button>
        </div>
      )}

      {/* 会話リスト */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {conversations.length === 0 ? (
          !collapsed && (
            <p className="text-xs text-stone-400 text-center mt-6 px-3 leading-relaxed">
              まだ会話がありません。<br />上の「新規」から始めましょう。
            </p>
          )
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((conv) => {
              const isActive = conv.id === activeConversationId
              const isHovered = hoveredId === conv.id
              return (
                <li key={conv.id}>
                  <div
                    className="relative"
                    onMouseEnter={() => setHoveredId(conv.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <button
                      onClick={() => onSelectConversation(conv.id)}
                      className={`flex items-start gap-2.5 w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-terracotta-500 text-white' : 'text-stone-700 hover:bg-cream-200'}`}
                      title={conv.title}
                    >
                      <MessageSquare
                        size={14}
                        className={`mt-0.5 shrink-0 ${isActive ? 'text-white' : 'text-stone-500'}`}
                      />
                      {!collapsed && (
                        <div className="flex-1 min-w-0 pr-1">
                          <p className="truncate font-medium text-[0.8rem] leading-tight">{conv.title}</p>
                          <p className={`text-[0.7rem] mt-0.5 ${isActive ? 'text-white/70' : 'text-stone-400'}`}>
                            {formatRelativeTime(conv.updatedAt)}
                          </p>
                        </div>
                      )}
                    </button>

                    {!collapsed && isHovered && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id) }}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${isActive ? 'text-white/60 hover:text-white hover:bg-white/15' : 'text-stone-400 hover:text-red-600 hover:bg-red-50'}`}
                        title="会話を削除"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </nav>

      {/* フッター */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-cream-200">
          <p className="text-[0.65rem] text-stone-400 text-center tracking-wide">
            Powered by DeepSeek
          </p>
        </div>
      )}
    </aside>
  )
}
