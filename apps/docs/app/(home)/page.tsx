import Link from 'next/link'
import { ScanAnimation } from '@/components/scan-animation'

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-20 px-4 overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />

      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Text Content */}
        <div className="flex flex-col text-left space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              next-lens
            </h1>
            <p className="text-xl sm:text-2xl text-zinc-400 font-medium">
              Visualize Your Next.js App Router
            </p>
            <p className="text-zinc-500 text-lg leading-relaxed max-w-lg">
              Automatically scan your project to identify all routes. Explore
              them via an intuitive UI or integrate with AI assistants using
              MCP.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/docs"
              className="px-6 py-1.5 rounded-xl bg-zinc-900 text-zinc-100 border border-zinc-800 hover:bg-zinc-800 transition-colors"
            >
              Read Documentation
            </Link>
            <Link
              href="/docs/quickstart"
              className="px-6 py-1.5 rounded-xl text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              Quickstart
            </Link>
          </div>

          <div className="flex flex-col gap-2 text-sm text-zinc-500 pt-4">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Automatic App Router Scanning
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Model Context Protocol (MCP) Integration
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-purple-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Interactive Inspector UI
            </div>
          </div>
        </div>

        {/* Animation/Visual */}
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-tr from-blue-500/10 to-purple-500/10 blur-2xl rounded-3xl -z-10" />
          <ScanAnimation />
        </div>
      </div>
    </main>
  )
}
