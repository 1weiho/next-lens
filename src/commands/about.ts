import chalk from 'chalk'
import { Command } from 'commander'

const primary = chalk.cyanBright
const accent = chalk.green
const subtle = chalk.dim

const aboutLines = [
  chalk.bold(primary('next-lens')),
  subtle('Explore your Next.js App Router API handlers with clarity.'),
  '',
  chalk.bold('Why it helps'),
  `${accent('●')} Quickly list API routes with ${primary('next-lens api:list')}`,
  `${accent('●')} Review exported handlers without digging through files`,
  `${accent('●')} Stay in flow with a focused CLI experience`,
  '',
  subtle(
    `Crafted with ❤️  by \u001b]8;;https://x.com/1weiho\u001b\\Yiwei\u001b]8;;\u001b\\.`,
  ),
]

export const aboutCommand = new Command('about')
  .description('Show information about the next-lens CLI.')
  .action(() => {
    console.log('\n' + aboutLines.join('\n') + '\n')
  })

export default aboutCommand
