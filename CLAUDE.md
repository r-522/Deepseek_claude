# CLAUDE.md — AIコーディングガイドライン

## プロジェクト概要

DeepSeek APIを使ったClaude風チャットアプリ。Anthropic SDKのbaseURLオーバーライド機能でDeepSeekのAnthropic互換エンドポイントに接続する。

## アーキテクチャ

```
app/
├── layout.tsx          # ルートレイアウト（KaTeX CSS読み込み）
├── page.tsx            # メインページ（クライアントコンポーネント、全状態管理）
├── globals.css         # Tailwind v4 @theme デザイントークン
└── api/chat/route.ts   # SSEストリーミングブリッジ（サーバーサイド専用）

components/
├── Sidebar.tsx         # 会話リスト（折りたたみ対応）
├── ChatArea.tsx        # メッセージ表示エリア
├── MessageBubble.tsx   # 単一メッセージ（Markdown+LaTeX+ハイライト）
├── ChatInput.tsx       # 自動リサイズテキストエリア
└── ModelSelector.tsx   # モデル切替ドロップダウン

lib/
├── types.ts            # TypeScript型定義
├── storage.ts          # localStorageヘルパー
└── utils.ts            # ユーティリティ関数
```

## 重要な制約事項

1. **APIキーはサーバーサイドのみ** — `DEEPSEEK_API_KEY` は `.env.local` にのみ記載。`NEXT_PUBLIC_` プレフィックス厳禁。
2. **APIルートのランタイム** — `export const runtime = 'nodejs'` 必須（Anthropic SDKはNode.js暗号APIを使用するためEdgeランタイム不可）。
3. **Tailwind v4はCSS-first** — `@theme` ブロックで色定義。`tailwind.config.ts` は不要。
4. **`@anthropic-ai/sdk` はサーバー外部パッケージ** — `next.config.ts` の `serverExternalPackages` に登録済み。
5. **KaTeX CSSはグローバル読み込み** — `app/layout.tsx` で `import 'katex/dist/katex.min.css'`。

## ストリーミングアーキテクチャ

```
クライアント → POST /api/chat
             ← ReadableStream (SSE)
                data: {"type":"text_delta","text":"..."}\n\n
                data: {"type":"done"}\n\n
```

- サーバーで `anthropic.messages.stream()` を `for await` でイテレート
- `content_block_delta` かつ `delta.type === 'text_delta'` のイベントのみ転送
- クライアントは `TextDecoder` + `ReadableStreamDefaultReader` で受信
- React状態をトークンごとに更新して逐次表示

## コーディング規約

- TypeScript Strict Mode: `any` 型禁止
- `'use client'` はデータフェッチ不要のインタラクティブコンポーネントのみ
- 副作用は `useCallback` でメモ化、依存配列を正確に記述
- 状態管理は `app/page.tsx` に集中（Prop drilling を許容、外部ライブラリ不使用）

## DeepSeek API接続設定

```typescript
const client = new Anthropic({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/anthropic',
})
```

利用モデル:
- `deepseek-v4-flash` — 高速・軽量（デフォルト）
- `deepseek-v4-pro` — 高度な推論（複雑な問題向け）
- ⚠️ `deepseek-chat` は2026年7月廃止予定のため使用禁止
