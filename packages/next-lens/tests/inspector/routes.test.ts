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
})
