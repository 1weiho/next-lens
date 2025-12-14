import { promises as fs } from 'fs'
import path from 'path'

import { HTTP_METHODS } from '../api-routes'

export class FileExistsError extends Error {
  status: 409 = 409

  constructor(filePath: string) {
    super(`File already exists at ${filePath}`)
    this.name = 'FileExistsError'
  }
}

async function ensureFileAbsent(filePath: string) {
  try {
    await fs.access(filePath)
    throw new FileExistsError(filePath)
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err instanceof FileExistsError) throw err
    if (err.code !== 'ENOENT') throw err
  }
}

const LOADING_TEMPLATE = `export default function Loading() {
  return <div>Loading...</div>
}
`

const ERROR_TEMPLATE = `'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
`

/**
 * Delete a route file
 */
export async function deleteRouteFile(filePath: string): Promise<void> {
  await fs.unlink(filePath)
}

/**
 * Delete a page file
 */
export async function deletePageFile(filePath: string): Promise<void> {
  await fs.unlink(filePath)
}

/**
 * Create a loading.tsx file in the same directory as the page file
 */
export async function createLoadingFile(pageFilePath: string): Promise<string> {
  const dir = path.dirname(pageFilePath)
  const ext = path.extname(pageFilePath)
  const loadingPath = path.join(dir, `loading${ext}`)

  await ensureFileAbsent(loadingPath)
  await fs.writeFile(loadingPath, LOADING_TEMPLATE, 'utf8')
  return loadingPath
}

/**
 * Create an error.tsx file in the same directory as the page file
 */
export async function createErrorFile(pageFilePath: string): Promise<string> {
  const dir = path.dirname(pageFilePath)
  const ext = path.extname(pageFilePath)
  const errorPath = path.join(dir, `error${ext}`)

  await ensureFileAbsent(errorPath)
  await fs.writeFile(errorPath, ERROR_TEMPLATE, 'utf8')
  return errorPath
}

/**
 * Add an HTTP method handler to an existing route file
 */
export async function addHttpMethod(
  routeFilePath: string,
  method: string,
): Promise<void> {
  const upperMethod = method.toUpperCase()

  if (!HTTP_METHODS.has(upperMethod)) {
    throw new Error(`Invalid HTTP method: ${method}`)
  }

  let content = await fs.readFile(routeFilePath, 'utf8')

  // Check if method already exists
  const exportPattern = new RegExp(
    `\\bexport\\s+(?:async\\s+)?(?:function|const)\\s+${upperMethod}\\b`,
    'i',
  )
  if (exportPattern.test(content)) {
    throw new Error(`Method ${upperMethod} already exists`)
  }

  // Ensure NextRequest/NextResponse imports exist for the generated handler
  const lines = content.split('\n')

  const isValueImport = (line: string) =>
    /^\s*import\s+\{[^}]*\}\s+from ['"]next\/server['"]/.test(line)
  const isTypeImport = (line: string) =>
    /^\s*import\s+type\s+\{[^}]*\}\s+from ['"]next\/server['"]/.test(line)

  const hasSpecifier = (line: string, name: string) => {
    const match = line.match(/\{([^}]+)\}/)
    if (!match) return false
    return match[1]
      .split(',')
      .map((s) => s.trim().replace(/^type\s+/, ''))
      .includes(name)
  }

  const addSpecifier = (line: string, name: string, asType: boolean) => {
    const match = line.match(/\{([^}]+)\}/)
    if (!match) return line
    const existing = match[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (existing.some((s) => s.replace(/^type\s+/, '') === name)) return line
    const next = [...existing, asType ? `type ${name}` : name]
    const unique = Array.from(new Set(next))
    return line.replace(match[0], `{ ${unique.join(', ')} }`)
  }

  const valueImportIndex = lines.findIndex(isValueImport)
  const typeImportIndex = lines.findIndex(isTypeImport)

  if (valueImportIndex !== -1) {
    lines[valueImportIndex] = addSpecifier(
      lines[valueImportIndex],
      'NextResponse',
      false,
    )
    lines[valueImportIndex] = addSpecifier(
      lines[valueImportIndex],
      'NextRequest',
      true,
    )
  }

  if (typeImportIndex !== -1) {
    lines[typeImportIndex] = addSpecifier(
      lines[typeImportIndex],
      'NextRequest',
      false,
    )
  }

  const hasNextRequest = lines.some(
    (line) =>
      (isValueImport(line) || isTypeImport(line)) &&
      hasSpecifier(line, 'NextRequest'),
  )
  const hasNextResponse = lines.some(
    (line) => isValueImport(line) && hasSpecifier(line, 'NextResponse'),
  )

  const findInsertIndex = () => {
    let insertIndex = 0
    while (
      insertIndex < lines.length &&
      /^['"]use\s+\w+['"];?$/.test(lines[insertIndex].trim())
    ) {
      insertIndex++
    }
    return insertIndex
  }

  if (!hasNextResponse) {
    const insertIndex =
      valueImportIndex !== -1
        ? valueImportIndex + 1
        : typeImportIndex !== -1
          ? typeImportIndex + 1
          : findInsertIndex()
    lines.splice(insertIndex, 0, "import { NextResponse } from 'next/server'")
  }

  if (!hasNextRequest) {
    const insertIndex = findInsertIndex()
    lines.splice(
      insertIndex,
      0,
      "import type { NextRequest } from 'next/server'",
    )
  }

  content = lines.join('\n')

  const normalizedContent = content.endsWith('\n') ? content : `${content}\n`

  // Generate method template
  const template = `
export async function ${upperMethod}(request: NextRequest) {
  // TODO: Implement ${upperMethod} handler
  return NextResponse.json({ message: '${upperMethod} handler' })
}
`

  // Append to file
  await fs.writeFile(routeFilePath, normalizedContent + template, 'utf8')
}

