import path from 'path'
import { describe, it, expect } from 'vitest'
import { collectInspectorData } from '../../src/lib/inspector/data'

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures/mock-next-app')

describe('collectInspectorData', () => {
  it('should collect routes and pages from a Next.js project', async () => {
    const data = await collectInspectorData({
      targetDirectory: FIXTURES_DIR,
      readonly: true,
    })

    expect(data.meta).toBeDefined()
    expect(data.meta.readonly).toBe(true)
    expect(data.meta.targetDirectory).toBe(FIXTURES_DIR)
    expect(data.meta.generatedAt).toBeDefined()

    // Should have routes
    expect(Array.isArray(data.routes)).toBe(true)
    expect(data.routes.length).toBeGreaterThan(0)

    // Should have pages
    expect(Array.isArray(data.pages)).toBe(true)
    expect(data.pages.length).toBeGreaterThan(0)
  })

  it('should mark readonly as false when not specified as readonly', async () => {
    const data = await collectInspectorData({
      targetDirectory: FIXTURES_DIR,
      readonly: false,
    })

    expect(data.meta.readonly).toBe(false)
  })

  it('should include expected route structure', async () => {
    const data = await collectInspectorData({
      targetDirectory: FIXTURES_DIR,
      readonly: true,
    })

    // Check that routes have the expected structure
    for (const route of data.routes) {
      expect(route).toHaveProperty('file')
      expect(route).toHaveProperty('methods')
      expect(route).toHaveProperty('path')
      expect(Array.isArray(route.methods)).toBe(true)
    }

    // Check that pages have the expected structure
    for (const page of data.pages) {
      expect(page).toHaveProperty('file')
      expect(page).toHaveProperty('path')
      expect(page).toHaveProperty('loading')
      expect(page).toHaveProperty('error')
    }
  })
})
