const handlers = {
  GET: () => new Response('user GET'),
  PATCH: () => new Response('user PATCH'),
}

export const { GET, PATCH } = handlers

const removeUser = () => new Response('user DELETE')
export { removeUser as DELETE }

const putHandler = () => new Response('user PUT')
export { putHandler as PUT }

// export const POST = () => new Response('user POST')
