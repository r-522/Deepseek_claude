import type { Metadata, Viewport } from 'next'
import './globals.css'
import 'katex/dist/katex.min.css'

export const metadata: Metadata = {
  title: 'DeepSeek Chat',
  description: 'DeepSeek APIを使ったClaude風チャットインターフェース',
  robots: 'noindex, nofollow',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#D97757',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  )
}
