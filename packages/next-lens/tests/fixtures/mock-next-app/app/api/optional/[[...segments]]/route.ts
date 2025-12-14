export const runtime = 'edge'

export async function HEAD() {
  return new Response(null, { status: 204 })
}
