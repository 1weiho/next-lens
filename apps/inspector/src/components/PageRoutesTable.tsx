import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type VariantProps } from 'class-variance-authority'
import { FileCode, Loader2, Plus } from 'lucide-react'

import { api, type PageInfo } from '@/api/client'
import { Badge, badgeVariants } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type BadgeVariant = VariantProps<typeof badgeVariants>['variant']

const STATUS_VARIANTS: Record<
  PageInfo['loading'] | PageInfo['error'],
  BadgeVariant
> = {
  'co-located': 'secondary',
  inherited: 'outline',
  missing: 'destructive',
}

const STATUS_SYMBOLS: Record<string, string> = {
  'co-located': '●',
  inherited: '◐',
  missing: '○',
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading page routes...
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center text-destructive">
        Failed to load pages: {(error as Error).message}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Page Routes
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({pages?.length || 0})
          </span>
        </h2>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Badge variant={STATUS_VARIANTS['co-located']} className="h-5">
            {STATUS_SYMBOLS['co-located']}
          </Badge>
          Co-located
        </span>
        <span className="flex items-center gap-1">
          <Badge variant={STATUS_VARIANTS.inherited} className="h-5">
            {STATUS_SYMBOLS.inherited}
          </Badge>
          Inherited
        </span>
        <span className="flex items-center gap-1">
          <Badge variant={STATUS_VARIANTS.missing} className="h-5">
            {STATUS_SYMBOLS.missing}
          </Badge>
          Missing
        </span>
      </div>

      {pages && pages.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Path</TableHead>
                <TableHead className="w-[200px]">Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="w-[200px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.file}>
                  <TableCell className="font-mono text-sm">
                    {page.path || '/'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge
                        variant={STATUS_VARIANTS[page.loading]}
                        title={`loading: ${page.loading}`}
                      >
                        {STATUS_SYMBOLS[page.loading]} loading
                      </Badge>
                      <Badge
                        variant={STATUS_VARIANTS[page.error]}
                        title={`error: ${page.error}`}
                      >
                        {STATUS_SYMBOLS[page.error]} error
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleOpenFile(page.file)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <FileCode className="h-4 w-4" />
                      {page.file}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {page.loading === 'missing' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            createLoadingMutation.mutate(page.file)
                          }
                          disabled={createLoadingMutation.isPending}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          loading
                        </Button>
                      )}
                      {page.error === 'missing' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => createErrorMutation.mutate(page.file)}
                          disabled={createErrorMutation.isPending}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          error
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          No page routes found
        </div>
      )}
    </div>
  )
}
