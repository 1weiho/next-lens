import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import chalk from 'chalk'
import { Command } from 'commander'

import { collectInspectorData } from '@/lib/inspector/data'
import { ensureDirectory, resolveTargetDirectory } from '@/lib/utils'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const primary = chalk.cyanBright
const accent = chalk.greenBright
const subtle = chalk.dim

const OUTPUT_DIR = '.next-lens'

export const webBuildCommand = new Command('web:build')
  .description('Build a static snapshot of the inspector UI')
  .argument(
    '[target-directory]',
    'Path to the Next.js project (defaults to the current working directory)',
  )
  .option(
    '-o, --output <path>',
    `Output directory for the static build (default: ${OUTPUT_DIR})`,
    OUTPUT_DIR,
  )
  .action(async (targetDirectory, options) => {
    try {
      const resolvedTarget = resolveTargetDirectory(targetDirectory ?? null)
      await ensureDirectory(resolvedTarget)

      const outputDir = path.resolve(resolvedTarget, options.output)

      printIntro({ target: resolvedTarget, output: outputDir })

      // Step 1: Collect inspector data
      console.log(subtle('\nCollecting route data...'))
      const data = await collectInspectorData({
        targetDirectory: resolvedTarget,
        readonly: true,
      })

      console.log(
        `${accent('✔')} Found ${data.routes.length} API routes and ${data.pages.length} page routes`,
      )

      // Step 2: Find inspector UI dist
      const inspectorUiDir = await findInspectorUiDir()
      if (!inspectorUiDir) {
        console.error(
          chalk.red(
            '\nError: Inspector UI not found. Please run `pnpm build:inspector` first.',
          ),
        )
        process.exit(1)
      }

      // Step 3: Create output directory
      console.log(subtle('\nPreparing output directory...'))
      await fs.rm(outputDir, { recursive: true, force: true })
      await fs.mkdir(outputDir, { recursive: true })

      // Step 4: Copy inspector UI to output
      console.log(subtle('Copying inspector UI...'))
      await copyDir(inspectorUiDir, outputDir)
      console.log(`${accent('✔')} Inspector UI copied`)

      // Step 5: Write inspector data JSON
      console.log(subtle('Writing route data...'))
      const dataPath = path.join(outputDir, 'inspector-data.json')
      await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8')
      console.log(`${accent('✔')} Data written to inspector-data.json`)

      printSuccess({ output: outputDir, data })
    } catch (error: unknown) {
      printError(error)
      process.exit(1)
    }
  })

export default webBuildCommand

/**
 * Find the inspector UI directory from the bundled package
 */
async function findInspectorUiDir(): Promise<string | null> {
  // After tsup bundles everything into dist/index.js, __dirname points to dist/
  // So inspector-ui is in the same directory
  const bundledPath = path.resolve(__dirname, 'inspector-ui')

  try {
    await fs.access(bundledPath)
    return bundledPath
  } catch {
    // Fallback: try relative to current file location (for development)
    const devPath = path.resolve(__dirname, '../../inspector-ui')
    try {
      await fs.access(devPath)
      return devPath
    } catch {
      return null
    }
  }
}

/**
 * Recursively copy a directory
 */
async function copyDir(src: string, dest: string): Promise<void> {
  const entries = await fs.readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true })
      await copyDir(srcPath, destPath)
    } else {
      await fs.copyFile(srcPath, destPath)
    }
  }
}

type IntroOptions = {
  target: string
  output: string
}

function printIntro({ target, output }: IntroOptions) {
  const divider = chalk.dim('─'.repeat(70))
  const badge = chalk.bgCyan.black(' NEXT LENS ')

  console.log(
    [
      '',
      divider,
      `${badge} ${primary.bold('Static Inspector Build')}`,
      subtle('Generate a readonly snapshot of your project routes.'),
      divider,
      '',
      formatRow('Target', target),
      formatRow('Output', output),
      divider,
    ].join('\n'),
  )
}

function formatRow(label: string, value: string): string {
  return `${accent('›')} ${subtle(label.padEnd(6))} ${chalk.white(value)}`
}

type SuccessOptions = {
  output: string
  data: { routes: unknown[]; pages: unknown[] }
}

function printSuccess({ output, data }: SuccessOptions) {
  const divider = chalk.dim('─'.repeat(70))

  console.log(
    [
      '',
      divider,
      chalk.green.bold('✔ Build complete!'),
      '',
      `${subtle('API Routes:')}  ${chalk.white(data.routes.length)}`,
      `${subtle('Page Routes:')} ${chalk.white(data.pages.length)}`,
      '',
      `${subtle('Output:')} ${accent(output)}`,
      '',
      subtle('Serve this directory with any static file server:'),
      chalk.white(`npx serve ${path.basename(output)}`),
      divider,
      '',
    ].join('\n'),
  )
}

function printError(error: unknown) {
  const badge = chalk.bgRed.black(' ERROR ')
  console.error(
    [
      '',
      `${badge} ${chalk.red('Failed to build static inspector.')}`,
      '',
      subtle((error as Error).message),
      '',
    ].join('\n'),
  )
}
