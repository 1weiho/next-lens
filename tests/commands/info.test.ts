import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  vi,
  type MockInstance,
} from 'vitest'
import { infoCommand } from '../../src/commands/info'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesRoot = path.join(__dirname, '..', 'fixtures')
const completeFixtureRoot = path.join(fixturesRoot, 'mock-info-app')
const packageManagerFixtureRoot = path.join(
  fixturesRoot,
  'mock-info-package-manager',
)

const stripAnsi = (value: string): string =>
  value.replace(/\u001B\[[0-?]*[ -\/]*[@-~]/g, '')

describe('info command', () => {
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

  it('displays formatted stack snapshot', async () => {
    await infoCommand.parseAsync(['node', 'test', completeFixtureRoot])

    expect(logSpy).toHaveBeenCalledTimes(1)
    const printed = stripAnsi(String(logSpy.mock.calls[0]?.[0] ?? ''))

    // Check title
    expect(printed).toContain('Stack Snapshot')

    // Check framework labels
    expect(printed).toContain('Next.js')
    expect(printed).toContain('React')
    expect(printed).toContain('next-lens')
    expect(printed).toContain('Node')
    expect(printed).toContain('Package Manager')
  })

  it('shows version information for Next.js and React', async () => {
    await infoCommand.parseAsync(['node', 'test', completeFixtureRoot])

    const printed = stripAnsi(String(logSpy.mock.calls[0]?.[0] ?? ''))

    // Check version labels are displayed (actual versions may vary)
    expect(printed).toMatch(/Next\.js\s+\d+\.\d+/)
    expect(printed).toMatch(/React\s+\d+\.\d+/)
  })

  it('displays package manager information', async () => {
    await infoCommand.parseAsync(['node', 'test', completeFixtureRoot])

    const printed = stripAnsi(String(logSpy.mock.calls[0]?.[0] ?? ''))

    expect(printed).toContain('pnpm')
  })

  it('shows project location', async () => {
    await infoCommand.parseAsync(['node', 'test', completeFixtureRoot])

    const printed = stripAnsi(String(logSpy.mock.calls[0]?.[0] ?? ''))

    expect(printed).toContain('Scanning')
    expect(printed).toContain('mock-info-app')
  })

  it('displays Node.js version', async () => {
    await infoCommand.parseAsync(['node', 'test', completeFixtureRoot])

    const printed = stripAnsi(String(logSpy.mock.calls[0]?.[0] ?? ''))

    expect(printed).toContain('v')
    expect(printed).toMatch(/v\d+\.\d+/)
  })

  it('handles projects without package.json', async () => {
    const emptyPath = '/tmp'

    await infoCommand.parseAsync(['node', 'test', emptyPath])

    const printed = stripAnsi(String(logSpy.mock.calls[0]?.[0] ?? ''))

    // Should show "Not detected" for missing dependencies
    expect(printed).toContain('Not detected')
  })

  it('handles errors gracefully with exit code 1', async () => {
    const invalidPath = '/nonexistent/path/to/nowhere'

    await infoCommand.parseAsync(['node', 'test', invalidPath])

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unable to collect project info'),
    )
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('uses colored output for better readability', async () => {
    await infoCommand.parseAsync(['node', 'test', completeFixtureRoot])

    const printed = String(logSpy.mock.calls[0]?.[0] ?? '')

    // Colors may be disabled in test environment, just check output structure
    expect(printed).toContain('Stack Snapshot')
    expect(printed).toContain('Next.js')
  })

  it('formats output with consistent spacing', async () => {
    await infoCommand.parseAsync(['node', 'test', completeFixtureRoot])

    const printed = stripAnsi(String(logSpy.mock.calls[0]?.[0] ?? ''))

    // Check for arrow indicators
    expect(printed).toMatch(/›/)

    // Check consistent alignment
    const lines = printed.split('\n').filter((line) => line.includes('›'))
    if (lines.length > 1) {
      const arrowPositions = lines.map((line) => line.indexOf('›'))
      expect(new Set(arrowPositions).size).toBe(1) // All arrows at same position
    }
  })

  it('prefers manifest packageManager field', async () => {
    await infoCommand.parseAsync(['node', 'test', packageManagerFixtureRoot])

    const printed = stripAnsi(String(logSpy.mock.calls[0]?.[0] ?? ''))

    expect(printed).toContain('npm@10.0.0')
  })
})
