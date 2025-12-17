import type { Metadata } from 'next'
import { LandingHero } from '@/components/landing-hero'

export const metadata: Metadata = {
  description:
    'A CLI that scans Next.js routes and provides quick insights from your terminal, web UI, and MCP.',
  openGraph: {
    description:
      'A CLI that scans Next.js routes and provides quick insights from your terminal, web UI, and MCP.',
    images: '/images/og-image.png',
  },
  twitter: {
    card: 'summary_large_image',
    description:
      'A CLI that scans Next.js routes and provides quick insights from your terminal, web UI, and MCP.',
    images: ['/images/og-image.png'],
  },
}

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-20 px-4 overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />

      <LandingHero />
    </main>
  )
}
