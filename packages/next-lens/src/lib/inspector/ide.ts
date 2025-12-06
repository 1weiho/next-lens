import { execFile } from 'child_process'
import { promisify } from 'util'

import open from 'open'

const execFileAsync = promisify(execFile)

type IDE = 'vscode' | 'cursor' | 'webstorm' | 'default'

/**
 * Detect the user's preferred IDE from environment variables
 */
export function detectIDE(): IDE {
  const editor = process.env.VISUAL || process.env.EDITOR || ''

  if (editor.includes('cursor')) return 'cursor'
  if (editor.includes('code')) return 'vscode'
  if (editor.includes('webstorm') || editor.includes('idea')) return 'webstorm'

  return 'default'
}

/**
 * Open a file in the user's IDE
 */
export async function openInIDE(
  filePath: string,
  line?: number,
): Promise<void> {
  const ide = detectIDE()

  const commands: Record<
    IDE,
    { command: string; args: string[] } | { command: null; args: [] }
  > = {
    cursor: {
      command: 'cursor',
      args: ['--goto', line ? `${filePath}:${line}` : filePath],
    },
    vscode: {
      command: 'code',
      args: ['--goto', line ? `${filePath}:${line}` : filePath],
    },
    webstorm: {
      command: 'webstorm',
      args: ['--line', String(line ?? 1), filePath],
    },
    default: { command: null, args: [] },
  }

  const command = commands[ide]

  if (ide === 'default' || command.command === null) {
    await open(filePath)
  } else {
    try {
      await execFileAsync(command.command, command.args)
    } catch {
      // Fallback to system default if IDE command fails
      await open(filePath)
    }
  }
}
