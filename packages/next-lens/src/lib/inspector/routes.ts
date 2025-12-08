import path from 'path'

import { Hono } from 'hono'

import { getApiRoutes } from '../api-routes'
import { getPageRoutes } from '../page-routes'
import {
  addHttpMethod,
  createErrorFile,
  createLoadingFile,
  deleteRouteFile,
  removeHttpMethod,
} from './file-operations'
import { openInIDE } from './ide'

/**
 * Create API router for the inspector
 */
export function createApiRouter(targetDirectory: string) {
  const api = new Hono()

  // GET /api/routes - List API routes
  api.get('/routes', async (c) => {
    try {
      const routes = await getApiRoutes(targetDirectory)
      return c.json(routes)
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500)
    }
  })

  // GET /api/pages - List page routes
  api.get('/pages', async (c) => {
    try {
      const pages = await getPageRoutes(targetDirectory)
      return c.json(pages)
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500)
    }
  })

  // DELETE /api/routes - Delete a route file
  api.delete('/routes', async (c) => {
    try {
      const { file } = await c.req.json<{ file: string }>()

      if (!file) {
        return c.json({ error: 'File path is required' }, 400)
      }

      const fullPath = path.resolve(targetDirectory, file)

      // Security: ensure path is within target directory
      if (!fullPath.startsWith(path.resolve(targetDirectory))) {
        return c.json({ error: 'Invalid file path' }, 403)
      }

      await deleteRouteFile(fullPath)
      return c.json({ success: true })
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500)
    }
  })

  // POST /api/routes/methods - Add HTTP method to route
  api.post('/routes/methods', async (c) => {
    try {
      const { file, method } = await c.req.json<{
        file: string
        method: string
      }>()

      if (!file || !method) {
        return c.json({ error: 'File and method are required' }, 400)
      }

      const fullPath = path.resolve(targetDirectory, file)

      if (!fullPath.startsWith(path.resolve(targetDirectory))) {
        return c.json({ error: 'Invalid file path' }, 403)
      }

      await addHttpMethod(fullPath, method)
      return c.json({ success: true })
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500)
    }
  })

  // DELETE /api/routes/methods - Remove an HTTP method from a route
  api.delete('/routes/methods', async (c) => {
    try {
      const { file, method } = await c.req.json<{
        file: string
        method: string
      }>()

      if (!file || !method) {
        return c.json({ error: 'File and method are required' }, 400)
      }

      const fullPath = path.resolve(targetDirectory, file)

      if (!fullPath.startsWith(path.resolve(targetDirectory))) {
        return c.json({ error: 'Invalid file path' }, 403)
      }

      await removeHttpMethod(fullPath, method)
      return c.json({ success: true })
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500)
    }
  })

  // POST /api/pages/loading - Create loading.tsx
  api.post('/pages/loading', async (c) => {
    try {
      const { file } = await c.req.json<{ file: string }>()

      if (!file) {
        return c.json({ error: 'File path is required' }, 400)
      }

      const fullPath = path.resolve(targetDirectory, file)

      if (!fullPath.startsWith(path.resolve(targetDirectory))) {
        return c.json({ error: 'Invalid file path' }, 403)
      }

      const created = await createLoadingFile(fullPath)
      const relativePath = path.relative(targetDirectory, created)
      return c.json({ success: true, file: relativePath })
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500)
    }
  })

  // POST /api/pages/error - Create error.tsx
  api.post('/pages/error', async (c) => {
    try {
      const { file } = await c.req.json<{ file: string }>()

      if (!file) {
        return c.json({ error: 'File path is required' }, 400)
      }

      const fullPath = path.resolve(targetDirectory, file)

      if (!fullPath.startsWith(path.resolve(targetDirectory))) {
        return c.json({ error: 'Invalid file path' }, 403)
      }

      const created = await createErrorFile(fullPath)
      const relativePath = path.relative(targetDirectory, created)
      return c.json({ success: true, file: relativePath })
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500)
    }
  })

  // POST /api/open-file - Open file in IDE
  api.post('/open-file', async (c) => {
    try {
      const { file, line } = await c.req.json<{ file: string; line?: number }>()

      if (!file) {
        return c.json({ error: 'File path is required' }, 400)
      }

      const fullPath = path.resolve(targetDirectory, file)

      if (!fullPath.startsWith(path.resolve(targetDirectory))) {
        return c.json({ error: 'Invalid file path' }, 403)
      }

      await openInIDE(fullPath, line)
      return c.json({ success: true })
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500)
    }
  })

  return api
}
