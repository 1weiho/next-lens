import { describe, expect, it } from 'vitest'
import {
  resolveTargetDirectory,
  expandHome,
  ensureDirectory,
  transformSegment,
  SKIP_DIRECTORIES,
} from '../../src/lib/utils'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

describe('resolveTargetDirectory', () => {
  it('returns current working directory when target is null', () => {
    const result = resolveTargetDirectory(null)
    expect(result).toBe(process.cwd())
  })

  it('expands home directory when target starts with ~', () => {
    const result = resolveTargetDirectory('~/test')
    expect(result).toBe(path.join(os.homedir(), 'test'))
  })

  it('returns absolute path as-is', () => {
    const result = resolveTargetDirectory('/absolute/path')
    expect(result).toBe('/absolute/path')
  })

  it('returns relative path as-is', () => {
    const result = resolveTargetDirectory('./relative/path')
    expect(result).toBe('./relative/path')
  })
})

describe('expandHome', () => {
  it('expands ~ to home directory', () => {
    const result = expandHome('~')
    expect(result).toBe(os.homedir())
  })

  it('expands ~/ to home directory path', () => {
    const result = expandHome('~/Documents')
    expect(result).toBe(path.join(os.homedir(), 'Documents'))
  })

  it('returns non-home paths as-is', () => {
    expect(expandHome('/absolute/path')).toBe('/absolute/path')
    expect(expandHome('./relative/path')).toBe('./relative/path')
    expect(expandHome('relative/path')).toBe('relative/path')
  })
})

describe('ensureDirectory', () => {
  it('resolves and verifies a valid directory', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'next-lens-utils-'))

    try {
      const result = await ensureDirectory(tempDir)
      expect(result).toBe(path.resolve(tempDir))
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  })

  it('throws error for nonexistent directory', async () => {
    await expect(ensureDirectory('/nonexistent/directory')).rejects.toThrow(
      /Cannot access/,
    )
  })

  it('throws error when target is a file', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'next-lens-utils-'))
    const tempFile = path.join(tempDir, 'test.txt')
    await fs.writeFile(tempFile, 'test')

    try {
      await expect(ensureDirectory(tempFile)).rejects.toThrow(
        /is not a directory/,
      )
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  })
})

describe('transformSegment', () => {
  it('transforms optional catch-all segments', () => {
    expect(transformSegment('[[...slug]]')).toBe(':slug*?')
    expect(transformSegment('[[...segments]]')).toBe(':segments*?')
  })

  it('transforms catch-all segments', () => {
    expect(transformSegment('[...slug]')).toBe(':slug*')
    expect(transformSegment('[...segments]')).toBe(':segments*')
  })

  it('transforms dynamic segments', () => {
    expect(transformSegment('[id]')).toBe(':id')
    expect(transformSegment('[slug]')).toBe(':slug')
  })

  it('returns static segments as-is', () => {
    expect(transformSegment('blog')).toBe('blog')
    expect(transformSegment('api')).toBe('api')
    expect(transformSegment('users')).toBe('users')
  })

  it('handles edge cases', () => {
    expect(transformSegment('')).toBe('')
    expect(transformSegment('(group)')).toBe('(group)')
  })
})

describe('SKIP_DIRECTORIES', () => {
  it('contains expected directories to skip', () => {
    expect(SKIP_DIRECTORIES.has('node_modules')).toBe(true)
    expect(SKIP_DIRECTORIES.has('.git')).toBe(true)
    expect(SKIP_DIRECTORIES.has('.next')).toBe(true)
    expect(SKIP_DIRECTORIES.has('dist')).toBe(true)
    expect(SKIP_DIRECTORIES.has('build')).toBe(true)
  })

  it('is a Set for efficient lookups', () => {
    expect(SKIP_DIRECTORIES).toBeInstanceOf(Set)
  })
})
