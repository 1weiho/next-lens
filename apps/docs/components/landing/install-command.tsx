'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function InstallCommand({
  command = 'npx next-lens@latest web',
  className,
}: {
  command?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(command).then(() => setCopied(true))
      }}
      aria-label={`Copy command: ${command}`}
      className={cn(
        'group inline-flex h-11 min-w-0 items-center gap-3 rounded-lg border border-fd-border bg-fd-secondary/60 pl-4 pr-3 font-mono text-sm text-fd-foreground transition-colors hover:bg-fd-accent',
        className,
      )}
    >
      <span className="shrink-0 select-none text-fd-muted-foreground">$</span>
      <span className="truncate">{command}</span>
      <span className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center text-fd-muted-foreground transition-colors group-hover:text-fd-foreground">
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </span>
    </button>
  )
}
