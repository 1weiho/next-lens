export interface RouteInfo {
  file: string
  methods: string[]
  path: string
}

export interface PageInfo {
  file: string
  path: string
  loading: 'co-located' | 'inherited' | 'missing'
  error: 'co-located' | 'inherited' | 'missing'
}

const BASE_URL = '/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

export const api = {
  getRoutes: () => fetchJson<RouteInfo[]>('/routes'),

  getPages: () => fetchJson<PageInfo[]>('/pages'),

  deleteRoute: (file: string) =>
    fetchJson<{ success: boolean }>('/routes', {
      method: 'DELETE',
      body: JSON.stringify({ file }),
    }),

  addMethod: (file: string, method: string) =>
    fetchJson<{ success: boolean }>('/routes/methods', {
      method: 'POST',
      body: JSON.stringify({ file, method }),
    }),

  createLoading: (file: string) =>
    fetchJson<{ success: boolean; file: string }>('/pages/loading', {
      method: 'POST',
      body: JSON.stringify({ file }),
    }),

  createError: (file: string) =>
    fetchJson<{ success: boolean; file: string }>('/pages/error', {
      method: 'POST',
      body: JSON.stringify({ file }),
    }),

  openFile: (file: string, line?: number) =>
    fetchJson<{ success: boolean }>('/open-file', {
      method: 'POST',
      body: JSON.stringify({ file, line }),
    }),
}
