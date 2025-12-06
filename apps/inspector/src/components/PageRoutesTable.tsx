import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { FileCode, Loader2, Plus, Layout } from 'lucide-react'

import { api, type PageInfo } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, SortableHeader } from '@/components/ui/data-table'
import { cn, formatPath } from '@/lib/utils'

// Refined status badges
const getStatusStyles = (status: string) => {
  const base = "font-mono text-[10px] px-2 py-0.5 rounded-full border shadow-sm transition-all uppercase tracking-wider";
  
  if (status === 'co-located') {
    return cn(base, "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800");
  }
  if (status === 'inherited') {
    return cn(base, "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800");
  }
  // missing
  return cn(base, "bg-zinc-50 text-zinc-400 border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-500 dark:border-zinc-700 opacity-70");
}

const STATUS_LABELS: Record<string, string> = {
  'co-located': 'Present',
  inherited: 'Inherited',
  missing: 'None',
}

export function PageRoutesTable() {
  const queryClient = useQueryClient()

  const {
    data: pages,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['pages'],
    queryFn: api.getPages,
  })

  const createLoadingMutation = useMutation({
    mutationFn: api.createLoading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
    },
  })

  const createErrorMutation = useMutation({
    mutationFn: api.createError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
    },
  })

  const handleOpenFile = async (file: string) => {
    try {
      await api.openFile(file)
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }

  const columns = useMemo<ColumnDef<PageInfo>[]>(
    () => [
      {
        accessorKey: 'path',
        header: ({ column }) => (
          <SortableHeader column={column}>Path</SortableHeader>
        ),
        cell: ({ row }) => {
           const path = row.original.path || '/';
           const parts = path.split('/');
           return (
             <div className="font-mono text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <Layout className="h-3 w-3 text-muted-foreground/50" />
                <span>
                {parts.map((part, i) => {
                   if (!part && i === 0) return <span key={i}>/</span>;
                   if (!part) return null;
                   const isParam = part.startsWith('[') || part.startsWith(':');
                   return (
                     <span key={i}>
                       <span className="text-zinc-300 dark:text-zinc-700">/</span>
                       <span className={cn(
                         isParam ? "text-purple-600 dark:text-purple-400 font-bold" : 
                         i === parts.length - 1 ? "text-foreground font-medium" : ""
                       )}>
                         {part}
                       </span>
                     </span>
                   )
                })}
                </span>
             </div>
           )
        },
      },
      {
        accessorKey: 'loading',
        header: 'Loading UI',
        cell: ({ row }) => {
          const status = row.original.loading
          return (
            <Badge variant="outline" className={getStatusStyles(status)}>
              {STATUS_LABELS[status] || status}
            </Badge>
          )
        },
        filterFn: (row, id, value) => {
          const status = row.getValue(id) as string
          return value.length === 0 || value.includes(status)
        },
      },
      {
        accessorKey: 'error',
        header: 'Error UI',
        cell: ({ row }) => {
          const status = row.original.error
          return (
            <Badge variant="outline" className={getStatusStyles(status)}>
              {STATUS_LABELS[status] || status}
            </Badge>
          )
        },
        filterFn: (row, id, value) => {
          const status = row.getValue(id) as string
          return value.length === 0 || value.includes(status)
        },
      },
      {
        accessorKey: 'file',
        header: 'Source',
        cell: ({ row }) => {
          const file = row.original.file
          return (
            <button
              onClick={() => handleOpenFile(file)}
              className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
              title={file}
            >
              <FileCode className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 shrink-0" />
              <span className="font-mono break-all">{formatPath(file)}</span>
            </button>
          )
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const page = row.original
          return (
            <div className="flex justify-end gap-2">
              {page.loading === 'missing' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  onClick={() => createLoadingMutation.mutate(page.file)}
                  disabled={createLoadingMutation.isPending}
                  title="Create loading.tsx"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Loading
                </Button>
              )}
              {page.error === 'missing' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  onClick={() => createErrorMutation.mutate(page.file)}
                  disabled={createErrorMutation.isPending}
                  title="Create error.tsx"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Error
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [handleOpenFile, createLoadingMutation, createErrorMutation],
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Scanning page routes...
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[200px] flex flex-col items-center justify-center text-destructive bg-destructive/5 rounded-xl p-8 border border-destructive/20">
        <p className="font-semibold mb-2">Failed to load pages</p>
        <p className="text-sm opacity-80">{(error as Error).message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Page Routes
          </h2>
          <p className="text-sm text-muted-foreground">
            Visualize loading states and error boundaries ({pages?.length || 0})
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg w-fit border border-border/50">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          <span>Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
          <span>Inherited</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span>Missing</span>
        </div>
      </div>

      {pages && pages.length > 0 ? (
        <div className="[&_.rounded-md.border]:border-0 [&_.rounded-md.border]:shadow-sm [&_.rounded-md.border]:bg-card [&_.rounded-md.border]:ring-1 [&_.rounded-md.border]:ring-border/50">
          <DataTable
            columns={columns}
            data={pages}
            searchPlaceholder="Search page paths..."
            defaultSorting={[{ id: 'path', desc: false }]}
          />
        </div>
      ) : (
        <div className="py-12 text-center border border-dashed rounded-xl bg-muted/30">
           <p className="text-muted-foreground">No page routes found</p>
        </div>
      )}
    </div>
  )
}
