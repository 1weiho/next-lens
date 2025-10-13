import { promises as fs } from 'fs'
import type { Stats } from 'fs'
import os from 'os'
import path from 'path'
import chalk, { type ChalkInstance } from 'chalk'
import { Command } from 'commander'

export type RouteInfo = {
  file: string
  methods: string[]
  path: string
}

const HTTP_METHODS = new Set([
  'GET',
  'HEAD',
  'OPTIONS',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
])

const METHOD_ORDER = [
  'GET',
  'HEAD',
  'OPTIONS',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]

const METHOD_COLORS: Record<string, ChalkInstance> = {
  GET: chalk.greenBright,
  HEAD: chalk.green,
  OPTIONS: chalk.cyan,
  POST: chalk.magentaBright,
  PUT: chalk.yellowBright,
  PATCH: chalk.blueBright,
  DELETE: chalk.redBright,
}

const ANSI_PATTERN = /\u001B\[[0-?]*[ -\/]*[@-~]/g
const PARAM_COLOR = chalk.hex('#ffae42')

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

const ROUTE_BASENAME = 'route'
const ROUTE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])

export const apiListCommand = new Command('api:list')
  .description('List Next.js App Router API routes in a table view.')
  .argument(
    '[target-directory]',
    'Path to the Next.js project (defaults to the current working directory)',
  )
  .action(async (targetDirectory) => {
    try {
      await listApiRoutes(targetDirectory ?? null)
    } catch (error) {
      console.error(`Failed to list routes: ${(error as Error).message}`)
      process.exit(1)
    }
  })

export async function listApiRoutes(
  targetDirectory: string | null,
): Promise<RouteInfo[]> {
  const resolvedTarget = resolveTargetDirectory(targetDirectory)
  const root = await ensureDirectory(resolvedTarget)

  const routeFiles = await findRouteFiles(root)

  const routes: RouteInfo[] = []
  for (const filePath of routeFiles) {
    const routeMeta = deriveRouteMeta(filePath, root)
    if (!routeMeta) continue

    const methods = await extractHttpMethods(filePath)
    if (!methods.length) continue

    routes.push({ ...routeMeta, methods: sortMethods(methods) })
  }

  if (!routes.length) {
    console.log(`No API routes found under ${root}`)
    return []
  }

  routes.sort((a, b) => {
    const pathCompare = a.path.localeCompare(b.path)
    if (pathCompare !== 0) return pathCompare

    const methodsA = a.methods.join(',')
    const methodsB = b.methods.join(',')
    return methodsA.localeCompare(methodsB)
  })

  console.log(renderTable(routes))

  return routes
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

async function findRouteFiles(root: string): Promise<string[]> {
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
      if (!isRouteFile(entry.name)) continue

      results.push(entryPath)
    }
  }

  await walk(root)
  return results
}

function isRouteFile(fileName: string): boolean {
  const parsed = path.parse(fileName)
  return parsed.name === ROUTE_BASENAME && ROUTE_EXTENSIONS.has(parsed.ext)
}

