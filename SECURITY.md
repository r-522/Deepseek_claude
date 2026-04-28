# SECURITY.md — セキュリティプロトコル

## APIキー管理

### 基本原則

- `DEEPSEEK_API_KEY` は **必ず `.env.local` にのみ** 記載する
- `.env.local` はデフォルトで `.gitignore` の `.env*` パターンに含まれ、**コミットされない**
- `NEXT_PUBLIC_` プレフィックスを絶対に付けない（付けるとクライアントバンドルに露出する）
- `.env.example` にはプレースホルダー値のみ記載し、実際のキーは含めない

### サーバーサイド強制

```typescript
// app/api/chat/route.ts
export const runtime = 'nodejs'  // Edgeランタイムを無効化
```

- `@anthropic-ai/sdk` は `next.config.ts` の `serverExternalPackages` に登録済み
  → クライアントバンドルへの混入を防ぐ
- APIキーは `process.env.DEEPSEEK_API_KEY` でサーバーサイドのみ参照

### 検証チェックリスト

```bash
# ブラウザのDevToolsで確認
# NG: JSバンドルに以下が含まれていないこと
grep "DEEPSEEK_API_KEY\|sk-" .next/static/chunks/*.js
```

## 入力サニタイゼーション

### APIルートでの検証

```typescript
// role は 'user' または 'assistant' のみ許可
// content は文字列型のみ許可
// 1メッセージあたり最大50,000文字（ハードキャップ）
const sanitizedMessages = messages
  .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
  .map(m => ({ role: m.role, content: m.content.trim().slice(0, 50_000) }))
```

### XSS対策

- `react-markdown` は安全なデフォルト設定（`dangerouslySetInnerHTML` 不使用）
- ユーザー入力をそのままHTMLとして埋め込まない
- リンクは `target="_blank" rel="noopener noreferrer"` で外部リンクを安全に開く

## レート制限

現在の実装（インメモリ、開発用）:
- 1分間に20リクエスト/IPアドレス
- コールドスタートでリセット（サーバーレス環境では各インスタンスごとにリセット）

本番環境への移行時:
- [Upstash Redis](https://upstash.com) + `@upstash/ratelimit` を使用した永続的レート制限を推奨

## してはいけないこと

| NG 行為 | 理由 |
|---------|------|
| `NEXT_PUBLIC_DEEPSEEK_API_KEY` | クライアントのJSバンドルにキーが露出する |
| `.env`（`.local`なし）へのキー記載 | `.env` はコミット対象になり得る |
| APIキーのURLパラメータ渡し | ログやブラウザ履歴に残る |
| クライアントコンポーネントからの直接API呼び出し | キーが露出し、CORSエラーの原因にもなる |
| `console.log(apiKey)` | サーバーログに出力される |

## セキュリティチェックリスト

- [x] `DEEPSEEK_API_KEY` は `.env.local` のみ（`NEXT_PUBLIC_` なし）
- [x] `.env.local` は `.gitignore` で除外済み
- [x] APIルートで入力検証・サニタイゼーション実施
- [x] `react-markdown` の安全なデフォルト使用
- [x] インメモリレート制限（本番はRedis推奨）
- [x] `serverExternalPackages` でSDKのクライアントバンドル混入を防止
- [x] `X-Accel-Buffering: no` でNginxバッファリングを無効化（SSE用）
