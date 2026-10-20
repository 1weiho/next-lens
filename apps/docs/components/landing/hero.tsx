import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ButtonLink } from '@/components/landing/button'
import { InstallCommand } from '@/components/landing/install-command'
import { Reveal } from '@/components/landing/reveal'

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-fd-border">
      {/* Grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-fd-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-fd-border)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60 mask-[radial-gradient(ellipse_70%_55%_at_50%_0%,#000_40%,transparent_100%)]"
      />

      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-20 text-center sm:pt-28">
        <Reveal>
          <Link
            href="/docs/raycast"
            className="group inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-background px-3 py-1 text-xs text-fd-muted-foreground transition-colors hover:text-fd-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Raycast extension is now available
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="mt-8 max-w-3xl text-4xl font-semibold tracking-tight text-fd-foreground sm:text-6xl sm:leading-[1.05]">
            See every route in your Next.js app.
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-fd-muted-foreground sm:text-lg">
            next-lens scans your App Router project and maps every page and API
            route — in the terminal, a local inspector, your AI editor, or
            Raycast. No dev server required.
          </p>
        </Reveal>

        <Reveal
          delay={0.15}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <ButtonLink href="/docs/quickstart">
            Get started
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <InstallCommand />
        </Reveal>

        <Reveal delay={0.25} className="mt-16 w-full sm:mt-20">
          <div className="rounded-2xl border border-fd-border bg-fd-secondary/50 p-1.5 shadow-[0_24px_64px_-24px_rgb(0_0_0/0.18)] sm:p-2">
            <div className="overflow-hidden rounded-xl border border-fd-border">
              <Image
                src="/images/inspector-ui.png"
                alt="next-lens inspector listing API routes"
                width={2978}
                height={1560}
                priority
                sizes="(min-width: 1152px) 1152px, 100vw"
                className="block h-auto w-full dark:hidden"
              />
              <Image
                src="/images/inspector-ui-dark.png"
                alt="next-lens inspector listing API routes"
                width={2978}
                height={1560}
                priority
                sizes="(min-width: 1152px) 1152px, 100vw"
                className="hidden h-auto w-full dark:block"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