function deriveRouteMeta(filePath: string, root: string): RouteInfo | null {
  const relativePath = path.relative(root, filePath)
  const segments = relativePath.split(path.sep)
  const appIndex = segments.lastIndexOf('app')
  if (appIndex === -1) return null

  const routeSegments = segments.slice(appIndex + 1, segments.length - 1)
  const cleaned = routeSegments.filter((segment) => {
    if (!segment.length) return false
    if (segment.startsWith('(') && segment.endsWith(')')) return false
    if (segment.startsWith('@')) return false
    return true
  })

  if (!cleaned.length) return null
  if (cleaned[0] !== 'api') return null

  const routePath = '/' + cleaned.map(transformSegment).join('/')
  const normalizedFile = relativePath.split(path.sep).join('/')

  return {
    file: normalizedFile,
    methods: [],
    path: routePath,
  }
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

async function extractHttpMethods(filePath: string): Promise<string[]> {
  const source = await fs.readFile(filePath, 'utf8')
  const sanitized = stripComments(source)
  const methods = new Set<string>()

  const register = (name: string | undefined) => {
    if (!name) return
    const upper = name.toUpperCase()
    if (HTTP_METHODS.has(upper)) methods.add(upper)
  }

  let match: RegExpExecArray | null

  while ((match = FUNCTION_EXPORT_PATTERN.exec(sanitized))) {
    register(match[1])
  }

  while ((match = VARIABLE_EXPORT_PATTERN.exec(sanitized))) {
    register(match[1])
  }

  while ((match = DESTRUCTURED_EXPORT_PATTERN.exec(sanitized))) {
    const names = extractExportedNames(match[1])
    for (const name of names) register(name)
  }

  while ((match = NAMED_EXPORT_PATTERN.exec(sanitized))) {
    const names = extractExportedNames(match[1])
    for (const name of names) register(name)
  }

  return Array.from(methods)
}

const COMMENT_BLOCK_PATTERN = /\/\*[\s\S]*?\*\//g
const COMMENT_LINE_PATTERN = /(^|[^\S\r\n])\/\/.*$/gm
const FUNCTION_EXPORT_PATTERN =
  /\bexport\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g
const VARIABLE_EXPORT_PATTERN =
  /\bexport\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g
const DESTRUCTURED_EXPORT_PATTERN =
  /\bexport\s+(?:const|let|var)\s*{\s*([^}]+)\s*}\s*=/g
const NAMED_EXPORT_PATTERN = /\bexport\s*{([^}]+)}/g

function stripComments(source: string): string {
  return source
    .replace(COMMENT_BLOCK_PATTERN, ' ')
    .replace(COMMENT_LINE_PATTERN, (_, prefix: string = '') => prefix)
}

function extractExportedNames(list: string): string[] {
  return list
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((entry) => {
      const match = entry.match(
        /^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/i,
      )
      if (!match) return ''
      const [, original, alias] = match
      return (alias ?? original).trim()
    })
    .filter(Boolean)
}

function sortMethods(methods: string[]): string[] {
  return [...methods].sort((a, b) => {
    const indexA = METHOD_ORDER.indexOf(a)
    const indexB = METHOD_ORDER.indexOf(b)
    if (indexA === -1 && indexB === -1) return a.localeCompare(b)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })
}

function renderTable(routes: RouteInfo[]): string {
  const total = routes.length
  const header = chalk.bold(primary('Next.js API Route Info'))
  const subtitle = subtle(
    `Mapped ${accent(total.toString())} route${total === 1 ? '' : 's'}`,
  )

  const formatted = routes.map((route) => ({
    methods: colorizeMethods(route.methods),
    path: highlightDynamicSegments(route.path),
    file: chalk.gray(route.file),
  }))

  const methodHeader = chalk.dim('METHOD')
  const pathHeader = chalk.dim('ROUTE')
  const fileHeader = chalk.dim('SOURCE')

  const columnWidths = [
    Math.max(
      visibleLength(methodHeader),
      ...formatted.map((entry) => visibleLength(entry.methods)),
    ),
    Math.max(
      visibleLength(pathHeader),
      ...formatted.map((entry) => visibleLength(entry.path)),
    ),
    Math.max(
      visibleLength(fileHeader),
      ...formatted.map((entry) => visibleLength(entry.file)),
    ),
  ]

  const topBorder = buildBorder(columnWidths, '=')
  const headerDivider = buildBorder(columnWidths, '-')

  const headerRow = buildRow(
    [methodHeader, pathHeader, fileHeader],
    columnWidths,
    chalk.dim,
  )

  const rows = formatted.map((entry) =>
    buildRow([entry.methods, entry.path, entry.file], columnWidths),
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

function colorizeMethods(methods: string[]): string {
  const colored = methods.map((method) => {
    const painter = METHOD_COLORS[method] ?? chalk.whiteBright
    return painter.bold(method)
  })

  return colored.join(chalk.dim('|'))
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

export default apiListCommand
