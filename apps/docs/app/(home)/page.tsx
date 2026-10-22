import type { Metadata } from 'next'
import { CallToAction } from '@/components/landing/call-to-action'
import { Features } from '@/components/landing/features'
import { Footer } from '@/components/landing/footer'
import { Hero } from '@/components/landing/hero'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Interfaces } from '@/components/landing/interfaces'

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
    <>
      <div className="flex-1">
        <Hero />
        <Features />
        <Interfaces />
        <HowItWorks />
        <CallToAction />
      </div>
      <Footer />
    </>
  )
}
