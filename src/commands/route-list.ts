import { promises as fs } from 'fs'
import type { Stats } from 'fs'
import os from 'os'
import path from 'path'
import chalk from 'chalk'
import { Command } from 'commander'

type PageInfo = {
  file: string
  path: string
  hasLoading: boolean
  hasError: boolean
}

const primary = chalk.cyanBright
const accent = chalk.green
const subtle = chalk.dim

const SKIP_DIRECTORIES = new Set([
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

const ANSI_PATTERN = /\u001B\[[0-?]*[ -\/]*[@-~]/g
const PARAM_COLOR = chalk.hex('#ffae42')

export const routeListCommand = new Command('route:list')
  .description('List Next.js App Router page routes in a table view.')
  .argument(
    '[target-directory]',
    'Path to the Next.js project (defaults to the current working directory)',
  )
  .action(async (targetDirectory) => {
    try {
      await listPageRoutes(targetDirectory ?? null)
    } catch (error) {
      console.error(`Failed to list routes: ${(error as Error).message}`)
      process.exit(1)
    }
  })

async function listPageRoutes(targetDirectory: string | null) {
  const resolvedTarget = resolveTargetDirectory(targetDirectory)
  const root = await ensureDirectory(resolvedTarget)

  const pageFiles = await findPageFiles(root)

  const pages: PageInfo[] = []

  for (const filePath of pageFiles) {
    const pageMeta = await derivePageMeta(filePath, root)
    if (!pageMeta) continue
    pages.push(pageMeta)
  }

  if (!pages.length) {
    console.log(`No page routes found under ${root}`)
    return
  }

  pages.sort((a, b) => {
    const pathCompare = a.path.localeCompare(b.path)
    if (pathCompare !== 0) return pathCompare
    return a.file.localeCompare(b.file)
  })

  console.log(renderTable(pages))
}

function resolveTargetDirectory(target: string | null): string {
  if (!target) return process.cwd()
  return expandHome(target)
}

function expandHome(target: string): string {
  if (target === '~') return os.homedir()
  if (target.startsWith('~/')) {
    return path.join(os.homedir(), target.slice(2))
  }
  return target
}

async function ensureDirectory(target: string): Promise<string> {
  const resolved = path.resolve(target)
  let stats: Stats
  try {
    stats = await fs.stat(resolved)
  } catch (error) {
    console.error(`Cannot access ${resolved}: ${(error as Error).message}`)
    process.exit(1)
  }

  if (!stats.isDirectory()) {
    console.error(`${resolved} is not a directory`)
    process.exit(1)
  }

  return resolved
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
  const [hasLoading, hasError] = await Promise.all([
    hasFallbackFile(directory, 'loading'),
    hasFallbackFile(directory, 'error'),
  ])

  const normalizedFile = relativePath.split(path.sep).join('/')

  return {
    file: normalizedFile,
    path: routePath,
    hasLoading,
    hasError,
  }
}

function shouldIncludeSegment(segment: string): boolean {
  if (!segment.length) return false
  if (segment.startsWith('(') && segment.endsWith(')')) return false
  if (segment.startsWith('@')) return false
  return true
}

async function hasFallbackFile(
  directory: string,
  basename: 'loading' | 'error',
): Promise<boolean> {
  for (const extension of FALLBACK_EXTENSIONS) {
    const candidate = path.join(directory, `${basename}${extension}`)
    try {
      const stats = await fs.stat(candidate)
      if (stats.isFile()) return true
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue
      throw error
    }
  }
  return false
}

function transformSegment(segment: string): string {
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

function renderTable(pages: PageInfo[]): string {
  const total = pages.length
  const header = chalk.bold(primary('Next.js Route Info'))
  const subtitle = subtle(
    `Mapped ${accent(total.toString())} page${total === 1 ? '' : 's'}`,
  )

  const formatted = pages.map((page) => ({
    path: highlightDynamicSegments(page.path),
    states: formatRouteStates(page.hasLoading, page.hasError),
    file: chalk.gray(page.file),
  }))

  const pathHeader = chalk.dim('ROUTE')
  const statesHeader = chalk.dim('STATES COMPONENTS')
  const fileHeader = chalk.dim('SOURCE')

  const columnWidths = [
    Math.max(
      visibleLength(pathHeader),
      ...formatted.map((entry) => visibleLength(entry.path)),
    ),
    Math.max(
      visibleLength(statesHeader),
      ...formatted.map((entry) => visibleLength(entry.states)),
    ),
    Math.max(
      visibleLength(fileHeader),
      ...formatted.map((entry) => visibleLength(entry.file)),
    ),
  ]

  const topBorder = buildBorder(columnWidths, '=')
  const headerDivider = buildBorder(columnWidths, '-')

  const headerRow = buildRow(
    [pathHeader, statesHeader, fileHeader],
    columnWidths,
    chalk.dim,
  )

  const rows = formatted.map((entry) =>
    buildRow([entry.path, entry.states, entry.file], columnWidths),
  )

  return [
    '',
    header,
    subtitle,
    '',
    chalk.dim(topBorder),
    headerRow,
    chalk.dim(headerDivider),
    ...rows,
    chalk.dim(topBorder),
  ].join('\n')
}

function formatRouteStates(hasLoading: boolean, hasError: boolean): string {
  const loadingLabel = hasLoading
    ? accent('●') + subtle(' loading')
    : chalk.gray('○') + subtle(' loading')

  const errorLabel = hasError
    ? chalk.redBright('●') + subtle(' error')
    : chalk.gray('○') + subtle(' error')

  return `${loadingLabel}  ${errorLabel}`
}

function highlightDynamicSegments(pathLabel: string): string {
  return pathLabel.replace(/:(\w+(?:\*\??)?)/g, (_, name) =>
    PARAM_COLOR(`:${name}`),
  )
}

function buildRow(
  cells: string[],
  widths: number[],
  transform: (value: string) => string = (value) => value,
): string {
  const padded = cells.map((cell, index) => padEndAnsi(cell, widths[index]))
  return transform(`| ${padded.join(' | ')} |`)
}

function buildBorder(widths: number[], fill: '-' | '=' = '-'): string {
  const segments = widths.map((width) => fill.repeat(width + 2))
  return `+${segments.join('+')}+`
}

function padEndAnsi(text: string, target: number): string {
  const printable = visibleLength(text)
  if (printable >= target) return text
  return text + ' '.repeat(target - printable)
}

function visibleLength(text: string): number {
  return text.replace(ANSI_PATTERN, '').length
}

export default routeListCommand
