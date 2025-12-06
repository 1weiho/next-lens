import chalk from 'chalk'
import { Command } from 'commander'
import open from 'open'

import { startInspectorServer } from '@/lib/inspector/server'
import { ensureDirectory, resolveTargetDirectory } from '@/lib/utils'

const DEFAULT_PORT = 9453
const DEFAULT_VITE_PORT = 5173

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

      console.log(chalk.cyanBright('Starting Next.js Route Inspector...'))
      console.log(chalk.dim(`Target: ${resolvedTarget}`))
      if (devMode) {
        console.log(
          chalk.yellow(`Dev mode: proxying UI to Vite at port ${vitePort}`),
        )
      }

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

      console.log(chalk.green(`Inspector available at ${url}`))
      console.log(chalk.dim('Press Ctrl+C to stop'))
    } catch (error) {
      console.error(
        chalk.red(`Failed to start inspector: ${(error as Error).message}`),
      )
      process.exit(1)
    }
  })

export default inspectorCommand
