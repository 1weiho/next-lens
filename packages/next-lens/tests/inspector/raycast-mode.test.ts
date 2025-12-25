import path from 'path'
import { fileURLToPath } from 'url'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { createApiRouter } from '@/lib/inspector/routes'
import { createInspectorApp } from '@/lib/inspector/server'
import * as fileOperations from '@/lib/inspector/file-operations'
import type { RouteInfo } from '@/lib/api-routes'
import type { PageInfo } from '@/lib/page-routes'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtureRoot = path.join(__dirname, '..', 'fixtures', 'mock-next-app')

describe('createApiRouter with absolute path format', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns absolute paths for GET /routes when pathFormatForLists is absolute', async () => {
    const api = createApiRouter(fixtureRoot, { pathFormatForLists: 'absolute' })

    const response = await api.request('/routes')
    expect(response.status).toBe(200)

    const routes = (await response.json()) as RouteInfo[]
    expect(routes.length).toBeGreaterThan(0)

    // All file paths should be absolute
    for (const route of routes) {
      expect(path.isAbsolute(route.file)).toBe(true)
      expect(route.file.startsWith(fixtureRoot)).toBe(true)
    }
  })

  it('returns absolute paths for GET /pages when pathFormatForLists is absolute', async () => {
    const api = createApiRouter(fixtureRoot, { pathFormatForLists: 'absolute' })

    const response = await api.request('/pages')
    expect(response.status).toBe(200)

    const pages = (await response.json()) as PageInfo[]
    expect(pages.length).toBeGreaterThan(0)

    // All file paths should be absolute
    for (const page of pages) {
      expect(path.isAbsolute(page.file)).toBe(true)
      expect(page.file.startsWith(fixtureRoot)).toBe(true)

      // loadingPath and errorPath should also be absolute if present
      if (page.loadingPath) {
        expect(path.isAbsolute(page.loadingPath)).toBe(true)
        expect(page.loadingPath.startsWith(fixtureRoot)).toBe(true)
      }
      if (page.errorPath) {
        expect(path.isAbsolute(page.errorPath)).toBe(true)
        expect(page.errorPath.startsWith(fixtureRoot)).toBe(true)
      }
    }
  })

  it('returns relative paths for GET /routes when pathFormatForLists is relative (default)', async () => {
    const api = createApiRouter(fixtureRoot)

    const response = await api.request('/routes')
    expect(response.status).toBe(200)

    const routes = (await response.json()) as RouteInfo[]
    expect(routes.length).toBeGreaterThan(0)

    // All file paths should be relative
    for (const route of routes) {
      expect(path.isAbsolute(route.file)).toBe(false)
    }
  })

  it('returns relative paths for GET /pages when pathFormatForLists is relative (default)', async () => {
    const api = createApiRouter(fixtureRoot)

    const response = await api.request('/pages')
    expect(response.status).toBe(200)

    const pages = (await response.json()) as PageInfo[]
    expect(pages.length).toBeGreaterThan(0)

    // All file paths should be relative
    for (const page of pages) {
      expect(path.isAbsolute(page.file)).toBe(false)
    }
  })

  it('mutation responses still use relative paths regardless of pathFormatForLists', async () => {
    const api = createApiRouter(fixtureRoot, { pathFormatForLists: 'absolute' })
    const jsonHeaders = { 'content-type': 'application/json' }

    // Mock createLoadingFile to return an absolute path
    const mockCreatedPath = path.join(fixtureRoot, 'app/blog/loading.tsx')
    vi.spyOn(fileOperations, 'createLoadingFile').mockResolvedValue(
      mockCreatedPath,
    )

    const response = await api.request('/pages/loading', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ file: 'app/blog/page.tsx' }),
    })

    expect(response.status).toBe(200)
    const result = (await response.json()) as { success: boolean; file: string }
    expect(result.success).toBe(true)

    // The returned file path should be relative (not affected by pathFormatForLists)
    expect(path.isAbsolute(result.file)).toBe(false)
    expect(result.file).toBe('app/blog/loading.tsx')
  })
})

describe('createInspectorApp with uiMode none', () => {
  it('returns 404 for root path when uiMode is none', async () => {
    const app = await createInspectorApp({
      targetDirectory: fixtureRoot,
      uiMode: 'none',
    })

    const response = await app.request('/')
    expect(response.status).toBe(404)
  })

  it('still serves API routes when uiMode is none', async () => {
    const app = await createInspectorApp({
      targetDirectory: fixtureRoot,
      uiMode: 'none',
    })

    const routesResponse = await app.request('/api/routes')
    expect(routesResponse.status).toBe(200)

    const pagesResponse = await app.request('/api/pages')
    expect(pagesResponse.status).toBe(200)
  })

  it('combines uiMode none with pathFormatForLists absolute', async () => {
    const app = await createInspectorApp({
      targetDirectory: fixtureRoot,
      uiMode: 'none',
      pathFormatForLists: 'absolute',
    })

    // UI should be disabled
    const rootResponse = await app.request('/')
    expect(rootResponse.status).toBe(404)

    // API should return absolute paths
    const routesResponse = await app.request('/api/routes')
    expect(routesResponse.status).toBe(200)
    const routes = (await routesResponse.json()) as RouteInfo[]
    expect(routes.length).toBeGreaterThan(0)
    for (const route of routes) {
      expect(path.isAbsolute(route.file)).toBe(true)
    }
  })
})
