import { getApiRoutes, RouteInfo } from '../api-routes'
import { getPageRoutes, PageInfo } from '../page-routes'

export interface InspectorData {
  meta: {
    generatedAt: string
    targetDirectory: string
    readonly: boolean
  }
  routes: RouteInfo[]
  pages: PageInfo[]
}

export interface CollectDataOptions {
  targetDirectory: string
  readonly?: boolean
}

/**
 * Collect all inspector data (API routes and page routes) for a target directory.
 * This function is used by both the live API server and the static build command.
 */
export async function collectInspectorData(
  options: CollectDataOptions,
): Promise<InspectorData> {
  const { targetDirectory, readonly = false } = options

  const [routes, pages] = await Promise.all([
    getApiRoutes(targetDirectory),
    getPageRoutes(targetDirectory),
  ])

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      targetDirectory,
      readonly,
    },
    routes,
    pages,
  }
}
