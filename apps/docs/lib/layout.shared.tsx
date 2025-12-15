import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import Image from 'next/image'

function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex h-7 w-7 items-center justify-center">
        <Image
          src="/next-lens-light.svg"
          alt="next-lens"
          width={28}
          height={28}
          className="dark:hidden"
          priority
        />
        <Image
          src="/next-lens-dark.svg"
          alt="next-lens"
          width={28}
          height={28}
          className="hidden dark:block"
          priority
        />
      </span>
      <span className="text-lg font-semibold leading-none">next-lens</span>
    </span>
  )
}

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <Logo />,
    },
  }
}
