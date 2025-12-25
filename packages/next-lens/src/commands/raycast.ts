import chalk from 'chalk'
import { Command } from 'commander'

import { chooseAvailablePort } from '@/lib/inspector/port'
import { startInspectorServer } from '@/lib/inspector/server'
import { ensureDirectory, resolveTargetDirectory } from '@/lib/utils'

const DEFAULT_PORT = 9453

const primary = chalk.cyanBright
const accent = chalk.greenBright
const subtle = chalk.dim

export const raycastCommand = new Command('raycast')
  .description(
    'Launch the inspector API server for Raycast (no UI, absolute paths)',
  )
  .argument(
    '[target-directory]',
    'Path to the Next.js project (defaults to the current working directory)',
  )
  .option(
    '-p, --port <port>',
    'Port to run the API server on',
    String(DEFAULT_PORT),
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

      const { port, conflictPort } = await chooseAvailablePort(requestedPort)

      if (conflictPort) {
        printPortReassignment(conflictPort, port)
      }

      printIntro({
        target: resolvedTarget,
        port,
      })

      await startInspectorServer({
        targetDirectory: resolvedTarget,
        port,
        uiMode: 'none',
        pathFormatForLists: 'absolute',
      })

      printReady({ port })
    } catch (error: unknown) {
      printStartupError(error)
      process.exit(1)
    }
  })

export default raycastCommand

type IntroOptions = {
  target: string
  port: number
}

function printIntro({ target, port }: IntroOptions) {
  const divider = chalk.dim('─'.repeat(50))
  const badge = chalk.bgMagenta.black(' NEXT LENS RAYCAST ')

  console.log(
    [
      '',
      divider,
      `${badge} ${primary.bold('API Server')}`,
      divider,
      formatRow('Target', target),
      formatRow('Port', `${port}`),
      divider,
      subtle('Starting server...'),
    ].join('\n'),
  )
}

function printReady({ port }: { port: number }) {
  console.log(
    [
      '',
      accent(`http://localhost:${port}/api`),
      '',
      subtle('Press Ctrl+C to stop'),
      '',
    ].join('\n'),
  )
}

function formatRow(label: string, value: string): string {
  const padded = label.padEnd(7)
  return `${accent('›')} ${subtle(padded)} ${chalk.white(value)}`
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
      `${badge} ${chalk.red('Failed to start API server.')}`,
      subtle((error as Error).message),
      '',
    ].join('\n'),
  )
}
