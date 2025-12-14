import path from 'path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { createApiRouter } from '@/lib/inspector/routes'
import * as fileOperations from '@/lib/inspector/file-operations'

describe('inspector route path validation', () => {
  const targetDirectory = path.join(process.cwd(), 'fixtures/app')
  const api = createApiRouter(targetDirectory)
  const jsonHeaders = { 'content-type': 'application/json' }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects paths outside the target directory', async () => {
    const deletePageSpy = vi
      .spyOn(fileOperations, 'deletePageFile')
      .mockResolvedValue()

    const response = await api.request('/pages', {
      method: 'DELETE',
      headers: jsonHeaders,
      body: JSON.stringify({ file: '../app-copy/route.ts' }),
    })

    expect(response.status).toBe(403)
    expect(deletePageSpy).not.toHaveBeenCalled()
  })

  it('allows paths inside the target directory', async () => {
    const deletePageSpy = vi
      .spyOn(fileOperations, 'deletePageFile')
      .mockResolvedValue()

    const relativePath = 'app/api/route.ts'
    const response = await api.request('/pages', {
      method: 'DELETE',
      headers: jsonHeaders,
      body: JSON.stringify({ file: relativePath }),
    })

    expect(response.status).toBe(200)
    expect(deletePageSpy).toHaveBeenCalledWith(
      path.resolve(targetDirectory, relativePath),
    )
  })

  it('returns 409 when loading file already exists', async () => {
    const createLoadingSpy = vi
      .spyOn(fileOperations, 'createLoadingFile')
      .mockRejectedValue(
        new fileOperations.FileExistsError('/app/blog/loading.tsx'),
      )

    const response = await api.request('/pages/loading', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ file: 'app/blog/page.tsx' }),
    })

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: 'File already exists at /app/blog/loading.tsx',
    })
    expect(createLoadingSpy).toHaveBeenCalled()
  })

  it('returns 409 when error file already exists', async () => {
    const createErrorSpy = vi
      .spyOn(fileOperations, 'createErrorFile')
      .mockRejectedValue(
        new fileOperations.FileExistsError('/app/docs/error.tsx'),
      )

    const response = await api.request('/pages/error', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ file: 'app/docs/page.tsx' }),
    })

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: 'File already exists at /app/docs/error.tsx',
    })
    expect(createErrorSpy).toHaveBeenCalled()
  })
})
