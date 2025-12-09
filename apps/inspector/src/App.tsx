import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ApiRoutesTable } from '@/components/ApiRoutesTable'
import { PageRoutesTable } from '@/components/PageRoutesTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ThemeProvider, useTheme } from '@/components/theme-provider'
import { ModeToggle } from '@/components/mode-toggle'
import { Toaster } from '@/components/ui/sonner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function AppContent() {
  const { theme } = useTheme()
  const lightIcon = '/next-lens-light.svg'
  const darkIcon = '/next-lens-dark.svg'

  const [isDarkMode, setIsDarkMode] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateResolvedTheme = () => {
      const prefersDark =
        theme === 'dark' || (theme === 'system' && mediaQuery.matches)
      setIsDarkMode(prefersDark)
    }

    updateResolvedTheme()

    if (theme !== 'system') return

    mediaQuery.addEventListener('change', updateResolvedTheme)
    return () => mediaQuery.removeEventListener('change', updateResolvedTheme)
  }, [theme])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const favicon =
      document.querySelector<HTMLLinkElement>('link[rel*="icon"]') ??
      document.createElement('link')

    favicon.rel = 'icon'
    favicon.type = 'image/svg+xml'
    favicon.href = isDarkMode ? darkIcon : lightIcon

    if (!favicon.parentElement) document.head.appendChild(favicon)
  }, [isDarkMode, darkIcon, lightIcon])

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] opacity-40" />

      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-6 max-w-7xl">
          <div className="flex items-center gap-3">
            <img
              src={isDarkMode ? darkIcon : lightIcon}
              alt="Next Lens"
              className="h-8 w-8"
            />
            <h1 className="text-lg font-bold tracking-tight">Next Lens</h1>
            <div className="h-4 w-px bg-border mx-1" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-md">
              Inspector
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <a
              href="https://github.com/1weiho/next-lens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-12">
        <Tabs defaultValue="api-routes" className="w-full space-y-8">
          <div className="flex justify-center">
            <TabsList className="h-11 bg-muted/50 p-1 rounded-full shadow-sm border border-border/50 backdrop-blur-md">
              <TabsTrigger
                value="api-routes"
                className="rounded-full px-8 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:text-foreground"
              >
                API Routes
              </TabsTrigger>
              <TabsTrigger
                value="page-routes"
                className="rounded-full px-8 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:text-foreground"
              >
                Page Routes
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="api-routes"
            className="outline-none animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="rounded-2xl border border-border/40 bg-card/50 shadow-xl shadow-black/5 backdrop-blur-sm p-1">
              <div className="bg-background/50 rounded-xl p-6">
                <ApiRoutesTable />
              </div>
            </div>
          </TabsContent>
          <TabsContent
            value="page-routes"
            className="outline-none animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="rounded-2xl border border-border/40 bg-card/50 shadow-xl shadow-black/5 backdrop-blur-sm p-1">
              <div className="bg-background/50 rounded-xl p-6">
                <PageRoutesTable />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="next-lens-theme">
      <QueryClientProvider client={queryClient}>
        <AppContent />
        <Toaster position="top-center" richColors closeButton />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
