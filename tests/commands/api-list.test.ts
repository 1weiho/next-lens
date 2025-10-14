import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { listApiRoutes, type RouteInfo } from '../../src/commands/api-list'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import os from 'os'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtureRoot = path.join(__dirname, '..', 'fixtures', 'mock-next-app')

const stripAnsi = (value: string): string =>
  value.replace(/\u001B\[[0-?]*[ -\/]*[@-~]/g, '')

describe('listApiRoutes', () => {
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  it('collects route metadata for the mock Next.js app', async () => {
    const routes = await listApiRoutes(fixtureRoot)

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

    expect(logSpy).toHaveBeenCalledTimes(1)
    const printed = stripAnsi(String(logSpy.mock.calls[0]?.[0] ?? ''))
    expect(printed).toContain('Next.js API Route Info')
    expect(printed).toContain('/api/users/:id')
  })

  it('logs a helpful message when no API routes are found', async () => {
    const emptyRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'next-lens-api-empty-'),
    )

    try {
      const routes = await listApiRoutes(emptyRoot)
      expect(routes).toStrictEqual([])
    } finally {
      await fs.rm(emptyRoot, { recursive: true, force: true })
    }

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('No API routes found under'),
    )
  })
})
