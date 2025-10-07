# next-lens

`next-lens` is a CLI companion for developers building with the Next.js App Router. It scans your project for API route handlers and turns them into quick insights you can read right from the terminal.

## Features

- Lists every `app/api/**/route.{ts,tsx,js,jsx}` file in a table with colored HTTP methods.
- Highlights dynamic segments (e.g. `[id]`, `[[...slug]]`) so you can see route shapes at a glance.
- Shows information about the framework stack and package manager for any target directory.
- Works locally or against another project directory you point it to—no Next.js runtime required.

## Usage

Run commands from the root of a Next.js project, or pass a path to another project.

```bash
npx next-lens@latest [command] [target-directory]
```

### Available commands

| Command                                 | Description                                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `next-lens about`                       | Prints a one-page summary of what the tool does.                                                       |
| `next-lens api:list [target-directory]` | Recursively finds App Router API route files and renders a table with detected HTTP handlers.          |
| `next-lens info [target-directory]`     | Reports the installed versions of Next.js, React, Node, `next-lens`, and the detected package manager. |

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

#### Example: inspect framework versions

```bash
npx next-lens@latest info ~/workspaces/my-next-app
```

`next-lens` reads the `package.json` and lockfile (if present) to report the Next.js/React versions and which package manager the project uses.

## How it works

- Route discovery uses a recursive walk, skipping common output folders (`.next`, `dist`, `build`, etc.).
- It looks for files named `route` with supported extensions and derives the URL path by interpreting Next.js conventions, including dynamic, catch-all, and optional catch-all segments.
- HTTP methods are inferred by parsing the route file AST with the TypeScript compiler API and collecting exported handler names (`GET`, `POST`, etc.).
- Project insights read `package.json`, check `node_modules/*/package.json` when available, and fall back to manifest versions if the dependency is not installed.

## Development

```bash
pnpm install
pnpm dev    # watch mode via tsup
pnpm build  # produce dist/ artifacts
pnpm type:check
pnpm format
```

To test the CLI, run `pnpm dev` and `npm link` inside this repo, then execute `next-lens` from any project that uses the linked binary.

## License

MIT © Yiwei Ho
