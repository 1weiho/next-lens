import { promises as fs } from 'fs'
import path from 'path'

import { HTTP_METHODS } from '../api-routes'

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

  const content = await fs.readFile(routeFilePath, 'utf8')

  // Check if method already exists
  const exportPattern = new RegExp(
    `\\bexport\\s+(?:async\\s+)?(?:function|const)\\s+${upperMethod}\\b`,
    'i',
  )
  if (exportPattern.test(content)) {
    throw new Error(`Method ${upperMethod} already exists`)
  }

  // Generate method template
  const template = `
export async function ${upperMethod}(request: Request) {
  // TODO: Implement ${upperMethod} handler
  return Response.json({ message: '${upperMethod} handler' })
}
`

  // Append to file
  await fs.appendFile(routeFilePath, template, 'utf8')
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
