<img width="1147" height="718" alt="next-lens-2x" src="https://github.com/user-attachments/assets/030afec7-1d70-4a2e-a448-1f74c9890a42" />

# next-lens

`next-lens` is a CLI companion for developers building with the Next.js App Router. It scans your project for API route handlers and turns them into quick insights you can read right from the terminal, inspired by Laravel's artisan command.

## Features

- Lists every `app/**/page.{ts,tsx,js,jsx,mdx,...}` file and flags co-located or inherited `loading`/`error` entries.
- Lists every `app/api/**/route.{ts,tsx,js,jsx}` file in a table with colored HTTP methods.
- Highlights dynamic segments (e.g. `[id]`, `[[...slug]]`) so you can see route shapes at a glance.
- Shows information about the framework stack and package manager for any target directory.
- Works locally or against another project directory you point it to—no Next.js runtime required.

## Usage

Run commands from the root of a Next.js project, or pass a path to another project.

```bash
npx next-lens@latest [command] [target-directory]
```

## MCP integration

`next-lens` can also be exposed through the Model Context Protocol (MCP) so IDEs or AI copilots can invoke the same project insights programmatically. The flow is straightforward:

1. Register an MCP server entry (for example `next-lens`) in your MCP client config that points to the `mcp` subcommand.
2. When the client boots, it launches `npx next-lens@latest mcp`, which communicates over stdin/stdout and streams route metadata on demand.
3. Any MCP-aware tool can then send requests to that server to retrieve the same API, page, and version data available via the CLI.

Add the following minimal JSON snippet to your MCP client configuration:

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

### Available commands

| Command                                                | Description                                                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `next-lens about`                                      | Prints a one-page summary of what the tool does.                                                              |
| `next-lens api:list [target-directory] [-m, --method]` | Recursively finds App Router API route files and renders a table with detected HTTP handlers.                 |
| `next-lens page:list [target-directory]`               | Lists page routes and indicates whether `loading`/`error` UI files exist co-located or via ancestor segments. |
| `next-lens info [target-directory]`                    | Reports the installed versions of Next.js, React, Node, `next-lens`, and the detected package manager.        |

#### Example: list API routes

```bash
npx next-lens@latest api:list
```

You will see a table similar to:

```
Next.js API Route Info
Mapped 4 routes

| GET|POST | /api/users/:id     | app/api/users/[id]/route.ts  |
| GET      | /api/health        | app/api/health/route.ts      |
| POST     | /api/auth/login    | app/api/auth/login/route.ts  |
| DELETE   | /api/auth/logout   | app/api/auth/logout/route.ts |
```

HTTP methods are color-coded, and dynamic segments such as `:id` or `:slug*` are highlighted so you can spot optional and catch-all parameters quickly.

**Filter by HTTP method**

You can filter routes by HTTP method using the `--method` (or `-m`) option. The filter is case-insensitive:

```bash
# Show only POST routes
npx next-lens@latest api:list --method POST

# Case-insensitive (post, Post, POST all work)
npx next-lens@latest api:list --method get
npx next-lens@latest api:list -m delete

# Valid methods: GET, HEAD, OPTIONS, POST, PUT, PATCH, DELETE
```

#### Example: list page routes

```bash
npx next-lens@latest page:list
```

Sample output:

```
Next.js Page Route Info
Mapped 3 pages

| /          | ● loading  ○ error | app/page.tsx              |
| /blog      | ◐ loading  ● error | app/blog/page.ts          |
| /blog/:id  | ○ loading  ◐ error | app/blog/[id]/page.tsx    |

● co-located  ◐ inherited  ○ missing
```

Circular markers make it easy to see whether each segment ships with Suspense (`loading`) or error boundaries (`error`), and whether they are inherited from a parent segment.

#### Example: inspect framework versions

```bash
npx next-lens@latest info ~/workspaces/my-next-app
```

`next-lens` reads the `package.json` and lockfile (if present) to report the Next.js/React versions and which package manager the project uses.

## How it works

- Route discovery uses a recursive walk, skipping common output folders (`.next`, `dist`, `build`, etc.).
- It looks for files named `route` or `page` with supported extensions and derives the URL path by interpreting Next.js conventions, including dynamic, catch-all, and optional catch-all segments.
- While mapping pages, the CLI checks sibling `loading.*` and `error.*` files and walks up the segment tree so you can verify co-located and inherited boundary coverage in one scan.
- HTTP methods are inferred by parsing the route file AST with the TypeScript compiler API and collecting exported handler names (`GET`, `POST`, etc.).
- Project insights read `package.json`, check `node_modules/*/package.json` when available, and fall back to manifest versions if the dependency is not installed.

## Development

```bash
pnpm install
pnpm dev    # watch mode
pnpm build  # produce dist/ artifacts
pnpm format
```

### Inspector UI

To develop the inspector UI with HMR:

```bash
# Terminal 1: Start turbo dev
pnpm dev

# Terminal 2: Start inspector with --dev flag
node packages/next-lens/dist/index.js inspector --dev /path/to/nextjs/project
```

Open `http://localhost:9453` to see the inspector with HMR enabled.

## License

MIT © Yiwei Ho
