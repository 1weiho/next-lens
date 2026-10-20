import { ButtonLink } from '@/components/landing/button'
import { InstallCommand } from '@/components/landing/install-command'
import { Reveal } from '@/components/landing/reveal'

export function CallToAction() {
  return (
    <section className="border-b border-fd-border">
      <Reveal className="mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center sm:py-32">
        <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-fd-foreground sm:text-5xl">
          Map your routes in seconds.
        </h2>
        <p className="mt-5 max-w-md text-fd-muted-foreground sm:text-lg">
          Free and open source. Run it once — no install, no config.
        </p>
        <InstallCommand className="mt-10 max-w-full" />
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/docs">Read the docs</ButtonLink>
          <ButtonLink
            href="https://github.com/1weiho/next-lens"
            variant="secondary"
          >
            Star on GitHub
          </ButtonLink>
        </div>
      </Reveal>
    </section>
  )
}
