import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { createApiRouter } from './routes'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export interface InspectorServerOptions {
  targetDirectory: string
  port: number
}

/**
 * Find the inspector UI directory
 * In production: dist/inspector-ui (relative to dist/index.js after bundling)
 */
async function findStaticDir(): Promise<string | null> {
  // After tsup bundles everything into dist/index.js, __dirname points to dist/
  // So inspector-ui is in the same directory
  const bundledPath = path.resolve(__dirname, 'inspector-ui')

  try {
    await fs.access(bundledPath)
    return bundledPath
  } catch {
    // Fallback: try relative to current file location (for development)
    const devPath = path.resolve(__dirname, '../../inspector-ui')
    try {
      await fs.access(devPath)
      return devPath
    } catch {
      return null
    }
  }
}

/**
 * Start the inspector HTTP server
 */
export async function startInspectorServer(
  options: InspectorServerOptions,
): Promise<void> {
  const { targetDirectory, port } = options

  const app = new Hono()

  // Enable CORS for development
  app.use('*', cors())

  // Mount API routes
  const api = createApiRouter(targetDirectory)
  app.route('/api', api)

  // Find and serve static files
  const staticDir = await findStaticDir()

  if (staticDir) {
    // Serve static files
    app.use(
      '/*',
      serveStatic({
        root: staticDir,
        rewriteRequestPath: (p) => {
          // Remove leading slash for serveStatic
          return p.replace(/^\//, '')
        },
      }),
    )

    // SPA fallback - serve index.html for all non-API routes
    app.get('*', async (c) => {
      const indexPath = path.join(staticDir, 'index.html')
      try {
        const content = await fs.readFile(indexPath, 'utf8')
        return c.html(content)
      } catch {
        return c.text('Inspector UI not found', 404)
      }
    })
  } else {
    // Development mode: show message
    app.get('*', (c) => {
      return c.html(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Next.js Route Inspector</title>
            <style>
              body { font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px; }
              h1 { color: #333; }
              p { color: #666; line-height: 1.6; }
              code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
            </style>
          </head>
          <body>
            <h1>Next.js Route Inspector</h1>
            <p>The inspector UI is not built yet.</p>
            <p>To build the UI, run:</p>
            <p><code>pnpm build:inspector</code></p>
            <p>Or in development mode, run the Vite dev server separately:</p>
            <p><code>cd src/inspector && pnpm dev</code></p>
            <hr>
            <p>API endpoints are available at <code>/api/*</code></p>
          </body>
        </html>
      `)
    })
  }

  return new Promise<void>((resolve) => {
    serve(
      {
        fetch: app.fetch,
        port,
      },
      (info) => {
        console.log(`Inspector running at http://localhost:${info.port}`)
        resolve()
      },
    )
  })
}
