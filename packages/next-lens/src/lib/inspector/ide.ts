import launchEditor from 'launch-editor'

/**
 * Open a file in the user's IDE
 *
 * Uses launch-editor which:
 * 1. Checks REACT_EDITOR environment variable
 * 2. Detects running editor processes (VS Code, Cursor, WebStorm, etc.)
 * 3. Falls back to VISUAL or EDITOR environment variables
 */
export function openInIDE(filePath: string, line?: number): void {
  const fileLocation = line ? `${filePath}:${line}` : filePath
  launchEditor(fileLocation)
}
