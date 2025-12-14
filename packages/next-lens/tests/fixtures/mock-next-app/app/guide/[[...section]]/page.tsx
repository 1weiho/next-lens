type GuidePageProps = {
  params: {
    section?: string[]
  }
}

export default function GuidePage({ params }: GuidePageProps) {
  return <div>{params.section?.join('/') ?? 'overview'}</div>
}
