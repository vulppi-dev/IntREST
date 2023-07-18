# Vulppi - IntREST

## Usage Guide

To start using IntREST, you need create routes in app folder. Here's a simple example of routes:

```typescript
import type { IntRequest, IntResponse } from '@vulppi/intrest'

export async function GET(ctx: IntRequest): Promise<IntResponse> {
  return {
    status: 200,
    body: 'Hello World!',
  }
}
```

The `GET` function above demonstrates an example of a route handler that returns a string as the response body.

Here's another example that returns a JSON object:

```typescript
import type { IntRequest, IntResponse } from '@vulppi/intrest'

export async function GET(ctx: IntRequest): Promise<IntResponse> {
  return {
    status: 200,
    body: { text: 'Hello World!' },
  }
}
```

In this case, the `body` property of the response is an object.

If you want to return a response with a Buffer (e.g., for serving images), you can do the following:

```typescript
import type { IntRequest, IntResponse } from '@vulppi/intrest'

const imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAABg...AAASUVORK5CYII='

const image = Buffer.from(imageBase64, 'base64')

export async function GET(ctx: IntRequest): Promise<IntResponse> {
  return {
    status: 200,
    headers: {
      'content-type': 'image/png',
      'content-length': image.length.toString(),
    },
    body: image,
  }
}
```

The `GET` function above returns a response with a Buffer as the body. Make sure to set the appropriate `content-type` header and optionally `content-length` header for the Buffer.

If you want to serve a ReadableStream (e.g., for streaming video or large files), you can do the following:

```typescript
import type { IntRequest, IntResponse } from '@vulppi/intrest'

export async function GET(ctx: IntRequest): Promise<IntResponse> {
  // in ${projectRoot}/assets/video.mp4
  const stream = ctx.assetsStream('video.mp4')

  return {
    status: 200,
    body: stream,
    headers: {
      'Content-Type': 'video/mp4',
    },
  }
}
```

The `GET` function above returns a response with a ReadableStream as the body (you can use other types of `Readable`, as long as it is an extension of the `import('stream').Readable` class). You can use the `assetsStream` function from the `fs` module to create the stream. The stream is automatically read, partial(`Range` in header) or completely, and sent to the client.

The routes above are just examples of how to use IntREST.

## Next Steps

[Configuration](./CONFIGURATIONS.md)
