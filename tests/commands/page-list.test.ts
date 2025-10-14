import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { listPageRoutes, type PageInfo } from '../../src/commands/page-list'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import os from 'os'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtureRoot = path.join(__dirname, '..', 'fixtures', 'mock-next-app')

const stripAnsi = (value: string): string =>
  value.replace(/\u001B\[[0-?]*[ -\/]*[@-~]/g, '')

describe('listPageRoutes', () => {
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  it('returns page metadata including fallback states for the mock app', async () => {
    const pages = await listPageRoutes(fixtureRoot)

    expect(pages).toStrictEqual<PageInfo[]>([
      {
        file: 'app/page.tsx',
        path: '/',
        loading: 'missing',
        error: 'missing',
      },
      {
        file: 'app/(group)/account/settings/page.tsx',
        path: '/account/settings',
        loading: 'inherited',
        error: 'inherited',
      },
      {
        file: 'app/blog/[slug]/page.tsx',
        path: '/blog/:slug',
        loading: 'inherited',
        error: 'inherited',
      },
      {
        file: 'app/docs/[...segments]/page.tsx',
        path: '/docs/:segments*',
        loading: 'co-located',
        error: 'co-located',
      },
      {
        file: 'app/guide/[[...section]]/page.tsx',
        path: '/guide/:section*?',
        loading: 'missing',
        error: 'missing',
      },
    ])

    expect(logSpy).toHaveBeenCalledTimes(1)
    const printed = stripAnsi(String(logSpy.mock.calls[0]?.[0] ?? ''))
    expect(printed).toContain('Next.js Page Route Info')
    expect(printed).toContain('/account/settings')
  })

  it('reports when a project has no page routes', async () => {
    const emptyRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'next-lens-page-empty-'),
    )

    try {
      const pages = await listPageRoutes(emptyRoot)
      expect(pages).toStrictEqual([])
    } finally {
      await fs.rm(emptyRoot, { recursive: true, force: true })
    }

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('No page routes found under'),
    )
  })
})
