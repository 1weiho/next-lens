import { describe, expect, it } from 'vitest'
import { getApiRoutes, type RouteInfo } from '../../src/lib/api-routes'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import os from 'os'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtureRoot = path.join(__dirname, '..', 'fixtures', 'mock-next-app')

describe('getApiRoutes', () => {
  it('collects route metadata for the mock Next.js app', async () => {
    const routes = await getApiRoutes(fixtureRoot)

    expect(routes).toStrictEqual<RouteInfo[]>([
      {
        file: 'app/api/files/[...parts]/route.ts',
        methods: ['GET', 'POST'],
        path: '/api/files/:parts*',
      },
      {
        file: 'app/api/hello/route.ts',
        methods: ['GET'],
        path: '/api/hello',
      },
      {
        file: 'app/api/optional/[[...segments]]/route.ts',
        methods: ['HEAD'],
        path: '/api/optional/:segments*?',
      },
      {
        file: 'app/(marketing)/api/ping/route.ts',
        methods: ['POST'],
        path: '/api/ping',
      },
      {
        file: 'app/api/users/[id]/route.ts',
        methods: ['GET', 'PUT', 'PATCH', 'DELETE'],
        path: '/api/users/:id',
      },
    ])
  })

  it('returns empty array when no API routes are found', async () => {
    const emptyRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'next-lens-api-empty-'),
    )

    try {
      const routes = await getApiRoutes(emptyRoot)
      expect(routes).toStrictEqual([])
    } finally {
      await fs.rm(emptyRoot, { recursive: true, force: true })
    }
  })

  it('handles invalid directory path gracefully', async () => {
    await expect(getApiRoutes('/nonexistent/path/to/nowhere')).rejects.toThrow()
  })

  it('returns routes sorted by path then methods', async () => {
    const routes = await getApiRoutes(fixtureRoot)

    // Verify routes are sorted by path
    for (let i = 0; i < routes.length - 1; i++) {
      expect(
        routes[i].path.localeCompare(routes[i + 1].path),
      ).toBeLessThanOrEqual(0)
    }
  })

  it('correctly transforms dynamic segments', async () => {
    const routes = await getApiRoutes(fixtureRoot)

    const dynamicRoute = routes.find((r) => r.path.includes(':id'))
    expect(dynamicRoute?.path).toBe('/api/users/:id')

    const catchAllRoute = routes.find((r) => r.path.includes(':parts*'))
    expect(catchAllRoute?.path).toBe('/api/files/:parts*')

    const optionalCatchAllRoute = routes.find((r) =>
      r.path.includes(':segments*?'),
    )
    expect(optionalCatchAllRoute?.path).toBe('/api/optional/:segments*?')
  })

  it('excludes route groups from path', async () => {
    const routes = await getApiRoutes(fixtureRoot)

    const marketingRoute = routes.find((r) => r.file.includes('(marketing)'))
    expect(marketingRoute?.path).toBe('/api/ping')
    expect(marketingRoute?.path).not.toContain('(marketing)')
  })

  it('filters routes by HTTP method', async () => {
    const routes = await getApiRoutes(fixtureRoot, 'GET')

    // Should only return routes that have GET method
    expect(routes).toStrictEqual<RouteInfo[]>([
      {
        file: 'app/api/files/[...parts]/route.ts',
        methods: ['GET'],
        path: '/api/files/:parts*',
      },
      {
        file: 'app/api/hello/route.ts',
        methods: ['GET'],
        path: '/api/hello',
      },
      {
        file: 'app/api/users/[id]/route.ts',
        methods: ['GET'],
        path: '/api/users/:id',
      },
    ])
  })

  it('filters routes by HTTP method case-insensitively', async () => {
    const routesUpperCase = await getApiRoutes(fixtureRoot, 'POST')
    const routesLowerCase = await getApiRoutes(fixtureRoot, 'post')
    const routesMixedCase = await getApiRoutes(fixtureRoot, 'Post')

    // All should return the same results
    expect(routesUpperCase).toStrictEqual(routesLowerCase)
    expect(routesUpperCase).toStrictEqual(routesMixedCase)

    expect(routesUpperCase).toStrictEqual<RouteInfo[]>([
      {
        file: 'app/api/files/[...parts]/route.ts',
        methods: ['POST'],
        path: '/api/files/:parts*',
      },
      {
        file: 'app/(marketing)/api/ping/route.ts',
        methods: ['POST'],
        path: '/api/ping',
      },
    ])
  })

  it('returns empty array when no routes match the filter', async () => {
    const routes = await getApiRoutes(fixtureRoot, 'OPTIONS')

    expect(routes).toStrictEqual([])
  })

  it('returns all routes when no filter is provided', async () => {
    const routesWithoutFilter = await getApiRoutes(fixtureRoot)
    const routesWithUndefined = await getApiRoutes(fixtureRoot, undefined)

    expect(routesWithoutFilter).toStrictEqual(routesWithUndefined)
    expect(routesWithoutFilter.length).toBeGreaterThan(0)
  })
})
