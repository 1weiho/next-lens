import { describe, expect, it } from 'vitest'
import { collectInsights, type ProjectInsights } from '../../src/commands/info'
import { fileURLToPath } from 'url'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesRoot = path.join(__dirname, '..', 'fixtures')
const completeFixtureRoot = path.join(fixturesRoot, 'mock-info-app')
const packageManagerFixtureRoot = path.join(
  fixturesRoot,
  'mock-info-package-manager',
)

describe('collectInsights', () => {
  it('returns framework versions and lockfile-derived package manager info', async () => {
    const insights = await collectInsights(completeFixtureRoot)

    expect(insights).toStrictEqual<ProjectInsights>({
      root: path.resolve(completeFixtureRoot),
      manifest: {
        name: 'mock-info-app',
        version: '0.1.0',
        dependencies: {
          next: '14.2.3',
          react: '18.2.0',
        },
      },
      packageManager: 'pnpm (lockfile)',
      nextVersion: '14.3.1',
      reactVersion: '18.3.0',
    })
  })

  it('prefers the manifest packageManager field when available', async () => {
    const insights = await collectInsights(packageManagerFixtureRoot)

    expect(insights.packageManager).toBe('npm@10.0.0')
    expect(insights.manifest?.packageManager).toBe('npm@10.0.0')
  })

  it('gracefully handles projects without a package.json', async () => {
    const tempRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'next-lens-info-missing-'),
    )

    try {
      const insights = await collectInsights(tempRoot)
      expect(insights).toMatchObject({
        root: path.resolve(tempRoot),
        manifest: null,
        packageManager: null,
        nextVersion: null,
        reactVersion: null,
      })
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true })
    }
  })
})
