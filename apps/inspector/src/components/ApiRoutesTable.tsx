import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Loader2, Plus, Trash2, Code } from 'lucide-react'

import { api, type RouteInfo } from '@/api/client'
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
import { cn, formatPath } from '@/lib/utils'

const METHOD_STYLES: Record<string, string> = {
  GET: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  POST: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  PUT: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  PATCH:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  DELETE:
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
  HEAD: 'bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-700',
  OPTIONS:
    'bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-700',
}

export function ApiRoutesTable() {
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<RouteInfo | null>(null)
  const [addMethodTarget, setAddMethodTarget] = useState<RouteInfo | null>(null)

  const {
    data: routes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['routes'],
    queryFn: api.getRoutes,
  })

  const deleteMutation = useMutation({
    mutationFn: api.deleteRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      setDeleteTarget(null)
    },
  })

  const addMethodMutation = useMutation({
    mutationFn: ({ file, method }: { file: string; method: string }) =>
      api.addMethod(file, method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      setAddMethodTarget(null)
    },
  })

  const handleOpenFile = async (file: string) => {
    try {
      await api.openFile(file)
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }

  const columns = useMemo<ColumnDef<RouteInfo>[]>(
    () => [
      {
        accessorKey: 'methods',
        header: 'Methods',
        size: 180,
        cell: ({ row }) => {
          const methods = row.original.methods
          return (
            <div className="flex flex-wrap gap-1.5">
              {methods.map((method) => (
                <Badge
                  key={method}
                  variant="outline"
                  className={cn(
                    'font-mono text-[10px] px-1.5 py-0.5 rounded-md border uppercase tracking-wide shadow-sm transition-all hover:brightness-95',
                    METHOD_STYLES[method] || METHOD_STYLES.OPTIONS,
                  )}
                >
                  {method}
                </Badge>
              ))}
            </div>
          )
        },
        filterFn: (row, id, value) => {
          const methods = row.getValue(id) as string[]
          return (
            value.length === 0 || value.some((v: string) => methods.includes(v))
          )
        },
      },
      {
        accessorKey: 'path',
        header: ({ column }) => (
          <SortableHeader column={column}>Path</SortableHeader>
        ),
        cell: ({ row }) => {
          const path = row.original.path
          // Simple semantic coloring for path:
          // /api/users/[id] -> /api/users/ is gray, [id] is accent
          const parts = path.split('/')
          return (
            <div className="font-mono text-sm text-zinc-500 dark:text-zinc-300">
              {parts.map((part, i) => {
                if (!part) return null
                const isParam = part.startsWith('[') || part.startsWith(':')
                return (
                  <span key={i}>
                    <span className="text-zinc-300 dark:text-zinc-600">/</span>
                    <span
                      className={cn(
                        isParam
                          ? 'text-amber-600 dark:text-amber-400 font-bold'
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
            </div>
          )
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
          const route = row.original
          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                onClick={() => handleOpenFile(route.file)}
                title="Open in IDE"
              >
                <Code className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                onClick={() => setAddMethodTarget(route)}
                title="Add HTTP method"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                onClick={() => setDeleteTarget(route)}
                title="Delete route"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    [handleOpenFile],
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50 mb-4" />
        <p className="text-sm animate-pulse">Scanning project routes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[200px] flex flex-col items-center justify-center text-destructive bg-destructive/5 rounded-xl p-8 border border-destructive/20">
        <p className="font-semibold mb-2">Failed to load routes</p>
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
              API Routes
            </h2>
            <Badge
              variant="secondary"
              className="rounded-full px-2.5 font-mono text-xs"
            >
              {routes?.length || 0}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage and inspect your API endpoints
          </p>
        </div>
      </div>

      {routes && routes.length > 0 ? (
        <div className="[&_.rounded-md.border]:border-0 [&_.rounded-md.border]:shadow-sm [&_.rounded-md.border]:bg-card [&_.rounded-md.border]:ring-1 [&_.rounded-md.border]:ring-border/50">
          <DataTable
            columns={columns}
            data={routes}
            searchPlaceholder="Search endpoints..."
            defaultSorting={[{ id: 'path', desc: false }]}
          />
        </div>
      ) : (
        <div className="py-12 text-center border border-dashed rounded-xl bg-muted/30">
          <p className="text-muted-foreground">No API routes found</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden gap-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Delete Route</DialogTitle>
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

      {/* Add Method Dialog */}
      <Dialog
        open={!!addMethodTarget}
        onOpenChange={() => setAddMethodTarget(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add HTTP Method</DialogTitle>
            <DialogDescription>
              Select a method to append to this route handler.
            </DialogDescription>
          </DialogHeader>
          {addMethodTarget && (
            <div className="py-4 space-y-4">
              <div className="rounded-md bg-muted/50 border p-3 font-mono text-xs text-muted-foreground break-all">
                {addMethodTarget.file}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
                  .filter((method) => !addMethodTarget.methods.includes(method))
                  .map((method) => (
                    <Button
                      key={method}
                      variant="outline"
                      className="h-auto py-2 justify-start font-mono text-xs hover:border-primary hover:text-primary hover:bg-primary/5"
                      onClick={() =>
                        addMethodMutation.mutate({
                          file: addMethodTarget.file,
                          method,
                        })
                      }
                      disabled={addMethodMutation.isPending}
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      {method}
                    </Button>
                  ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
