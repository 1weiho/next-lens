import { promises as fs } from 'fs'
import path from 'path'
import {
  ensureDirectory,
  resolveTargetDirectory,
  SKIP_DIRECTORIES,
  transformSegment,
} from './utils'

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

const ROUTE_BASENAME = 'route'
const ROUTE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])

const COMMENT_BLOCK_PATTERN = /\/\*[\s\S]*?\*\//g
const COMMENT_LINE_PATTERN = /(^|[^\S\r\n])\/\/.*$/gm
const FUNCTION_EXPORT_PATTERN =
  /\bexport\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g
const VARIABLE_EXPORT_PATTERN =
  /\bexport\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g
const DESTRUCTURED_EXPORT_PATTERN =
  /\bexport\s+(?:const|let|var)\s*{\s*([^}]+)\s*}\s*=/g
const NAMED_EXPORT_PATTERN = /\bexport\s*{([^}]+)}/g

export async function getApiRoutes(
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

  routes.sort((a, b) => {
    const pathCompare = a.path.localeCompare(b.path)
    if (pathCompare !== 0) return pathCompare

    const methodsA = a.methods.join(',')
    const methodsB = b.methods.join(',')
    return methodsA.localeCompare(methodsB)
  })

  return routes
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
