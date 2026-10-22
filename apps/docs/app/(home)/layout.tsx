import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { baseOptions } from '@/lib/layout.shared'

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <HomeLayout
      {...baseOptions()}
      links={[
        { text: 'Docs', url: '/docs', active: 'nested-url' },
        { text: 'Features', url: '/#features' },
        { text: 'Interfaces', url: '/#interfaces' },
      ]}
    >
      {children}
    </HomeLayout>
  )
}
