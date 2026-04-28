import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { ChatRequestBody } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_TOKENS = 8192
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'リクエスト制限に達しました。しばらく待ってから再試行してください。' },
      { status: 429 }
    )
  }

  let body: ChatRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 })
  }

  const { messages, model, systemPrompt } = body

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'メッセージが必要です' }, { status: 400 })
  }

  const validModels = ['deepseek-v4-pro', 'deepseek-v4-flash']
  if (!validModels.includes(model)) {
    return NextResponse.json({ error: '無効なモデルです' }, { status: 400 })
  }

  const sanitizedMessages = messages
    .filter(
      (m) =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0
    )
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content.trim().slice(0, 50_000),
    }))

  if (sanitizedMessages.length === 0) {
    return NextResponse.json({ error: '有効なメッセージがありません' }, { status: 400 })
  }

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    console.error('DEEPSEEK_API_KEY が設定されていません')
    return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 500 })
  }

  const client = new Anthropic({
    apiKey,
    baseURL: 'https://api.deepseek.com/anthropic',
  })

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const streamResponse = client.messages.stream({
          model,
          max_tokens: MAX_TOKENS,
          system: systemPrompt ?? 'You are a helpful, thoughtful AI assistant. Provide clear, accurate, and well-structured responses. Use markdown formatting when appropriate.',
          messages: sanitizedMessages,
        })

        for await (const event of streamResponse) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            send({ type: 'text_delta', text: event.delta.text })
          }
          if (event.type === 'message_stop') {
            send({ type: 'done' })
            break
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'ストリーミングエラー'
        console.error('DeepSeek API error:', message)
        send({ type: 'error', error: message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
