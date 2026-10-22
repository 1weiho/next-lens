import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('max-w-2xl', className)}>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-fd-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-fd-foreground sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-fd-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
    </div>
  )
}
