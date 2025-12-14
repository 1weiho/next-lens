<img width="1489" height="780" alt="next-lens" src="https://github.com/user-attachments/assets/a4d9654d-0c14-488e-b29c-5f4302bf3f16" />

# next-lens

`next-lens` is a light CLI companion for the Next.js App Router. Scan any project and see API and page routes instantly in your terminal.

## What it does

- Lists `app/**/page.*` and shows whether `loading` / `error` is colocated or inherited.
- Scans `app/api/**/route.*` with colorized HTTP methods.
- Highlights dynamic, optional, and catch-all params so route shapes are obvious.
- Reports Next.js / React / Node versions and the package manager.
- Works on any target directory—no Next.js runtime needed.

## Quick start

Run in a Next.js project root, or pass another directory:

```bash
npx next-lens@latest [command] [target-directory]
```

### Commands

`[dir]` arguments are optional, they default to the current directory.

- `next-lens about` — one-page tool overview.
- `next-lens api:list [dir] [-m, --method]` — list API routes and detected HTTP handlers.
- `next-lens page:list [dir]` — list page routes and show `loading` / `error` coverage.
- `next-lens info [dir]` — show Next.js / React / Node / package manager versions.
- `next-lens web [dir]` — launch the inspector UI.

## MCP integration

Expose the same insights to IDEs or copilots via MCP:

```json
{
  "mcpServers": {
    "next-lens": {
      "command": "npx",
      "args": ["next-lens@latest", "mcp"]
    }
  }
}
```

## License

MIT © Yiwei Ho
