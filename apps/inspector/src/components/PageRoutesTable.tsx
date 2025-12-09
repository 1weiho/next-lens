import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Loader2, Layout, Code, Trash2 } from 'lucide-react'

import { api, type PageInfo } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, SortableHeader } from '@/components/ui/data-table'
import { FileIcon } from '@/components/ui/file-icon'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn, formatPath } from '@/lib/utils'

// Refined status badges
const getStatusStyles = (status: string) => {
  const base =
    'font-mono text-[10px] px-2 py-0.5 rounded-full border shadow-sm transition-all uppercase tracking-wider'

  if (status === 'co-located') {
    return cn(
      base,
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    )
  }
  if (status === 'inherited') {
    return cn(
      base,
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    )
  }
  // missing
  return cn(
    base,
    'bg-zinc-50 text-zinc-400 border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-500 dark:border-zinc-700 opacity-70',
  )
}

const STATUS_LABELS: Record<string, string> = {
  'co-located': 'Present',
  inherited: 'Inherited',
  missing: 'None',
}

export function PageRoutesTable() {
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<PageInfo | null>(null)
  const {
    data: pages,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['pages'],
    queryFn: api.getPages,
  })

  const deleteMutation = useMutation({
    mutationFn: api.deletePage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      setDeleteTarget(null)
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
          const path = row.original.path || '/'
          const hasLeadingSlash = path.startsWith('/')
          const parts = path.split('/').filter(Boolean)
          return (
            <div className="font-mono text-sm text-zinc-500 dark:text-zinc-300 flex items-center gap-2">
              <Layout className="h-3 w-3 text-muted-foreground" />
              <span className="flex items-center">
                {hasLeadingSlash && <span>/</span>}
                {parts.length > 0 &&
                  parts.map((part, i) => {
                    const isParam = part.startsWith('[') || part.startsWith(':')
                    return (
                      <span key={i}>
                        {i > 0 && (
                          <span className="text-zinc-300 dark:text-zinc-600">
                            /
                          </span>
                        )}
                        <span
                          className={cn(
                            isParam
                              ? 'text-purple-600 dark:text-purple-400 font-bold'
                              : i === parts.length - 1
                                ? 'text-foreground font-medium'
                                : '',
                          )}
                        >
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
          const filePath = row.original.loadingPath
          const badge = (
            <Badge variant="outline" className={getStatusStyles(status)}>
              {STATUS_LABELS[status] || status}
            </Badge>
          )

          if (status === 'missing' || !filePath) return badge

          return (
            <Tooltip>
              <TooltipTrigger asChild>{badge}</TooltipTrigger>
              <TooltipContent side="top">
                <div className="flex items-center gap-2">
                  <FileIcon fileName={filePath} className="h-3.5 w-3.5" />
                  <span className="font-mono text-xs">
                    {formatPath(filePath)}
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
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
          const filePath = row.original.errorPath
          const badge = (
            <Badge variant="outline" className={getStatusStyles(status)}>
              {STATUS_LABELS[status] || status}
            </Badge>
          )

          if (status === 'missing' || !filePath) return badge

          return (
            <Tooltip>
              <TooltipTrigger asChild>{badge}</TooltipTrigger>
              <TooltipContent side="top">
                <div className="flex items-center gap-2">
                  <FileIcon fileName={filePath} className="h-3.5 w-3.5" />
                  <span className="font-mono text-xs">
                    {formatPath(filePath)}
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
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
              <FileIcon
                fileName={file}
                className="opacity-70 group-hover:opacity-100"
              />
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
            <div className="flex justify-end gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                    onClick={() => handleOpenFile(page.file)}
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Open in IDE</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                    onClick={() => setDeleteTarget(page)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Delete page</TooltipContent>
              </Tooltip>
            </div>
          )
        },
      },
    ],
    [handleOpenFile, setDeleteTarget],
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
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Page Routes
            </h2>
            <Badge
              variant="secondary"
              className="rounded-full px-2.5 font-mono text-xs"
            >
              {pages?.length || 0}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            List all page routes in your Next.js application
          </p>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden gap-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Delete Page</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="px-6 py-2">
              <div className="rounded-lg bg-muted/50 border p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="font-mono text-xs text-muted-foreground">
                    Target file
                  </p>
                  <p className="font-mono text-xs font-medium break-all">
                    {deleteTarget.file}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="bg-muted/30 p-6 pt-4">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="shadow-sm"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.file)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Confirm Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
