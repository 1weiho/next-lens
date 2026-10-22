import Link from 'next/link'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const variants = {
  primary:
    'bg-fd-foreground text-fd-background hover:bg-fd-foreground/85 border border-transparent',
  secondary:
    'border border-fd-border bg-fd-background text-fd-foreground hover:bg-fd-accent',
}

export function ButtonLink({
  variant = 'primary',
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: keyof typeof variants }) {
  return (
    <Link
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium transition-colors',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