/**
 * Remove an HTTP method handler from an existing route file.
 *
 * This uses a lightweight parser to remove:
 * - `export async function METHOD(...) { ... }`
 * - `export const METHOD = ...;`
 * - named exports that include the method (e.g., `export { GET, POST }`)
 *
 * The parser is intentionally conservative and will throw if it cannot safely
 * find and remove the target method.
 */
export async function removeHttpMethod(
  routeFilePath: string,
  method: string,
): Promise<void> {
  const upperMethod = method.toUpperCase()

  if (!HTTP_METHODS.has(upperMethod)) {
    throw new Error(`Invalid HTTP method: ${method}`)
  }

  const content = await fs.readFile(routeFilePath, 'utf8')

  let updated = content
  let removed = false

  const cleanSpacing = (code: string) =>
    code.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'

  const removeRange = (code: string, start: number, end: number) => {
    const before = code.slice(0, start)
    const after = code.slice(end)
    return cleanSpacing(before + after)
  }

  const findMatchingBrace = (code: string, openIndex: number): number => {
    let depth = 0
    let inSingle = false
    let inDouble = false
    let inTemplate = false
    let inLineComment = false
    let inBlockComment = false

    for (let i = openIndex; i < code.length; i++) {
      const char = code[i]
      const prev = code[i - 1]

      if (inLineComment) {
        if (char === '\n') inLineComment = false
        continue
      }

      if (inBlockComment) {
        if (prev === '*' && char === '/') inBlockComment = false
        continue
      }

      if (!inSingle && !inDouble && !inTemplate) {
        if (char === '/' && code[i + 1] === '/') {
          inLineComment = true
          i++
          continue
        }
        if (char === '/' && code[i + 1] === '*') {
          inBlockComment = true
          i++
          continue
        }
      }

      if (!inLineComment && !inBlockComment) {
        if (!inDouble && !inTemplate && char === "'" && prev !== '\\') {
          inSingle = !inSingle
          continue
        }
        if (!inSingle && !inTemplate && char === '"' && prev !== '\\') {
          inDouble = !inDouble
          continue
        }
        if (!inSingle && !inDouble && char === '`' && prev !== '\\') {
          inTemplate = !inTemplate
          continue
        }
      }

      if (inSingle || inDouble || inTemplate) continue

      if (char === '{') depth++
      else if (char === '}') {
        depth--
        if (depth === 0) return i
      }
    }

    return -1
  }

  const findStatementEnd = (code: string, start: number): number => {
    let inSingle = false
    let inDouble = false
    let inTemplate = false
    let inLineComment = false
    let inBlockComment = false
    let brace = 0
    let paren = 0
    let bracket = 0

    for (let i = start; i < code.length; i++) {
      const char = code[i]
      const prev = code[i - 1]

      if (inLineComment) {
        if (char === '\n') {
          inLineComment = false
          if (brace === 0 && paren === 0 && bracket === 0) return i + 1
        }
        continue
      }

      if (inBlockComment) {
        if (prev === '*' && char === '/') inBlockComment = false
        continue
      }

      if (!inSingle && !inDouble && !inTemplate) {
        if (char === '/' && code[i + 1] === '/') {
          inLineComment = true
          i++
          continue
        }
        if (char === '/' && code[i + 1] === '*') {
          inBlockComment = true
          i++
          continue
        }
      }

      if (!inLineComment && !inBlockComment) {
        if (!inDouble && !inTemplate && char === "'" && prev !== '\\') {
          inSingle = !inSingle
          continue
        }
        if (!inSingle && !inTemplate && char === '"' && prev !== '\\') {
          inDouble = !inDouble
          continue
        }
        if (!inSingle && !inDouble && char === '`' && prev !== '\\') {
          inTemplate = !inTemplate
          continue
        }
      }

      if (inSingle || inDouble || inTemplate) continue

      switch (char) {
        case '{':
          brace++
          break
        case '}':
          if (brace > 0) brace--
          break
        case '(':
          paren++
          break
        case ')':
          if (paren > 0) paren--
          break
        case '[':
          bracket++
          break
        case ']':
          if (bracket > 0) bracket--
          break
        case ';':
          if (brace === 0 && paren === 0 && bracket === 0) return i + 1
          break
        default:
          break
      }
    }

    return code.length
  }

  // 1) export function METHOD() { ... }
  const functionPattern = new RegExp(
    `export\\s+(?:async\\s+)?function\\s+${upperMethod}\\b`,
  )
  const functionMatch = functionPattern.exec(updated)
  if (functionMatch) {
    const openBrace = updated.indexOf('{', functionMatch.index)
    if (openBrace === -1) {
      throw new Error(`Unable to locate block for ${upperMethod}`)
    }
    const closeBrace = findMatchingBrace(updated, openBrace)
    if (closeBrace === -1) {
      throw new Error(`Unable to locate closing brace for ${upperMethod}`)
    }
    let end = closeBrace + 1
    while (end < updated.length && /\s/.test(updated[end])) {
      end++
      if (updated[end - 1] === '\n' && updated[end] === '\n') {
        end++
        break
      }
    }
    updated = removeRange(updated, functionMatch.index, end)
    removed = true
  }

  // 2) export const METHOD = ...
  if (!removed) {
    const varPattern = new RegExp(
      `export\\s+(?:const|let|var)\\s+${upperMethod}\\b`,
    )
    const varMatch = varPattern.exec(updated)
    if (varMatch) {
      const end = findStatementEnd(updated, varMatch.index)
      updated = removeRange(updated, varMatch.index, end)
      removed = true
    }
  }

  // 3) export { METHOD, ... }
  if (!removed) {
    const exportPattern = /export\s*{([^}]+)}/g
    let match: RegExpExecArray | null
    while ((match = exportPattern.exec(updated))) {
      const full = match[0]
      const entries = match[1]
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)

      const filtered = entries.filter((entry) => {
        const [original, alias] = entry.split(/\s+as\s+/i).map((v) => v?.trim())
        const originalMatch = original?.toUpperCase() === upperMethod
        const aliasMatch = alias?.toUpperCase() === upperMethod
        return !(originalMatch || aliasMatch)
      })

      if (filtered.length !== entries.length) {
        if (!filtered.length) {
          updated = removeRange(updated, match.index, match.index + full.length)
        } else {
          const replacement = `export { ${filtered.join(', ')} }`
          updated =
            updated.slice(0, match.index) +
            replacement +
            updated.slice(match.index + full.length)
          updated = cleanSpacing(updated)
        }
        removed = true
        break
      }
    }
  }

  if (!removed) {
    throw new Error(`Method ${upperMethod} not found or could not be removed`)
  }

  await fs.writeFile(routeFilePath, updated, 'utf8')
}
