#!/usr/bin/env node

import { Command } from 'commander'

import aboutCommand from '@/commands/about'
import apiListCommand from '@/commands/api-list'
import infoCommand from '@/commands/info'
import routeListCommand from '@/commands/route-list'

import packageJson from '../package.json'

async function main() {
  const program = new Command()
    .name('next-lens')
    .description('Inspect and document Next.js App Router API handlers.')
    .version(
      packageJson.version || '1.0.0',
      '-v, --version',
      'display the version number',
    )

  program
    .addCommand(aboutCommand)
    .addCommand(apiListCommand)
    .addCommand(routeListCommand)
    .addCommand(infoCommand)

  await program.parseAsync(process.argv)
}

main().catch((error) => {
  console.error((error as Error).message)
  process.exit(1)
})
