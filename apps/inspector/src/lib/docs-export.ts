import type { RouteInfo } from '@/api/client'

const DEFAULT_SERVER_URL = 'http://localhost:3000'
const SCALAR_CDN_URL = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference'
const OPENAPI_METHODS = new Set<OpenApiHttpMethod>([
  'get',
  'post',
  'put',
  'patch',
  'delete',
])

type OpenApiHttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

type OpenApiOperation = {
  operationId: string
  summary: string
  parameters?: Array<{
    name: string
    in: 'path'
    required: true
    schema: { type: 'string' }
  }>
  responses: {
    '200': {
      description: string
    }
  }
}

type OpenApiDocument = {
  openapi: '3.0.3'
  info: {
    title: string
    version: string
    description: string
  }
  servers: Array<{ url: string }>
  paths: Record<string, Partial<Record<OpenApiHttpMethod, OpenApiOperation>>>
}

function toOpenApiPath(path: string): string {
  return path.replace(/:([A-Za-z0-9_]+)(?:\*\??)?/g, '{$1}')
}

function toPathParams(path: string): string[] {
  const matches = path.matchAll(/:([A-Za-z0-9_]+)(?:\*\??)?/g)
  return Array.from(new Set(Array.from(matches, (match) => match[1])))
}

function toOperationId(method: string, path: string): string {
  const methodPart = method.toLowerCase()
  const segments = path
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/[^A-Za-z0-9]/g, ' '))
    .join(' ')
    .trim()

  const pathPart = segments
    .split(/\s+/)
    .filter(Boolean)
    .map((token, index) =>
      index === 0
        ? token.toLowerCase()
        : token[0].toUpperCase() + token.slice(1).toLowerCase(),
    )
    .join('')

  return pathPart
    ? `${methodPart}${pathPart[0].toUpperCase()}${pathPart.slice(1)}`
    : methodPart
}

export function buildOpenApiDocument(routes: RouteInfo[]): OpenApiDocument {
  const paths: OpenApiDocument['paths'] = {}

  for (const route of routes) {
    const openApiPath = toOpenApiPath(route.path)
    const pathParams = toPathParams(route.path)

    if (!paths[openApiPath]) {
      paths[openApiPath] = {}
    }

    for (const method of route.methods) {
      const normalizedMethod = method.toLowerCase() as OpenApiHttpMethod
      if (!OPENAPI_METHODS.has(normalizedMethod)) {
        continue
      }

      paths[openApiPath][normalizedMethod] = {
        operationId: toOperationId(method, route.path),
        summary: `${method} ${route.path}`,
        parameters:
          pathParams.length > 0
            ? pathParams.map((name) => ({
                name,
                in: 'path' as const,
                required: true as const,
                schema: { type: 'string' as const },
              }))
            : undefined,
        responses: {
          '200': {
            description: 'Successful response',
          },
        },
      }
    }
  }

  return {
    openapi: '3.0.3',
    info: {
      title: 'Next Lens API',
      version: '1.0.0',
      description: 'Generated from Next Lens route inspector.',
    },
    servers: [{ url: DEFAULT_SERVER_URL }],
    paths,
  }
}

export function buildPostmanCollection(routes: RouteInfo[]) {
  return {
    info: {
      name: 'Next Lens API',
      schema:
        'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      description: 'Generated from Next Lens route inspector.',
    },
    variable: [
      {
        key: 'baseUrl',
        value: DEFAULT_SERVER_URL,
      },
    ],
    item: routes.flatMap((route) =>
      route.methods
        .filter((method) => method.toUpperCase() !== 'OPTIONS')
        .map((method) => ({
          name: `${method} ${route.path}`,
          request: {
            method,
            header: [],
            url: {
              raw: `{{baseUrl}}${route.path}`,
              host: ['{{baseUrl}}'],
              path: route.path.replace(/^\/+/, '').split('/').filter(Boolean),
            },
            description: `Generated from ${route.file}`,
          },
          response: [],
        })),
    ),
  }
}

export function buildScalarHtml(openApiDocument: OpenApiDocument): string {
  const serializedSpec = JSON.stringify(openApiDocument).replace(
    /<\/script>/gi,
    '<\\/script>',
  )

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Next Lens API Docs</title>
  </head>
  <body>
    <script id="api-reference" type="application/json">${serializedSpec}</script>
    <script src="${SCALAR_CDN_URL}"></script>
    <script>
      Scalar.createApiReference('#api-reference', {
        theme: 'default',
      })
    </script>
  </body>
</html>`
}

export function downloadTextFile(
  fileName: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
