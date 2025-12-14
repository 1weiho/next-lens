type DocsPageProps = {
  params: {
    segments: string[]
  }
}

export default function DocsCatchAllPage({ params }: DocsPageProps) {
  return <section>{params.segments.join('/')}</section>
}
