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

    expect(insights.root).toBe(path.resolve(completeFixtureRoot))
    expect(insights.manifest).toMatchObject({
      name: 'mock-info-app',
      version: '0.1.0',
      dependencies: {
        next: '14.2.3',
        react: '18.2.0',
      },
    })
    expect(insights.packageManager).toBe('pnpm (lockfile)')
    // Version may differ between manifest and installed, so just check they exist
    expect(insights.nextVersion).toBeTruthy()
    expect(insights.reactVersion).toBeTruthy()
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

  it('resolves versions from both manifest and node_modules', async () => {
    const insights = await collectInsights(completeFixtureRoot)

    expect(insights.nextVersion).toBeTruthy()
    expect(insights.reactVersion).toBeTruthy()
  })

  it('detects package manager from lockfile', async () => {
    const insights = await collectInsights(completeFixtureRoot)

    expect(insights.packageManager).toContain('pnpm')
  })

  it('handles nonexistent directory gracefully', async () => {
    await expect(
      collectInsights('/nonexistent/path/to/nowhere'),
    ).rejects.toThrow(/Directory not found/)
  })

  it('handles file instead of directory gracefully', async () => {
    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'next-lens-info-file-'),
    )
    const tempFile = path.join(tempDir, 'test.txt')
    await fs.writeFile(tempFile, 'test')

    try {
      await expect(collectInsights(tempFile)).rejects.toThrow(
        /Expected a directory/,
      )
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  })

  it('handles tilde expansion in target directory', async () => {
    const insights = await collectInsights('~')

    expect(insights.root).toBe(path.resolve(os.homedir()))
  })
})
