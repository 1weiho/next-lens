import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import chalk from 'chalk'
import { Command } from 'commander'

import packageJson from '../../package.json'

export type PackageJson = {
  name?: string
  version?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  packageManager?: string
}

export type ProjectInsights = {
  root: string
  manifest: PackageJson | null
  packageManager: string | null
  nextVersion: string | null
  reactVersion: string | null
}

const primary = chalk.cyanBright
const accent = chalk.green
const subtle = chalk.dim

export const infoCommand = new Command('info')
  .description('Display framework and runtime details for the current project.')
  .argument(
    '[target-directory]',
    'Path to the Next.js project (defaults to the current working directory)',
  )
  .action(async (targetDirectory) => {
    try {
      const insights = await collectInsights(targetDirectory ?? null)
      console.log('\n' + renderInsights(insights) + '\n')
    } catch (error) {
      console.error(
        chalk.red(
          `Unable to collect project info: ${(error as Error).message}`,
        ),
      )
      process.exit(1)
    }
  })

export async function collectInsights(targetDirectory: string | null) {
  const root = await resolveRoot(targetDirectory)
  const manifest = await readManifest(root)

  const [nextVersion, reactVersion] = manifest
    ? await Promise.all([
        resolveInstalledVersion(root, 'next', manifest),
        resolveInstalledVersion(root, 'react', manifest),
      ])
    : [null, null]

  return {
    root,
    manifest,
    packageManager: manifest
      ? await detectPackageManager(root, manifest)
      : null,
    nextVersion,
    reactVersion,
  } satisfies ProjectInsights
}

async function resolveRoot(targetDirectory: string | null) {
  const base = targetDirectory ? expandHome(targetDirectory) : process.cwd()
  const resolved = path.resolve(base)
  const stats = await fs
    .stat(resolved)
    .catch(() => Promise.reject(new Error(`Directory not found: ${resolved}`)))

  if (!stats.isDirectory()) {
    throw new Error(`Expected a directory but received: ${resolved}`)
  }

  return resolved
}

function expandHome(target: string): string {
  if (target === '~') return os.homedir()
  if (target.startsWith('~/')) {
    return path.join(os.homedir(), target.slice(2))
  }
  return target
}

async function readManifest(root: string): Promise<PackageJson | null> {
  const manifestPath = path.join(root, 'package.json')
  try {
    const contents = await fs.readFile(manifestPath, 'utf-8')
    return JSON.parse(contents) as PackageJson
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw new Error(
      `Failed to read package.json from ${manifestPath}: ${(error as Error).message}`,
    )
  }
}

async function resolveInstalledVersion(
  root: string,
  pkgName: string,
  manifest: PackageJson,
): Promise<string | null> {
  const manifestVersion = findManifestVersion(manifest, pkgName)
  const installedVersion = await readNodeModulesVersion(root, pkgName)

  return installedVersion ?? manifestVersion
}

function findManifestVersion(
  manifest: PackageJson,
  pkgName: string,
): string | null {
  const lookup =
    manifest.dependencies?.[pkgName] ??
    manifest.devDependencies?.[pkgName] ??
    manifest.peerDependencies?.[pkgName]

  return lookup ?? null
}

async function readNodeModulesVersion(
  root: string,
  pkgName: string,
): Promise<string | null> {
  const modulePath = path.join(
    root,
    'node_modules',
    ...pkgName.split('/'),
    'package.json',
  )

  try {
    const contents = await fs.readFile(modulePath, 'utf-8')
    const parsed = JSON.parse(contents) as { version?: string }
    return parsed.version ?? null
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw new Error(
      `Failed to inspect ${pkgName} package: ${(error as Error).message}`,
    )
  }
}

async function detectPackageManager(
  root: string,
  manifest: PackageJson,
): Promise<string | null> {
  if (manifest.packageManager) {
    return manifest.packageManager
  }

  const lockfile = await detectLockfile(root)
  if (!lockfile) return null

  return lockfileToLabel(lockfile)
}

async function detectLockfile(root: string): Promise<string | null> {
  const candidates = [
    'pnpm-lock.yaml',
    'yarn.lock',
    'package-lock.json',
    'bun.lockb',
    'npm-shrinkwrap.json',
  ]

  for (const lockfile of candidates) {
    const fullPath = path.join(root, lockfile)
    if (await fileExists(fullPath)) {
      return lockfile
    }
  }

  return null
}

async function fileExists(target: string): Promise<boolean> {
  try {
    const stats = await fs.stat(target)
    return stats.isFile()
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false
    }
    throw error
  }
}

function lockfileToLabel(lockfile: string): string {
  switch (lockfile) {
    case 'pnpm-lock.yaml':
      return 'pnpm (lockfile)'
    case 'yarn.lock':
      return 'yarn (lockfile)'
    case 'package-lock.json':
      return 'npm (lockfile)'
    case 'bun.lockb':
      return 'bun (lockfile)'
    case 'npm-shrinkwrap.json':
      return 'npm shrinkwrap'
    default:
      return lockfile
  }
}

function renderInsights({
  root,
  manifest,
  packageManager,
  nextVersion,
  reactVersion,
}: ProjectInsights): string {
  const rows = [
    {
      label: 'Next.js',
      value: presentVersion(nextVersion),
    },
    {
      label: 'React',
      value: presentVersion(reactVersion),
    },
    {
      label: 'next-lens',
      value: presentVersion(packageJson.version ?? null),
    },
    {
      label: 'Node',
      value: process.version.replace(/^v/, 'v'),
    },
    {
      label: 'Package Manager',
      value: packageManager ?? chalk.yellow('Not detected'),
    },
  ]

  const title = chalk.bold(primary('Stack Snapshot'))
  const locationLine = manifest
    ? subtle(`Scanning ${accent(path.basename(root) || root)}`)
    : chalk.yellow('package.json not found - limited insights')

  const labelWidth = Math.max(...rows.map((row) => row.label.length))

  const formattedRows = rows.map(({ label, value }) => {
    const padded = label.padEnd(labelWidth)
    return `${accent('›')} ${subtle(padded)}  ${value}`
  })

  return [title, locationLine, '', ...formattedRows].join('\n')
}

function presentVersion(version: string | null): string {
  if (!version) {
    return chalk.yellow('Not detected')
  }

  return chalk.white(version)
}

export default infoCommand
