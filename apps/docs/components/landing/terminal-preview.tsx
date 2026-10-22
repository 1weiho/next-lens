import { Fragment } from 'react'

type Token = { text: string; className?: string }
type Cell = Token[]

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-400',
  POST: 'text-fuchsia-400',
  PUT: 'text-yellow-300',
  PATCH: 'text-sky-400',
  DELETE: 'text-red-400',
}

const DIM = 'text-zinc-500'
const PARAM = 'text-[#ffae42]'

const routes = [
  {
    methods: ['POST'],
    path: '/api/auth/login',
    file: 'app/api/auth/login/route.ts',
  },
  {
    methods: ['GET', 'POST'],
    path: '/api/posts',
    file: 'app/api/posts/route.ts',
  },
  {
    methods: ['GET', 'PATCH', 'DELETE'],
    path: '/api/posts/:postId',
    file: 'app/api/posts/[postId]/route.ts',
  },
  {
    methods: ['GET'],
    path: '/api/files/:parts*',
    file: 'app/api/files/[...parts]/route.ts',
  },
  { methods: ['GET'], path: '/api/search', file: 'app/api/search/route.ts' },
]

function methodsCell(methods: string[]): Cell {
  return methods.flatMap((method, index) => [
    ...(index > 0 ? [{ text: '|', className: DIM }] : []),
    { text: method, className: `font-bold ${METHOD_COLORS[method]}` },
  ])
}

function pathCell(path: string): Cell {
  return path
    .split(/(:\w+\*?)/)
    .filter(Boolean)
    .map((part) => ({
      text: part,
      className: part.startsWith(':') ? PARAM : 'text-zinc-100',
    }))
}

const header: Cell[] = [
  [{ text: 'METHOD', className: DIM }],
  [{ text: 'ROUTE', className: DIM }],
  [{ text: 'SOURCE', className: DIM }],
]

const rows: Cell[][] = routes.map((route) => [
  methodsCell(route.methods),
  pathCell(route.path),
  [{ text: route.file, className: 'text-zinc-500' }],
])

const cellLength = (cell: Cell) =>
  cell.reduce((total, token) => total + token.text.length, 0)

const widths = header.map((_, column) =>
  Math.max(...[header, ...rows].map((row) => cellLength(row[column]))),
)

const border = (fill: string) =>
  `+${widths.map((width) => fill.repeat(width + 2)).join('+')}+`

function Row({ cells }: { cells: Cell[] }) {
  return (
    <div>
      <span className={DIM}>|</span>
      {cells.map((cell, column) => (
        <Fragment key={column}>
          {' '}
          {cell.map((token, index) => (
            <span key={index} className={token.className}>
              {token.text}
            </span>
          ))}
          {' '.repeat(widths[column] - cellLength(cell))}{' '}
          <span className={DIM}>|</span>
        </Fragment>
      ))}
    </div>
  )
}

export function TerminalPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl">
      <div className="flex items-center gap-1.5 border-b border-zinc-800 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="ml-3 font-mono text-xs text-zinc-500">~/my-app</span>
      </div>
      <div className="overflow-x-auto whitespace-pre p-5 font-mono text-[11px] leading-relaxed text-zinc-300 sm:text-xs">
        <div>
          <span className="text-emerald-400">$</span> npx next-lens api:list
        </div>
        <div className="mt-3 font-bold text-cyan-300">
          Next.js API Route Info
        </div>
        <div className={DIM}>
          Mapped <span className="text-emerald-500">{routes.length}</span>{' '}
          routes
        </div>
        <div className={`mt-3 ${DIM}`}>{border('=')}</div>
        <Row cells={header} />
        <div className={DIM}>{border('-')}</div>
        {rows.map((cells, index) => (
          <Row key={index} cells={cells} />
        ))}
        <div className={DIM}>{border('=')}</div>
      </div>
    </div>
  )
}
