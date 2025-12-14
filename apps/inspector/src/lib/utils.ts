import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPath(path: string) {
  const parts = path.split('/')
  if (parts.length <= 5) return path

  const start = parts.slice(0, 2)
  const end = parts.slice(-2)
  return [...start, '...', ...end].join('/')
}
