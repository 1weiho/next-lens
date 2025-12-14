type BlogPageProps = {
  params: {
    slug: string
  }
}

export default function BlogPostPage({ params }: BlogPageProps) {
  return <article>{params.slug}</article>
}
