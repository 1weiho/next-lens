import { promises as fs } from 'fs'
import path from 'path'
import {
  ensureDirectory,
  resolveTargetDirectory,
  SKIP_DIRECTORIES,
  transformSegment,
} from './utils'

type FallbackStatus = 'co-located' | 'inherited' | 'missing'

export type PageInfo = {
  file: string
  path: string
  loading: FallbackStatus
  error: FallbackStatus
  loadingPath?: string
  errorPath?: string
}

const PAGE_BASENAME = 'page'
const PAGE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mdx',
  '.md',
  '.mjs',
  '.cjs',
])

const FALLBACK_EXTENSIONS = PAGE_EXTENSIONS

export async function getPageRoutes(
  targetDirectory: string | null,
): Promise<PageInfo[]> {
  const resolvedTarget = resolveTargetDirectory(targetDirectory)
  const root = await ensureDirectory(resolvedTarget)

  const pageFiles = await findPageFiles(root)

  const pages: PageInfo[] = []

  for (const filePath of pageFiles) {
    const pageMeta = await derivePageMeta(filePath, root)
    if (!pageMeta) continue
    pages.push(pageMeta)
  }

  pages.sort((a, b) => {
    const pathCompare = a.path.localeCompare(b.path)
    if (pathCompare !== 0) return pathCompare
    return a.file.localeCompare(b.file)
  })

  return pages
}

async function findPageFiles(root: string): Promise<string[]> {
  const results: string[] = []

  async function walk(current: string) {
    const entries = await fs.readdir(current, { withFileTypes: true })

    for (const entry of entries) {
      const entryPath = path.join(current, entry.name)

      if (entry.isDirectory()) {
        if (SKIP_DIRECTORIES.has(entry.name)) continue
        await walk(entryPath)
        continue
      }

      if (!entry.isFile()) continue
      if (!isPageFile(entry.name)) continue

      results.push(entryPath)
    }
  }

  await walk(root)
  return results
}

function isPageFile(fileName: string): boolean {
  const parsed = path.parse(fileName)
  return parsed.name === PAGE_BASENAME && PAGE_EXTENSIONS.has(parsed.ext)
}

async function derivePageMeta(
  filePath: string,
  root: string,
): Promise<PageInfo | null> {
  const relativePath = path.relative(root, filePath)
  const segments = relativePath.split(path.sep)
  const appIndex = segments.lastIndexOf('app')
  if (appIndex === -1) return null

  const routeSegments = segments.slice(appIndex + 1)
  if (!routeSegments.length) return null

  const directorySegments = routeSegments.slice(0, -1)
  const cleanedSegments = directorySegments.filter(shouldIncludeSegment)

  const routePath =
    cleanedSegments.length === 0
      ? '/'
      : '/' + cleanedSegments.map(transformSegment).join('/')

  const directory = path.dirname(filePath)
  const appRootPath = path.join(root, ...segments.slice(0, appIndex + 1))
  const [loading, error] = await Promise.all([
    resolveFallbackInfo(directory, 'loading', appRootPath, root),
    resolveFallbackInfo(directory, 'error', appRootPath, root),
  ])

  const normalizedFile = relativePath.split(path.sep).join('/')

  return {
    file: normalizedFile,
    path: routePath,
    loading: loading.status,
    error: error.status,
    loadingPath: loading.path,
    errorPath: error.path,
  }
}

function shouldIncludeSegment(segment: string): boolean {
  if (!segment.length) return false
  if (segment.startsWith('(') && segment.endsWith(')')) return false
  if (segment.startsWith('@')) return false
  return true
}

async function findFallbackFile(
  directory: string,
  basename: 'loading' | 'error',
): Promise<string | null> {
  for (const extension of FALLBACK_EXTENSIONS) {
    const candidate = path.join(directory, `${basename}${extension}`)
    try {
      const stats = await fs.stat(candidate)
      if (stats.isFile()) return candidate
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue
      throw error
    }
  }
  return null
}

async function resolveFallbackInfo(
  directory: string,
  basename: 'loading' | 'error',
  appRootPath: string,
  root: string,
): Promise<{ status: FallbackStatus; path?: string }> {
  let current = directory
  let isFirst = true

  while (isWithinAppRoot(current, appRootPath)) {
    const found = await findFallbackFile(current, basename)
    if (found) {
      const normalized = path.relative(root, found).split(path.sep).join('/')
      return {
        status: isFirst ? 'co-located' : 'inherited',
        path: normalized,
      }
    }

    if (pathsEqual(current, appRootPath)) break

    const parent = path.dirname(current)
    if (pathsEqual(parent, current)) break

    current = parent
    isFirst = false
  }

  return { status: 'missing' }
}

function isWithinAppRoot(directory: string, appRootPath: string): boolean {
  const relative = path.relative(appRootPath, directory)
  if (relative === '') return true
  if (relative.startsWith('..')) return false
  return !path.isAbsolute(relative)
}

function pathsEqual(a: string, b: string): boolean {
  return path.resolve(a) === path.resolve(b)
}
