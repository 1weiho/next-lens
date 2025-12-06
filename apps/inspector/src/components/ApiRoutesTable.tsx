import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { type VariantProps } from 'class-variance-authority'
import { FileCode, Loader2, Plus, Trash2 } from 'lucide-react'

import { api, type RouteInfo } from '@/api/client'
import { Badge, badgeVariants } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, SortableHeader } from '@/components/ui/data-table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type BadgeVariant = VariantProps<typeof badgeVariants>['variant']

const METHOD_VARIANTS: Record<string, BadgeVariant> = {
  GET: 'secondary',
  POST: 'default',
  PUT: 'default',
  PATCH: 'default',
  DELETE: 'destructive',
  HEAD: 'outline',
  OPTIONS: 'outline',
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
        cell: ({ row }) => {
          const methods = row.original.methods
          return (
            <div className="flex flex-wrap gap-1">
              {methods.map((method) => (
                <Badge
                  key={method}
                  variant={METHOD_VARIANTS[method] ?? 'outline'}
                >
                  {method}
                </Badge>
              ))}
            </div>
          )
        },
        filterFn: (row, id, value) => {
          const methods = row.getValue(id) as string[]
          return value.length === 0 || value.some((v: string) => methods.includes(v))
        },
      },
      {
        accessorKey: 'path',
        header: ({ column }) => (
          <SortableHeader column={column}>Path</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.original.path}</div>
        ),
      },
      {
        accessorKey: 'file',
        header: 'Source',
        cell: ({ row }) => {
          const file = row.original.file
          return (
            <button
              onClick={() => handleOpenFile(file)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileCode className="h-4 w-4" />
              {file}
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
                onClick={() => setAddMethodTarget(route)}
                title="Add HTTP method"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteTarget(route)}
                title="Delete route"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
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
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading API routes...
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center text-destructive">
        Failed to load routes: {(error as Error).message}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          API Routes
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({routes?.length || 0})
          </span>
        </h2>
      </div>

      {routes && routes.length > 0 ? (
        <DataTable
          columns={columns}
          data={routes}
          searchPlaceholder="Search routes by path, file, or methods..."
          defaultSorting={[{ id: 'path', desc: false }]}
        />
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          No API routes found
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Route</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this route? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="my-4 rounded-md bg-muted p-3">
              <p className="font-mono text-sm">{deleteTarget.file}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
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
                'Delete'
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add HTTP Method</DialogTitle>
            <DialogDescription>
              Select an HTTP method to add to this route.
            </DialogDescription>
          </DialogHeader>
          {addMethodTarget && (
            <>
              <div className="my-4 rounded-md bg-muted p-3">
                <p className="font-mono text-sm">{addMethodTarget.file}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
                  .filter((method) => !addMethodTarget.methods.includes(method))
                  .map((method) => (
                    <Button
                      key={method}
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        addMethodMutation.mutate({
                          file: addMethodTarget.file,
                          method,
                        })
                      }
                      disabled={addMethodMutation.isPending}
                    >
                      {method}
                    </Button>
                  ))}
              </div>
            </>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddMethodTarget(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
