'use client'

import { motion, AnimatePresence } from 'motion/react'
import { FileCode, Folder, CheckCircle2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

// --- Data Definitions ---

// Use unique IDs for each item to avoid conflicts
const files = [
  {
    id: 'app',
    path: 'app',
    type: 'folder',
    children: [
      {
        id: 'api',
        path: 'api',
        type: 'folder',
        children: [
          {
            id: 'blogs',
            path: 'blogs',
            type: 'folder',
            children: [
              {
                id: 'blog-id',
                path: '[blogId]',
                type: 'folder',
                children: [
                  {
                    id: 'blog-id-route',
                    path: 'route.ts',
                    type: 'file',
                  },
                ],
              },
            ],
          },
          {
            id: 'login',
            path: 'login',
            type: 'folder',
            children: [
              {
                id: 'login-route',
                path: 'route.ts',
                type: 'file',
              },
            ],
          },
          {
            id: 'users',
            path: 'users',
            type: 'folder',
            children: [
              {
                id: 'users-route',
                path: 'route.ts',
                type: 'file',
              },
            ],
          },
        ],
      },
    ],
  },
]

// Flatten tree to get scan order
const scanOrder = [
  'app',
  'api',
  'blogs',
  'blog-id',
  'blog-id-route',
  'login',
  'login-route',
  'users',
  'users-route',
]

const extractedRoutes = [
  {
    method: 'POST',
    route: '/api/login',
    type: 'API',
    handler: 'app/api/login/route.ts',
  },
  {
    method: 'GET',
    route: '/api/users',
    type: 'API',
    handler: 'app/api/users/route.ts',
  },
  {
    method: 'GET',
    route: '/api/blogs/:blogId',
    type: 'API',
    handler: 'app/api/blogs/[blogId]/route.ts',
  },
]

// --- Components ---

const FileItem = ({
  item,
  depth = 0,
  currentScanId,
}: {
  item: any
  depth?: number
  currentScanId: string | null
}) => {
  const isActive = currentScanId === item.id

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-md transition-all duration-150',
          isActive ? 'bg-blue-500/20 text-blue-300' : 'text-zinc-400',
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        {item.type === 'folder' ? (
          <Folder
            className={cn(
              'w-4 h-4 transition-colors duration-150',
              isActive ? 'text-blue-400' : 'text-zinc-500',
            )}
          />
        ) : (
          <FileCode
            className={cn(
              'w-4 h-4 transition-colors duration-150',
              isActive ? 'text-blue-400' : 'text-zinc-500',
            )}
          />
        )}
        <span className="text-sm font-mono">{item.path}</span>
      </div>
      {item.children?.map((child: any, i: number) => (
        <FileItem
          key={child.id}
          item={child}
          depth={depth + 1}
          currentScanId={currentScanId}
        />
      ))}
    </div>
  )
}

const ResultRow = ({ route, index }: { route: any; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.15, duration: 0.3 }}
    className="flex items-center gap-2 p-2 text-xs border-b border-zinc-800/50 last:border-0"
  >
    <div
      className={cn(
        'px-1.5 py-0.5 rounded font-bold w-12 text-center',
        route.method === 'GET'
          ? 'bg-green-500/10 text-green-400'
          : route.method === 'POST'
            ? 'bg-blue-500/10 text-blue-400'
            : 'bg-purple-500/10 text-purple-400',
      )}
    >
      {route.method}
    </div>
    <div className="flex-1 font-mono text-zinc-300 truncate text-[10px] sm:text-xs">
      {route.route}
    </div>
    <div className="hidden sm:block text-zinc-500 truncate max-w-[150px] text-[10px] sm:text-xs">
      {route.handler}
    </div>
    <div className="w-2 h-2 rounded-full bg-green-500" />
  </motion.div>
)

export function ScanAnimation() {
  const [stage, setStage] = useState<
    'idle' | 'scanning' | 'processing' | 'results'
  >('idle')
  const [currentScanId, setCurrentScanId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const runAnimation = async () => {
      if (!mounted) return

      // Reset
      setStage('scanning')
      setCurrentScanId(null)

      // Scan files one by one
      for (const id of scanOrder) {
        if (!mounted) return
        setCurrentScanId(id)
        await new Promise((r) => setTimeout(r, 350))
      }

      // Clear highlight before processing
      setCurrentScanId(null)

      // Processing phase
      if (!mounted) return
      setStage('processing')
      await new Promise((r) => setTimeout(r, 1200))

      // Results phase
      if (!mounted) return
      setStage('results')

      // Hold results then restart
      await new Promise((r) => setTimeout(r, 5000))
      if (!mounted) return
      runAnimation()
    }

    // Start initial delay
    const initialTimer = setTimeout(runAnimation, 800)

    return () => {
      mounted = false
      clearTimeout(initialTimer)
    }
  }, [])

  return (
    <div className="relative w-full max-w-md mx-auto h-[400px] bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
          </div>
          <div className="text-xs text-zinc-500 ml-2 font-mono">next-lens</div>
        </div>
        <div className="flex items-center gap-2">
          {stage === 'scanning' && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">
                Scanning
              </span>
            </div>
          )}
          {stage === 'processing' && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" />
              <span className="text-[10px] text-yellow-400 font-medium uppercase tracking-wider">
                Processing
              </span>
            </div>
          )}
          {stage === 'results' && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-[10px] text-green-400 font-medium uppercase tracking-wider">
                Done
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 bg-zinc-950/50 overflow-hidden">
        <AnimatePresence mode="wait">
          {stage === 'results' ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-0 p-4"
            >
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Scan Complete
                  </h3>
                  <span className="text-xs text-zinc-500">3 routes found</span>
                </div>

                <div className="bg-zinc-900/30 rounded-lg border border-zinc-800/50 overflow-hidden flex-1">
                  {/* Table Header */}
                  <div className="flex items-center gap-2 p-2 border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                    <div className="w-12 text-center">Method</div>
                    <div className="flex-1">Route</div>
                    <div className="hidden sm:block">Source</div>
                    <div className="w-2"></div>
                  </div>
                  {/* Rows */}
                  <div className="p-1">
                    {extractedRoutes.map((route, i) => (
                      <ResultRow key={i} route={route} index={i} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="files"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 p-4"
            >
              {/* File Tree */}
              <div className="space-y-1">
                {files.map((file) => (
                  <FileItem
                    key={file.id}
                    item={file}
                    currentScanId={currentScanId}
                  />
                ))}
              </div>

              {/* Processing Spinner Overlay */}
              {stage === 'processing' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm z-20"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-xs text-blue-400 font-mono animate-pulse">
                      Analyzing structure...
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-zinc-900/30 border-t border-zinc-800 text-[10px] text-zinc-600 flex justify-between items-center font-mono">
        <span>Next.js 16.0.10</span>
        <span className="flex items-center gap-1">
          {stage === 'results' ? 'Ready' : 'Waiting...'}
          <div
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              stage === 'results' ? 'bg-green-500' : 'bg-zinc-700',
            )}
          />
        </span>
      </div>
    </div>
  )
}
