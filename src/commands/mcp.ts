import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { Command } from 'commander'
import { z } from 'zod'
import { getApiRoutes } from '../lib/api-routes'
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
            description: 'List Next.js App Router API routes',
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
                  description:
                    'Search term to filter routes by path (optional)',
                },
              },
            },
          },
          {
            name: 'page-list',
            description: 'List Next.js App Router page routes',
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
                  description: 'Search term to filter pages by path (optional)',
                },
              },
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
            search: z.string().optional(),
          })
          const { targetDirectory, search } = schema.parse(args)
          const routes = await getApiRoutes(targetDirectory ?? null)
          const filteredRoutes = search
            ? routes.filter((r) => r.path.includes(search))
            : routes

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(filteredRoutes, null, 2),
              },
            ],
          }
        }

        if (name === 'page-list') {
          const schema = z.object({
            targetDirectory: z.string().optional(),
            search: z.string().optional(),
          })
          const { targetDirectory, search } = schema.parse(args)
          const pages = await getPageRoutes(targetDirectory ?? null)
          const filteredPages = search
            ? pages.filter((p) => p.path.includes(search))
            : pages

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
