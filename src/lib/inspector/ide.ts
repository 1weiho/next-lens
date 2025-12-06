import { exec } from 'child_process'
import { promisify } from 'util'

import open from 'open'

const execAsync = promisify(exec)

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

  const commands: Record<IDE, string> = {
    cursor: `cursor --goto "${filePath}${line ? `:${line}` : ''}"`,
    vscode: `code --goto "${filePath}${line ? `:${line}` : ''}"`,
    webstorm: `webstorm --line ${line || 1} "${filePath}"`,
    default: filePath,
  }

  const command = commands[ide]

  if (ide === 'default') {
    await open(filePath)
  } else {
    try {
      await execAsync(command)
    } catch {
      // Fallback to system default if IDE command fails
      await open(filePath)
    }
  }
}
