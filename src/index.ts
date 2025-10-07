#!/usr/bin/env node

import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';

async function main() {
  const rl = createInterface({ input, output });
  output.write('Welcome to next-lens CLI!\n');

  const projectName =
    (await rl.question('Enter project name (default: my-next-app): ')).trim() || 'my-next-app';

  output.write(`Building Next.js project skeleton for ${projectName}...\n`);

  // TODO: add actual project scaffolding logic here

  output.write('Done!\n');
  await rl.close();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exitCode = 1;
});

