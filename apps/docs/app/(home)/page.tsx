import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col justify-center text-center flex-1">
      <h1 className="text-2xl font-bold mb-4">next-lens documentation</h1>
      <p className="mb-2">
        Explore how to scan Next.js App Router routes, launch the inspector UI,
        and expose data via MCP.
      </p>
      <p>
        Start with{' '}
        <Link href="/docs/quickstart" className="font-medium underline">
          Quickstart
        </Link>{' '}
        or browse all guides at{' '}
        <Link href="/docs" className="font-medium underline">
          /docs
        </Link>
        .
      </p>
    </div>
  );
}
