import chalk from 'chalk'
import { Command } from 'commander'

const primary = chalk.cyanBright
const subtle = chalk.dim
const bullet = chalk.green('●')

const aboutLines = [
  chalk.bold(primary('next-lens')),
  subtle('Explore your Next.js App Router API handlers with clarity.'),
  '',
  chalk.bold('Why it helps'),
  `${bullet} Quickly list API routes with ${primary('next-lens api:list')}`,
  `${bullet} Review exported handlers without digging through files`,
  `${bullet} Stay in flow with a focused CLI experience`,
  '',
  subtle('Crafted for curious Next.js developers.'),
]

export const aboutCommand = new Command('about')
  .description('Show information about the next-lens CLI.')
  .action(() => {
    console.log('\n' + aboutLines.join('\n') + '\n')
  })

export default aboutCommand
