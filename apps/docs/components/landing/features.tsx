import {
  Braces,
  FileText,
  FolderTree,
  Layers,
  Webhook,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { Reveal } from '@/components/landing/reveal'
import { SectionHeading } from '@/components/landing/section-heading'

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Webhook,
    title: 'API routes',
    description:
      'Every route.ts in app/api, with its exported HTTP handlers detected — GET, POST, PUT, PATCH, DELETE and more.',
  },
  {
    icon: FileText,
    title: 'Page routes',
    description:
      'Every page with its loading and error boundaries marked as co-located, inherited, or missing.',
  },
  {
    icon: Braces,
    title: 'Dynamic segments',
    description:
      'Dynamic, catch-all and optional catch-all params are highlighted so route shapes read at a glance.',
  },
  {
    icon: Layers,
    title: 'Stack snapshot',
    description:
      'Next.js, React and Node versions plus the package manager, reported in a single command.',
  },
  {
    icon: Zap,
    title: 'Zero runtime',
    description:
      'Pure static analysis of your file tree. No dev server, no build step, no config file.',
  },
  {
    icon: FolderTree,
    title: 'Any directory',
    description:
      'Point it at any path. Ideal for monorepos with several Next.js apps side by side.',
  },
]

export function Features() {
  return (
    <section id="features" className="border-b border-fd-border">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <Reveal>
          <SectionHeading
            eyebrow="Features"
            title="Your route map, without the guesswork."
            description="next-lens reads the App Router conventions so you don't have to click through folders to understand how your app is wired."
          />
        </Reveal>

        <Reveal
          delay={0.05}
          className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-fd-border bg-fd-border sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <div key={feature.title} className="bg-fd-background p-8">
              <feature.icon
                className="h-5 w-5 text-fd-foreground"
                strokeWidth={1.75}
              />
              <h3 className="mt-6 font-medium text-fd-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
