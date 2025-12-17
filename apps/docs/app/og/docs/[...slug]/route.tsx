import { getPageImage, source } from '@/lib/source'
import { notFound } from 'next/navigation'
import { ImageResponse } from 'next/og'

export const revalidate = false

export async function GET(
  req: Request,
  { params }: RouteContext<'/og/docs/[...slug]'>,
) {
  const { slug } = await params
  const page = source.getPage(slug.slice(0, -1))
  if (!page) notFound()

  const background = new URL('/images/og-background.png', req.url).toString()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 24,
          padding: 136,
          color: '#0b1021',
          backgroundImage: `url(${background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: '80%',
          }}
        >
          {page.data.title}
        </div>
        {page.data.description ? (
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.3,
              maxWidth: '80%',
              opacity: 0.9,
            }}
          >
            {page.data.description}
          </div>
        ) : null}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }))
}
