import { createServer } from 'node:net'

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

export const inspectorCommand = new Command('web')
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

      const requestedPort = parseInt(options.port, 10)
      if (isNaN(requestedPort) || requestedPort < 1 || requestedPort > 65535) {
        console.error(chalk.red('Invalid port number'))
        process.exit(1)
      }

      const devMode = options.dev === true
      const vitePort = parseInt(options.vitePort, 10)

      if (devMode && (isNaN(vitePort) || vitePort < 1 || vitePort > 65535)) {
        console.error(chalk.red('Invalid Vite port number'))
        process.exit(1)
      }

      const { port, conflictPort } = await chooseInspectorPort(requestedPort)

      if (conflictPort) {
        printPortReassignment(conflictPort, port)
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
    } catch (error: unknown) {
      printStartupError(error)
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

async function chooseInspectorPort(
  preferredPort: number,
): Promise<{ port: number; conflictPort: number | null }> {
  let port = preferredPort
  let conflictPort: number | null = null

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const available = await isPortAvailable(port)
    if (available) {
      return { port, conflictPort }
    }

    if (conflictPort === null) {
      conflictPort = port
    }

    port += 1
  }

  throw new Error(
    `Unable to find an open port starting at ${preferredPort}. Try --port <number>.`,
  )
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const server = createServer()

    server.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        resolve(false)
      } else {
        reject(error)
      }
    })

    server.once('listening', () => {
      server.close(() => resolve(true))
    })

    server.listen(port)
  })
}

function printPortReassignment(conflictPort: number, fallbackPort: number) {
  const badge = chalk.bgYellow.black(' PORT ')
  const message = chalk.yellow(
    `Port ${conflictPort} is busy. Switched to ${fallbackPort}.`,
  )

  console.log(
    [
      '',
      `${badge} ${message}`,
      subtle('Use --port <number> to pick a custom port.'),
      '',
    ].join('\n'),
  )
}

function printStartupError(error: unknown) {
  const err = error as NodeJS.ErrnoException
  const badge = chalk.bgRed.black(' ERROR ')

  if (err?.code === 'EADDRINUSE') {
    console.error(
      [
        '',
        `${badge} ${chalk.red('Port is already in use.')}`,
        subtle('Try another port with --port <number>.'),
        '',
      ].join('\n'),
    )
    return
  }

  console.error(
    [
      '',
      `${badge} ${chalk.red('Failed to start inspector.')}`,
      subtle((error as Error).message),
      '',
    ].join('\n'),
  )
}
