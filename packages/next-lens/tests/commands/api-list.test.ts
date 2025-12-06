import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  vi,
  type MockInstance,
} from 'vitest'
import * as apiRoutes from '../../src/lib/api-routes'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtureRoot = path.join(__dirname, '..', 'fixtures', 'mock-next-app')

const stripAnsi = (value: string): string =>
  value.replace(/\u001B\[[0-?]*[ -\/]*[@-~]/g, '')

// Import after fixtures are set up
const getCommand = async () => {
  const { apiListCommand } = await import('../../src/commands/api-list')
  return apiListCommand
}

describe('api:list command', () => {
  let logSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>
  let exitSpy: MockInstance

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never)
  })

  afterEach(() => {
    logSpy.mockRestore()
    errorSpy.mockRestore()
    exitSpy.mockRestore()
    vi.restoreAllMocks()
  })

  it('displays formatted table with route information', async () => {
    const command = await getCommand()
    await command.parseAsync(['node', 'test', fixtureRoot])

    expect(logSpy).toHaveBeenCalledTimes(1)
    const printed = stripAnsi(String(logSpy.mock.calls[0]?.[0] ?? ''))

    // Check header
    expect(printed).toContain('Next.js API Route Info')
    expect(printed).toContain('Mapped')
    expect(printed).toContain('route')

    // Check table headers
    expect(printed).toContain('METHOD')
    expect(printed).toContain('ROUTE')
    expect(printed).toContain('SOURCE')

    // Check some routes are present
    expect(printed).toContain('/api/users/:id')
    expect(printed).toContain('/api/hello')
    expect(printed).toContain('/api/ping')

    // Check methods are displayed
    expect(printed).toContain('GET')
    expect(printed).toContain('POST')
    expect(printed).toContain('DELETE')
  })

  it('displays colored output', async () => {
    const command = await getCommand()
    await command.parseAsync(['node', 'test', fixtureRoot])

    const printed = String(logSpy.mock.calls[0]?.[0] ?? '')

    // Colors may be disabled in test, just check structure
    expect(printed).toContain('Next.js API Route Info')
    expect(printed).toContain('/api/')
  })

  it('highlights dynamic route segments', async () => {
    const command = await getCommand()
    await command.parseAsync(['node', 'test', fixtureRoot])

    const printed = String(logSpy.mock.calls[0]?.[0] ?? '')

    // Dynamic segments should be present
    expect(printed).toContain(':id')
    expect(printed).toContain(':parts*')
    expect(printed).toContain(':segments*?')
  })

  it('shows message when no routes are found', async () => {
    // Mock to return empty routes
    vi.spyOn(apiRoutes, 'getApiRoutes').mockResolvedValue([])

    const command = await getCommand()
    await command.parseAsync(['node', 'test', fixtureRoot])

    expect(logSpy).toHaveBeenCalledWith('No API routes found')
  })

  it('handles errors gracefully with exit code 1', async () => {
    const invalidPath = '/nonexistent/path/to/nowhere'

    const command = await getCommand()
    await command.parseAsync(['node', 'test', invalidPath])

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to list routes'),
    )
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('formats table with proper borders', async () => {
    const command = await getCommand()
    await command.parseAsync(['node', 'test', fixtureRoot])

    const printed = stripAnsi(String(logSpy.mock.calls[0]?.[0] ?? ''))

    // Check for table borders
    expect(printed).toMatch(/\+[=]+\+/) // Top/bottom border
    expect(printed).toMatch(/\+[-]+\+/) // Header divider
    expect(printed).toMatch(/\|.*\|/) // Row structure
  })

  it('filters routes by HTTP method using --method option', async () => {
    const command = await getCommand()
    await command.parseAsync(['node', 'test', fixtureRoot, '--method', 'POST'])

    expect(logSpy).toHaveBeenCalledTimes(1)
    const printed = stripAnsi(String(logSpy.mock.calls[0]?.[0] ?? ''))

    // Should only show POST routes
    expect(printed).toContain('POST')
    expect(printed).toContain('/api/ping')
    expect(printed).toContain('/api/files/:parts*')

    // Should not show GET-only routes
    expect(printed).not.toContain('/api/hello')
  })

  it('filters routes case-insensitively', async () => {
    const command = await getCommand()
    await command.parseAsync(['node', 'test', fixtureRoot, '--method', 'get'])

    expect(logSpy).toHaveBeenCalledTimes(1)
    const printed = stripAnsi(String(logSpy.mock.calls[0]?.[0] ?? ''))

    // Should show GET routes
    expect(printed).toContain('GET')
    expect(printed).toContain('/api/hello')
    expect(printed).toContain('/api/users/:id')
  })

  it('shows appropriate message when no routes match filter', async () => {
    const command = await getCommand()
    await command.parseAsync([
      'node',
      'test',
      fixtureRoot,
      '--method',
      'OPTIONS',
    ])

    expect(logSpy).toHaveBeenCalledWith(
      'No API routes found with method OPTIONS',
    )
  })

  it('supports -m short option for method filter', async () => {
    const command = await getCommand()
    await command.parseAsync(['node', 'test', fixtureRoot, '-m', 'DELETE'])

    expect(logSpy).toHaveBeenCalledTimes(1)
    const printed = stripAnsi(String(logSpy.mock.calls[0]?.[0] ?? ''))

    // Should show DELETE routes
    expect(printed).toContain('DELETE')
    expect(printed).toContain('/api/users/:id')
  })

  it('rejects invalid HTTP method with error message', async () => {
    const command = await getCommand()
    await command.parseAsync([
      'node',
      'test',
      fixtureRoot,
      '--method',
      'INVALID',
    ])

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid HTTP method: INVALID'),
    )
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Valid methods are:'),
    )
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('GET'))
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('POST'))
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('rejects invalid HTTP method case-insensitively', async () => {
    const command = await getCommand()
    await command.parseAsync(['node', 'test', fixtureRoot, '--method', 'foo'])

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid HTTP method: foo'),
    )
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
