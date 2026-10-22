import Link from 'next/link'
import { Logo } from '@/lib/layout.shared'

const links = [
  { label: 'Docs', href: '/docs' },
  { label: 'Quickstart', href: '/docs/quickstart' },
  { label: 'GitHub', href: 'https://github.com/1weiho/next-lens' },
  { label: 'npm', href: 'https://www.npmjs.com/package/next-lens' },
  { label: 'Raycast', href: 'https://www.raycast.com/1weiho/next-lens' },
]

export function Footer() {
  return (
    <footer>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="text-sm text-fd-muted-foreground">
            MIT License © {new Date().getFullYear()} Yiwei Ho
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fd-muted-foreground">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-fd-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
