import chalk from 'chalk'
import { Command } from 'commander'
import open from 'open'

import { startInspectorServer } from '@/lib/inspector/server'
import { ensureDirectory, resolveTargetDirectory } from '@/lib/utils'

const DEFAULT_PORT = 9453
const DEFAULT_VITE_PORT = 5173

const primary = chalk.cyanBright
const accent = chalk.greenBright
const subtle = chalk.dim
const warning = chalk.yellow

export const inspectorCommand = new Command('inspector')
  .description('Launch the web-based route inspector UI')
  .argument(
    '[target-directory]',
    'Path to the Next.js project (defaults to the current working directory)',
  )
  .option(
    '-p, --port <port>',
    'Port to run the inspector on',
    String(DEFAULT_PORT),
  )
  .option('--no-open', 'Do not automatically open the browser')
  .option(
    '--dev',
    'Development mode: proxy UI requests to Vite dev server for HMR',
  )
  .option(
    '--vite-port <port>',
    'Vite dev server port (used with --dev)',
    String(DEFAULT_VITE_PORT),
  )
  .action(async (targetDirectory, options) => {
    try {
      const resolvedTarget = resolveTargetDirectory(targetDirectory ?? null)
      await ensureDirectory(resolvedTarget)

      const port = parseInt(options.port, 10)
      if (isNaN(port) || port < 1 || port > 65535) {
        console.error(chalk.red('Invalid port number'))
        process.exit(1)
      }

      const devMode = options.dev === true
      const vitePort = parseInt(options.vitePort, 10)

      if (devMode && (isNaN(vitePort) || vitePort < 1 || vitePort > 65535)) {
        console.error(chalk.red('Invalid Vite port number'))
        process.exit(1)
      }

      printIntro({
        target: resolvedTarget,
        port,
        devMode,
        vitePort,
      })

      await startInspectorServer({
        targetDirectory: resolvedTarget,
        port,
        devMode,
        vitePort,
      })

      const url = `http://localhost:${port}`

      if (options.open !== false) {
        await open(url)
      }

      printReady({
        url,
        devMode,
        vitePort,
      })
    } catch (error) {
      console.error(
        chalk.red(`Failed to start inspector: ${(error as Error).message}`),
      )
      process.exit(1)
    }
  })

export default inspectorCommand

type IntroOptions = {
  target: string
  port: number
  devMode: boolean
  vitePort: number
}

function printIntro({ target, port, devMode, vitePort }: IntroOptions) {
  const divider = chalk.dim('─'.repeat(46))
  const badge = chalk.bgCyan.black(' NEXT LENS INSPECTOR ')
  const rows = [
    formatRow('Target', target),
    formatRow('UI Port', `${port}`),
    devMode ? formatRow('Vite Port', `localhost:${vitePort}`) : null,
    devMode ? formatRow('Mode', warning('Dev proxy → Vite')) : null,
  ].filter(Boolean) as string[]

  console.log(
    [
      '',
      divider,
      `${badge} ${primary.bold('for Next.js')}`,
      subtle('Manage every route from a single UI.'),
      divider,
      ...rows,
      divider,
      subtle('Starting inspector...'),
    ].join('\n'),
  )
}

type ReadyOptions = {
  url: string
  devMode: boolean
  vitePort: number
}

function printReady({ url, devMode, vitePort }: ReadyOptions) {
  const items = [
    `${accent('•')} UI     ${accent(url)}`,
    devMode
      ? `${accent('•')} Vite   ${accent(`http://localhost:${vitePort}`)}`
      : null,
    subtle('Press Ctrl+C to stop'),
  ].filter(Boolean) as string[]

  console.log(['', primary.bold('Live'), ...items, ''].join('\n'))
}

function formatRow(label: string, value: string): string {
  const padded = label.padEnd(9)
  return `${accent('›')} ${subtle(padded)} ${chalk.white(value)}`
}
