import { describe, expect, it } from 'vitest'
import { getPageRoutes, type PageInfo } from '../../src/lib/page-routes'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import os from 'os'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtureRoot = path.join(__dirname, '..', 'fixtures', 'mock-next-app')

describe('getPageRoutes', () => {
  it('returns page metadata including fallback states for the mock app', async () => {
    const pages = await getPageRoutes(fixtureRoot)

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
  })

  it('returns empty array when no page routes are found', async () => {
    const emptyRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'next-lens-page-empty-'),
    )

    try {
      const pages = await getPageRoutes(emptyRoot)
      expect(pages).toStrictEqual([])
    } finally {
      await fs.rm(emptyRoot, { recursive: true, force: true })
    }
  })

  it('handles invalid directory path gracefully', async () => {
    await expect(
      getPageRoutes('/nonexistent/path/to/nowhere'),
    ).rejects.toThrow()
  })

  it('returns pages sorted by path then file', async () => {
    const pages = await getPageRoutes(fixtureRoot)

    // Verify pages are sorted by path
    for (let i = 0; i < pages.length - 1; i++) {
      expect(
        pages[i].path.localeCompare(pages[i + 1].path),
      ).toBeLessThanOrEqual(0)
    }
  })

  it('correctly transforms dynamic segments', async () => {
    const pages = await getPageRoutes(fixtureRoot)

    const dynamicPage = pages.find((p) => p.path.includes(':slug'))
    expect(dynamicPage?.path).toBe('/blog/:slug')

    const catchAllPage = pages.find((p) => p.path.includes(':segments*'))
    expect(catchAllPage?.path).toBe('/docs/:segments*')

    const optionalCatchAllPage = pages.find((p) =>
      p.path.includes(':section*?'),
    )
    expect(optionalCatchAllPage?.path).toBe('/guide/:section*?')
  })

  it('excludes route groups from path', async () => {
    const pages = await getPageRoutes(fixtureRoot)

    const groupedPage = pages.find((p) => p.file.includes('(group)'))
    expect(groupedPage?.path).toBe('/account/settings')
    expect(groupedPage?.path).not.toContain('(group)')
  })

  it('detects co-located loading and error files', async () => {
    const pages = await getPageRoutes(fixtureRoot)

    const docsPage = pages.find((p) => p.path === '/docs/:segments*')
    expect(docsPage?.loading).toBe('co-located')
    expect(docsPage?.error).toBe('co-located')
  })

  it('detects inherited loading and error files', async () => {
    const pages = await getPageRoutes(fixtureRoot)

    const blogPage = pages.find((p) => p.path === '/blog/:slug')
    expect(blogPage?.loading).toBe('inherited')
    expect(blogPage?.error).toBe('inherited')

    const accountPage = pages.find((p) => p.path === '/account/settings')
    expect(accountPage?.loading).toBe('inherited')
    expect(accountPage?.error).toBe('inherited')
  })

  it('detects missing loading and error files', async () => {
    const pages = await getPageRoutes(fixtureRoot)

    const rootPage = pages.find((p) => p.path === '/')
    expect(rootPage?.loading).toBe('missing')
    expect(rootPage?.error).toBe('missing')

    const guidePage = pages.find((p) => p.path === '/guide/:section*?')
    expect(guidePage?.loading).toBe('missing')
    expect(guidePage?.error).toBe('missing')
  })
})
