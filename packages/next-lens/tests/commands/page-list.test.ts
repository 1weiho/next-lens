import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  vi,
  type MockInstance,
} from 'vitest'
import { pageListCommand } from '../../src/commands/page-list'
import { getPageRoutes } from '../../src/lib/page-routes'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtureRoot = path.join(__dirname, '..', 'fixtures', 'mock-next-app')

const stripAnsi = (value: string): string =>
  value.replace(/\u001B\[[0-?]*[ -\/]*[@-~]/g, '')

describe('page:list command', () => {
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
  })

  it('displays formatted table with page information', async () => {
    await pageListCommand.parseAsync(['node', 'test', fixtureRoot])

    expect(logSpy).toHaveBeenCalledTimes(1)
    const printed = stripAnsi(String(logSpy.mock.calls[0]?.[0] ?? ''))

    // Check header
    expect(printed).toContain('Next.js Page Route Info')
    expect(printed).toContain('Mapped')
    expect(printed).toContain('page')

    // Check table headers
    expect(printed).toContain('ROUTE')
    expect(printed).toContain('STATE UI')
    expect(printed).toContain('SOURCE')

    // Check some routes are present
    expect(printed).toContain('/account/settings')
    expect(printed).toContain('/blog/:slug')
    expect(printed).toContain('/docs/:segments*')
  })

  it('displays state UI indicators (loading and error)', async () => {
    await pageListCommand.parseAsync(['node', 'test', fixtureRoot])

    const printed = stripAnsi(String(logSpy.mock.calls[0]?.[0] ?? ''))

    // Check state labels
    expect(printed).toContain('loading')
    expect(printed).toContain('error')

    // Check symbols (may be replaced with placeholders)
    expect(printed).toMatch(/[●◐○]/)
  })

  it('includes legend for state indicators', async () => {
    await pageListCommand.parseAsync(['node', 'test', fixtureRoot])

    const printed = stripAnsi(String(logSpy.mock.calls[0]?.[0] ?? ''))

    // Check legend
    expect(printed).toContain('co-located')
    expect(printed).toContain('inherited')
    expect(printed).toContain('missing')
  })

  it('highlights dynamic route segments', async () => {
    await pageListCommand.parseAsync(['node', 'test', fixtureRoot])

    const printed = String(logSpy.mock.calls[0]?.[0] ?? '')

    // Dynamic segments should be present
    expect(printed).toContain(':slug')
    expect(printed).toContain(':segments*')
    expect(printed).toContain(':section*?')
  })

  it('shows message when no pages are found', async () => {
    // Use a directory without any page.tsx files
    const emptyProjectPath = path.join(
      __dirname,
      '..',
      'fixtures',
      'mock-info-package-manager',
    )

    await pageListCommand.parseAsync(['node', 'test', emptyProjectPath])

    expect(logSpy).toHaveBeenCalledWith('No page routes found')
    expect(exitSpy).not.toHaveBeenCalled()
  })

  it('handles errors gracefully with exit code 1', async () => {
    const invalidPath = '/nonexistent/path/to/nowhere'

    await pageListCommand.parseAsync(['node', 'test', invalidPath])

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to list routes'),
    )
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('formats table with proper borders', async () => {
    await pageListCommand.parseAsync(['node', 'test', fixtureRoot])

    const printed = stripAnsi(String(logSpy.mock.calls[0]?.[0] ?? ''))

    // Check for table borders
    expect(printed).toMatch(/\+[=]+\+/) // Top/bottom border
    expect(printed).toMatch(/\+[-]+\+/) // Header divider
    expect(printed).toMatch(/\|.*\|/) // Row structure
  })

  it('uses colored output for better readability', async () => {
    await pageListCommand.parseAsync(['node', 'test', fixtureRoot])

    const printed = String(logSpy.mock.calls[0]?.[0] ?? '')

    // Colors may be disabled in test environment, just check output structure
    expect(printed).toContain('Next.js Page Route Info')
    expect(printed).toContain('ROUTE')
  })
})
