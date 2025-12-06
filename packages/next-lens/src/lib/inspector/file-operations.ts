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
