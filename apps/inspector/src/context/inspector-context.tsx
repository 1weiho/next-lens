import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { RouteInfo, PageInfo } from '@/api/client'

export interface InspectorMeta {
  generatedAt: string
  targetDirectory: string
  readonly: boolean
}

export interface StaticData {
  meta: InspectorMeta
  routes: RouteInfo[]
  pages: PageInfo[]
}

interface InspectorContextValue {
  isReadonly: boolean
  meta: InspectorMeta | null
  staticRoutes: RouteInfo[] | null
  staticPages: PageInfo[] | null
  isLoading: boolean
}

const InspectorContext = createContext<InspectorContextValue>({
  isReadonly: false,
  meta: null,
  staticRoutes: null,
  staticPages: null,
  isLoading: true,
})

export function useInspector() {
  return useContext(InspectorContext)
}

interface InspectorProviderProps {
  children: ReactNode
}

export function InspectorProvider({ children }: InspectorProviderProps) {
  const [staticData, setStaticData] = useState<StaticData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Try to load static data from inspector-data.json
    async function loadStaticData() {
      try {
        const response = await fetch('/inspector-data.json')
        if (response.ok) {
          const data: StaticData = await response.json()
          // Only use static data if it's marked as readonly
          if (data.meta?.readonly) {
            setStaticData(data)
          }
        }
      } catch {
        // No static data available, will use live API
      } finally {
        setIsLoading(false)
      }
    }

    loadStaticData()
  }, [])

  const value: InspectorContextValue = {
    isReadonly: staticData?.meta?.readonly ?? false,
    meta: staticData?.meta ?? null,
    staticRoutes: staticData?.routes ?? null,
    staticPages: staticData?.pages ?? null,
    isLoading,
  }

  return (
    <InspectorContext.Provider value={value}>
      {children}
    </InspectorContext.Provider>
  )
}
