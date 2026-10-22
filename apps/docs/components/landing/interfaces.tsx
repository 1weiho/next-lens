'use client'

import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import {
  AppWindow,
  ArrowRight,
  Bot,
  Command,
  SquareTerminal,
  type LucideIcon,
} from 'lucide-react'
import { InstallCommand } from '@/components/landing/install-command'
import { Reveal } from '@/components/landing/reveal'
import { SectionHeading } from '@/components/landing/section-heading'
import { TerminalPreview } from '@/components/landing/terminal-preview'
import { cn } from '@/lib/utils'

const mcpConfig = `{
  "mcpServers": {
    "next-lens": {
      "command": "npx",
      "args": ["next-lens@latest", "mcp"]
    }
  }
}`

type Surface = {
  id: string
  label: string
  icon: LucideIcon
  title: string
  description: string
  points: string[]
  command: string
  href: string
  preview: ReactNode
}

const surfaces: Surface[] = [
  {
    id: 'cli',
    label: 'CLI',
    icon: SquareTerminal,
    title: 'Answers right in your terminal',
    description:
      'Colorized tables for pages and API routes, ready the moment you hit enter.',
    points: [
      'page:list with loading / error coverage',
      'api:list with --method filtering',
      'info for a framework and runtime snapshot',
    ],
    command: 'npx next-lens@latest api:list',
    href: '/docs/cli',
    preview: <TerminalPreview />,
  },
  {
    id: 'inspector',
    label: 'Inspector',
    icon: AppWindow,
    title: 'A visual map in the browser',
    description:
      'A local web UI to browse every route, built for exploring large apps.',
    points: [
      'Search and filter routes instantly',
      'Add or remove HTTP methods on a route',
      'Open any source file in your IDE',
      'Export a read-only static snapshot',
    ],
    command: 'npx next-lens@latest web',
    href: '/docs/inspector',
    preview: (
      <div className="overflow-hidden rounded-xl border border-fd-border">
        <Image
          src="/images/inspector-ui.png"
          alt="next-lens inspector"
          width={2978}
          height={1560}
          sizes="(min-width: 1024px) 640px, 100vw"
          className="block h-auto w-full dark:hidden"
        />
        <Image
          src="/images/inspector-ui-dark.png"
          alt="next-lens inspector"
          width={2978}
          height={1560}
          sizes="(min-width: 1024px) 640px, 100vw"
          className="hidden h-auto w-full dark:block"
        />
      </div>
    ),
  },
  {
    id: 'mcp',
    label: 'MCP',
    icon: Bot,
    title: 'Context for your AI editor',
    description:
      'An MCP server that gives coding agents and IDE copilots an accurate route map.',
    points: [
      'api-list and page-list tools',
      'api-search and page-search for quick lookups',
      'Structured JSON, same validation as the CLI',
    ],
    command: 'npx next-lens@latest mcp',
    href: '/docs/mcp',
    preview: (
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl">
        <div className="flex items-center gap-1.5 border-b border-zinc-800 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="ml-3 font-mono text-xs text-zinc-500">mcp.json</span>
        </div>
        <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-zinc-300 sm:text-sm">
          {mcpConfig}
        </pre>
      </div>
    ),
  },
  {
    id: 'raycast',
    label: 'Raycast',
    icon: Command,
    title: 'Routes one keystroke away',
    description:
      'Search and jump to any route from Raycast, without leaving what you are doing.',
    points: [
      'Search pages and API routes by path',
      'Backed by a local next-lens API server',
      'Opens Raycast automatically on start',
    ],
    command: 'npx next-lens@latest raycast',
    href: '/docs/raycast',
    preview: (
      <div className="overflow-hidden rounded-xl border border-fd-border">
        <Image
          src="/images/raycast.png"
          alt="next-lens Raycast extension"
          width={2000}
          height={1250}
          sizes="(min-width: 1024px) 640px, 100vw"
          className="block h-auto w-full"
        />
      </div>
    ),
  },
]

export function Interfaces() {
  const [activeId, setActiveId] = useState(surfaces[0].id)
  const active = surfaces.find((surface) => surface.id === activeId)!

  return (
    <section id="interfaces" className="border-b border-fd-border">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <Reveal>
          <SectionHeading
            eyebrow="Interfaces"
            title="One scan. Four ways to explore."
            description="Use whichever fits the moment — the same route data powers every surface."
          />
        </Reveal>

        <Reveal delay={0.05} className="mt-12">
          <div
            role="tablist"
            aria-label="next-lens interfaces"
            className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-fd-border bg-fd-secondary/60 p-1"
          >
            {surfaces.map((surface) => {
              const selected = surface.id === activeId
              return (
                <button
                  key={surface.id}
                  type="button"
                  role="tab"
                  id={`tab-${surface.id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${surface.id}`}
                  onClick={() => setActiveId(surface.id)}
                  className={cn(
                    'relative inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 sm:px-4 text-sm font-medium transition-colors',
                    selected
                      ? 'text-fd-foreground'
                      : 'text-fd-muted-foreground hover:text-fd-foreground',
                  )}
                >
                  {selected && (
                    <motion.span
                      layoutId="interface-tab"
                      className="absolute inset-0 rounded-lg border border-fd-border bg-fd-background shadow-sm"
                      transition={{
                        type: 'spring',
                        bounce: 0.15,
                        duration: 0.4,
                      }}
                    />
                  )}
                  <surface.icon className="relative hidden h-4 w-4 sm:block" />
                  <span className="relative">{surface.label}</span>
                </button>
              )
            })}
          </div>
        </Reveal>

        <div
          role="tabpanel"
          id={`panel-${active.id}`}
          aria-labelledby={`tab-${active.id}`}
          className="mt-10"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid items-center gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16"
            >
              <div className="min-w-0">
                <h3 className="text-2xl font-semibold tracking-tight text-fd-foreground">
                  {active.title}
                </h3>
                <p className="mt-3 leading-relaxed text-fd-muted-foreground">
                  {active.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {active.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-3 text-sm text-fd-foreground"
                    >
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-fd-muted-foreground" />
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-col items-start gap-4">
                  <InstallCommand
                    command={active.command}
                    className="max-w-full"
                  />
                  <Link
                    href={active.href}
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-fd-foreground"
                  >
                    Read the {active.label} docs
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
              <div className="min-w-0">{active.preview}</div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
