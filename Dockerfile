FROM oven/bun:1 AS base
WORKDIR /app

# 依存パッケージのインストール
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ビルド
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# 本番実行
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["bun", "server.js"]
