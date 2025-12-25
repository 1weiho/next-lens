import { createServer } from 'node:net'

/**
 * Check if a port is available for binding
 */
export function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const server = createServer()

    server.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        resolve(false)
      } else {
        reject(error)
      }
    })

    server.once('listening', () => {
      server.close(() => resolve(true))
    })

    server.listen(port)
  })
}

export interface ChoosePortResult {
  port: number
  conflictPort: number | null
}

/**
 * Find an available port starting from the preferred port.
 * Will try up to `maxAttempts` ports (default: 5) before throwing.
 */
export async function chooseAvailablePort(
  preferredPort: number,
  maxAttempts = 5,
): Promise<ChoosePortResult> {
  let port = preferredPort
  let conflictPort: number | null = null

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const available = await isPortAvailable(port)
    if (available) {
      return { port, conflictPort }
    }

    if (conflictPort === null) {
      conflictPort = port
    }

    port += 1
  }

  throw new Error(
    `Unable to find an open port starting at ${preferredPort}. Try --port <number>.`,
  )
}
