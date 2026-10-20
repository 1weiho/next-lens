import { Reveal } from '@/components/landing/reveal'
import { SectionHeading } from '@/components/landing/section-heading'
import { ScanAnimation } from '@/components/scan-animation'

const steps = [
  {
    title: 'Run one command',
    description:
      'Run next-lens in your project root, or pass any directory — handy for monorepos.',
  },
  {
    title: 'Scan the app directory',
    description:
      'next-lens walks app/, follows the App Router conventions and reads exported handlers. Nothing is executed.',
  },
  {
    title: 'Explore your routes',
    description:
      'Browse, search and jump to source from the interface you already have open.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-fd-border">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 py-24 sm:py-32 lg:grid-cols-2">
        <div>
          <Reveal>
            <SectionHeading
              eyebrow="How it works"
              title="From folder tree to route map in seconds."
            />
          </Reveal>

          <Reveal delay={0.05}>
            <ol className="mt-12 space-y-8">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-fd-border font-mono text-xs text-fd-muted-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-medium text-fd-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-fd-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <ScanAnimation />
        </Reveal>
      </div>
    </section>
  )
}
