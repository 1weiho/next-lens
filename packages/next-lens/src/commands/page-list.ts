import chalk from 'chalk'
import { Command } from 'commander'
import { getPageRoutes, type PageInfo } from '../lib/page-routes'

type FallbackStatus = 'co-located' | 'inherited' | 'missing'

const ANSI_PATTERN = /\u001B\[[0-?]*[ -\/]*[@-~]/g
const PARAM_COLOR = chalk.hex('#ffae42')

const primary = chalk.cyanBright
const accent = chalk.green
const subtle = chalk.dim

export const pageListCommand = new Command('page:list')
  .description('List Next.js App Router page routes in a table view.')
  .argument(
    '[target-directory]',
    'Path to the Next.js project (defaults to the current working directory)',
  )
  .action(async (targetDirectory) => {
    try {
      const pages = await getPageRoutes(targetDirectory ?? null)

      if (!pages.length) {
        console.log(`No page routes found`)
        return
      }

      console.log(renderTable(pages))
    } catch (error) {
      console.error(`Failed to list routes: ${(error as Error).message}`)
      process.exit(1)
    }
  })

function renderTable(pages: PageInfo[]): string {
  const total = pages.length
  const header = chalk.bold(primary('Next.js Page Route Info'))
  const subtitle = subtle(
    `Mapped ${accent(total.toString())} page${total === 1 ? '' : 's'}`,
  )

  const formatted = pages.map((page) => ({
    path: highlightDynamicSegments(page.path),
    states: formatRouteStates(page.loading, page.error),
    file: chalk.gray(page.file),
  }))

  const pathHeader = chalk.dim('ROUTE')
  const statesHeader = chalk.dim('STATE UI')
  const fileHeader = chalk.dim('SOURCE')

  const columnWidths = [
    Math.max(
      visibleLength(pathHeader),
      ...formatted.map((entry) => visibleLength(entry.path)),
    ),
    Math.max(
      visibleLength(statesHeader),
      ...formatted.map((entry) => visibleLength(entry.states)),
    ),
    Math.max(
      visibleLength(fileHeader),
      ...formatted.map((entry) => visibleLength(entry.file)),
    ),
  ]

  const topBorder = buildBorder(columnWidths, '=')
  const headerDivider = buildBorder(columnWidths, '-')

  const headerRow = buildRow(
    [pathHeader, statesHeader, fileHeader],
    columnWidths,
    chalk.dim,
  )

  const rows = formatted.map((entry) =>
    buildRow([entry.path, entry.states, entry.file], columnWidths),
  )

  return [
    '',
    header,
    subtitle,
    '',
    chalk.dim(topBorder),
    headerRow,
    chalk.dim(headerDivider),
    ...rows,
    chalk.dim(topBorder),
    '',
    renderLegend(),
  ].join('\n')
}

function formatRouteStates(
  loadingStatus: FallbackStatus,
  errorStatus: FallbackStatus,
): string {
  const loadingLabel = formatStateLabel('loading', loadingStatus)
  const errorLabel = formatStateLabel('error', errorStatus)
  return `${loadingLabel}  ${errorLabel}`
}

function formatStateLabel(
  kind: 'loading' | 'error',
  status: FallbackStatus,
): string {
  const activeColor = kind === 'loading' ? accent : chalk.redBright
  const symbol = symbolForStatus(status, activeColor)
  const label = subtle(` ${kind}`)
  return `${symbol}${label}`
}

function symbolForStatus(
  status: FallbackStatus,
  activeColor: (text: string) => string,
): string {
  if (status === 'co-located') return activeColor('●')
  if (status === 'inherited') return activeColor('◐')
  return chalk.gray('○')
}

function highlightDynamicSegments(pathLabel: string): string {
  return pathLabel.replace(/:(\w+(?:\*\??)?)/g, (_, name) =>
    PARAM_COLOR(`:${name}`),
  )
}

function buildRow(
  cells: string[],
  widths: number[],
  transform: (value: string) => string = (value) => value,
): string {
  const padded = cells.map((cell, index) => padEndAnsi(cell, widths[index]))
  return transform(`| ${padded.join(' | ')} |`)
}

function buildBorder(widths: number[], fill: '-' | '=' = '-'): string {
  const segments = widths.map((width) => fill.repeat(width + 2))
  return `+${segments.join('+')}+`
}

function padEndAnsi(text: string, target: number): string {
  const printable = visibleLength(text)
  if (printable >= target) return text
  return text + ' '.repeat(target - printable)
}

function visibleLength(text: string): number {
  return text.replace(ANSI_PATTERN, '').length
}

function renderLegend(): string {
  const coLocated = chalk.whiteBright('● co-located')
  const inherited = chalk.whiteBright('◐ inherited')
  const missing = chalk.whiteBright('○ missing')
  return chalk.dim(`${coLocated}  ${inherited}  ${missing}`)
}

export default pageListCommand
