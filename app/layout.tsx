import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DoomCaster - Strategic Card Game',
  description: 'A strategic card game where you cast spells, fuse abilities, and defeat areas to become the ultimate DoomCaster!',
  keywords: 'card game, strategy, spells, magic, puzzle game',
  authors: [{ name: 'DoomCaster Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
} 