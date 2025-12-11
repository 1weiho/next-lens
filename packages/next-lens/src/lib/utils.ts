import { promises as fs } from 'fs'
import type { Stats } from 'fs'
import os from 'os'
import path from 'path'

export const SKIP_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.turbo',
  '.vercel',
  'out',
  'coverage',
])

export function resolveTargetDirectory(target: string | null): string {
  if (!target) return process.cwd()
  return expandHome(target)
}

export function expandHome(target: string): string {
  if (target === '~') return os.homedir()
  if (target.startsWith('~/')) {
    return path.join(os.homedir(), target.slice(2))
  }
  return target
}

export async function ensureDirectory(target: string): Promise<string> {
  const resolved = path.resolve(target)
  let stats: Stats
  try {
    stats = await fs.stat(resolved)
  } catch (error) {
    throw new Error(`Cannot access ${resolved}: ${(error as Error).message}`)
  }

  if (!stats.isDirectory()) {
    throw new Error(`${resolved} is not a directory`)
  }

  return resolved
}

export function transformSegment(segment: string): string {
  const optionalCatchAll = segment.match(/^\[\[\.\.\.(.+)]]$/)
  if (optionalCatchAll) {
    return `:${optionalCatchAll[1]}*?`
  }

  const catchAll = segment.match(/^\[\.\.\.(.+)]$/)
  if (catchAll) {
    return `:${catchAll[1]}*`
  }

  const dynamic = segment.match(/^\[(.+)]$/)
  if (dynamic) {
    return `:${dynamic[1]}`
  }

  return segment
}
