# DeepSeek Chat

DeepSeek APIを基盤とした、Claudeに匹敵するユーザー体験を持つチャットアプリケーション。  
Next.js 15 (App Router) + React 19 + Tailwind CSS v4 + Bun で構築。

## 機能

- **リアルタイムストリーミング** — DeepSeekからのレスポンスをトークン単位で表示
- **Markdown・シンタックスハイライト** — コードブロックをダークテーマで表示
- **LaTeX数式** — KaTeXで数式をレンダリング
- **モデル選択** — DeepSeek Flash（高速）/ Pro（高度な推論）を切り替え
- **チャット履歴** — localStorageで会話を永続化
- **折りたたみ可能サイドバー** — 会話一覧・削除・新規作成
- **自動リサイズ入力欄** — 内容に応じてテキストエリアが伸縮

## 必要環境

- [Bun](https://bun.sh) 1.3+
- DeepSeek APIキー（[platform.deepseek.com](https://platform.deepseek.com) で取得）

## セットアップ

### 1. 依存パッケージのインストール

```bash
bun install
```

### 2. 環境変数の設定

```bash
cp .env.example .env.local
# .env.local を編集してDeepSeek APIキーを設定
```

`.env.local` の内容：
```
DEEPSEEK_API_KEY=sk-your-api-key-here
```

### 3. 開発サーバーの起動

```bash
bun dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開く。

## 利用可能なコマンド

| コマンド | 説明 |
|---------|------|
| `bun dev` | 開発サーバー起動（Turbopack） |
| `bun build` | 本番ビルド |
| `bun start` | 本番サーバー起動 |
| `bun lint` | ESLintを実行 |

## 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `DEEPSEEK_API_KEY` | ✅ | DeepSeek APIキー |

## ドキュメント

- [CLAUDE.md](./CLAUDE.md) — AIコーディングガイドライン・アーキテクチャ
- [DESIGN.md](./DESIGN.md) — UI/UXデザイン仕様
- [SECURITY.md](./SECURITY.md) — セキュリティプロトコル
