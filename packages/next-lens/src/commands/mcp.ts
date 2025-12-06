import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { Command } from 'commander'
import { z } from 'zod'
import { getApiRoutes, HTTP_METHODS } from '../lib/api-routes'
import { getPageRoutes } from '../lib/page-routes'

export const mcpCommand = new Command('mcp')
  .description('Start the Model Context Protocol (MCP) server')
  .action(async () => {
    const server = new Server(
      {
        name: 'next-lens',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    )

    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'api-list',
            description: 'List and search Next.js App Router API routes',
            inputSchema: {
              type: 'object',
              properties: {
                targetDirectory: {
                  type: 'string',
                  description:
                    'Path to the Next.js project (optional, defaults to current directory)',
                },
                method: {
                  type: 'string',
                  description:
                    'Filter routes by HTTP method (case-insensitive, e.g., GET, post, PUT)',
                },
              },
            },
          },
          {
            name: 'page-list',
            description: 'List and search Next.js App Router page routes',
            inputSchema: {
              type: 'object',
              properties: {
                targetDirectory: {
                  type: 'string',
                  description:
                    'Path to the Next.js project (optional, defaults to current directory)',
                },
              },
            },
          },
          {
            name: 'api-search',
            description: 'Search Next.js App Router API routes by path',
            inputSchema: {
              type: 'object',
              properties: {
                targetDirectory: {
                  type: 'string',
                  description:
                    'Path to the Next.js project (optional, defaults to current directory)',
                },
                search: {
                  type: 'string',
                  description: 'Search term to filter routes by path',
                },
                method: {
                  type: 'string',
                  description:
                    'Filter routes by HTTP method (case-insensitive, e.g., GET, post, PUT)',
                },
              },
              required: ['search'],
            },
          },
          {
            name: 'page-search',
            description: 'Search Next.js App Router page routes by path',
            inputSchema: {
              type: 'object',
              properties: {
                targetDirectory: {
                  type: 'string',
                  description:
                    'Path to the Next.js project (optional, defaults to current directory)',
                },
                search: {
                  type: 'string',
                  description: 'Search term to filter pages by path',
                },
              },
              required: ['search'],
            },
          },
        ],
      }
    })

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params

      try {
        if (name === 'api-list') {
          const schema = z.object({
            targetDirectory: z.string().optional(),
            method: z.string().optional(),
          })
          const { targetDirectory, method } = schema.parse(args)

          // Validate method if provided
          if (method) {
            const normalizedMethod = method.toUpperCase()
            if (!HTTP_METHODS.has(normalizedMethod)) {
              const validMethods = Array.from(HTTP_METHODS).join(', ')
              return {
                content: [
                  {
                    type: 'text',
                    text: `Error: Invalid HTTP method: ${method}\nValid methods are: ${validMethods}`,
                  },
                ],
                isError: true,
              }
            }
          }

          const routes = await getApiRoutes(targetDirectory ?? null, method)

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(routes, null, 2),
              },
            ],
          }
        }

        if (name === 'page-list') {
          const schema = z.object({
            targetDirectory: z.string().optional(),
          })
          const { targetDirectory } = schema.parse(args)
          const pages = await getPageRoutes(targetDirectory ?? null)

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(pages, null, 2),
              },
            ],
          }
        }

        if (name === 'api-search') {
          const schema = z.object({
            targetDirectory: z.string().optional(),
            search: z.string(),
            method: z.string().optional(),
          })
          const { targetDirectory, search, method } = schema.parse(args)

          // Validate method if provided
          if (method) {
            const normalizedMethod = method.toUpperCase()
            if (!HTTP_METHODS.has(normalizedMethod)) {
              const validMethods = Array.from(HTTP_METHODS).join(', ')
              return {
                content: [
                  {
                    type: 'text',
                    text: `Error: Invalid HTTP method: ${method}\nValid methods are: ${validMethods}`,
                  },
                ],
                isError: true,
              }
            }
          }

          const routes = await getApiRoutes(targetDirectory ?? null, method)
          const filteredRoutes = routes.filter((r) => r.path.includes(search))

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(filteredRoutes, null, 2),
              },
            ],
          }
        }

        if (name === 'page-search') {
          const schema = z.object({
            targetDirectory: z.string().optional(),
            search: z.string(),
          })
          const { targetDirectory, search } = schema.parse(args)
          const pages = await getPageRoutes(targetDirectory ?? null)
          const filteredPages = pages.filter((p) => p.path.includes(search))

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(filteredPages, null, 2),
              },
            ],
          }
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${(error as Error).message}`,
            },
          ],
          isError: true,
        }
      }

      throw new Error(`Unknown tool: ${name}`)
    })

    const transport = new StdioServerTransport()
    await server.connect(transport)
  })

export default mcpCommand
