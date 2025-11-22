import chalk, { type ChalkInstance } from 'chalk'
import { Command } from 'commander'
import { getApiRoutes, type RouteInfo } from '../lib/api-routes'

const METHOD_COLORS: Record<string, ChalkInstance> = {
  GET: chalk.greenBright,
  HEAD: chalk.green,
  OPTIONS: chalk.cyan,
  POST: chalk.magentaBright,
  PUT: chalk.yellowBright,
  PATCH: chalk.blueBright,
  DELETE: chalk.redBright,
}

const ANSI_PATTERN = /\u001B\[[0-?]*[ -\/]*[@-~]/g
const PARAM_COLOR = chalk.hex('#ffae42')

const primary = chalk.cyanBright
const accent = chalk.green
const subtle = chalk.dim

export const apiListCommand = new Command('api:list')
  .description('List Next.js App Router API routes in a table view.')
  .argument(
    '[target-directory]',
    'Path to the Next.js project (defaults to the current working directory)',
  )
  .action(async (targetDirectory) => {
    try {
      const routes = await getApiRoutes(targetDirectory ?? null)

      if (!routes.length) {
        console.log(`No API routes found`)
        return
      }

      console.log(renderTable(routes))
    } catch (error) {
      console.error(`Failed to list routes: ${(error as Error).message}`)
      process.exit(1)
    }
  })

function renderTable(routes: RouteInfo[]): string {
  const total = routes.length
  const header = chalk.bold(primary('Next.js API Route Info'))
  const subtitle = subtle(
    `Mapped ${accent(total.toString())} route${total === 1 ? '' : 's'}`,
  )

  const formatted = routes.map((route) => ({
    methods: colorizeMethods(route.methods),
    path: highlightDynamicSegments(route.path),
    file: chalk.gray(route.file),
  }))

  const methodHeader = chalk.dim('METHOD')
  const pathHeader = chalk.dim('ROUTE')
  const fileHeader = chalk.dim('SOURCE')

  const columnWidths = [
    Math.max(
      visibleLength(methodHeader),
      ...formatted.map((entry) => visibleLength(entry.methods)),
    ),
    Math.max(
      visibleLength(pathHeader),
      ...formatted.map((entry) => visibleLength(entry.path)),
    ),
    Math.max(
      visibleLength(fileHeader),
      ...formatted.map((entry) => visibleLength(entry.file)),
    ),
  ]

  const topBorder = buildBorder(columnWidths, '=')
  const headerDivider = buildBorder(columnWidths, '-')

  const headerRow = buildRow(
    [methodHeader, pathHeader, fileHeader],
    columnWidths,
    chalk.dim,
  )

  const rows = formatted.map((entry) =>
    buildRow([entry.methods, entry.path, entry.file], columnWidths),
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
  ].join('\n')
}

function colorizeMethods(methods: string[]): string {
  const colored = methods.map((method) => {
    const painter = METHOD_COLORS[method] ?? chalk.whiteBright
    return painter.bold(method)
  })

  return colored.join(chalk.dim('|'))
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

export default apiListCommand
