# Vulppi Kit

## Attention: This version is an alpha version, not recommended for use in production. The beta version will be released soon.

[![npm version](https://badge.fury.io/js/%40vulppi%2Fkit.svg)](https://www.npmjs.com/package/@vulppi/kit)
[![npm downloads](https://img.shields.io/npm/dm/%40vulppi%2Fkit.svg)](https://www.npmjs.com/package/@vulppi/kit)
[![GitHub issues](https://img.shields.io/github/issues/vulppi-dev/kit.svg)](https://github.com/vulppi-dev/kit/issues)
[![GitHub license](https://img.shields.io/github/license/vulppi-dev/kit.svg)](https://github.com/vulppi-dev/kit/blob/main/LICENSE)

Vulppi Kit is a backend framework written in TypeScript, targeting Node.js (version >= 18.0.0). It provides a set of tools and utilities to simplify the development of RESTful APIs by dividing requests into thread workers. This framework aims to enhance the performance and scalability of your Node.js applications.

## Installation

To install Vulppi Kit, you can use npm:

```bash
npm install @vulppi/kit
```

or with Yarn:

```bash
yarn add @vulppi/kit
```

or with PNPM:

```bash
pnpm install @vulppi/kit
```

Choose the package manager you prefer and install the `@vulppi/kit` package accordingly.

## Features

- Divides requests using a thread workers approach
- Simplifies the development of RESTful APIs
- Improves performance and scalability of Node.js applications
- Automatically handles CORS requests
- Automatically detects and parses JSON requests
- Automatically detects and parses URL-encoded requests
- Automatically detects response types (e.g., JSON, Buffer, ReadableStream)

## Usage

To start using Vulppi Kit, you need create routes in app folder. Here's a simple example of routes:

```typescript
import type { RequestContext, ResponseMessage } from '@vulppi/kit'

export async function GET(ctx: RequestContext): Promise<ResponseMessage> {
  return {
    status: 200,
    body: 'Hello World!',
  }
}
```

The `GET` function above demonstrates an example of a route handler that returns a string as the response body.

Here's another example that returns a JSON object:

```typescript
import type { RequestContext, ResponseMessage } from '@vulppi/kit'

export async function GET(ctx: RequestContext): Promise<ResponseMessage> {
  return {
    status: 200,
    body: { text: 'Hello World!' },
  }
}
```

In this case, the `body` property of the response is an object.

If you want to return a response with a Buffer (e.g., for serving images), you can do the following:

```typescript
import type { RequestContext, ResponseMessage } from '@vulppi/kit'

const imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAABg...AAASUVORK5CYII='

const image = Buffer.from(imageBase64, 'base64')

export async function GET(ctx: RequestContext): Promise<ResponseMessage> {
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
import type { RequestContext, ResponseMessage } from '@vulppi/kit'
import { createReadStream } from 'fs'

export async function GET(ctx: RequestContext): Promise<ResponseMessage> {
  const stream = createReadStream('assets/video.mp4')

  return {
    status: 200,
    body: stream,
    headers: {
      'Content-Type': 'video/mp4',
    },
  }
}
```

The `GET` function above returns a response with a ReadableStream as the body (you can use other types of `Readable`, as long as it is an extension of the `import('stream').Readable` class). You can use the `createReadStream` function from the `fs` module to create the stream.

The routes above are just examples of how to use Vulppi Kit.
You can use them as a starting point for your own routes.
The folder structure of your app should look like this:

```
app
├── route.ts
├── my-route
│   ├── route.ts
│   └── middleware.ts
└── my-other-route
    ├── route.ts
    └── middleware.ts
```

The `app` folder is the default folder for your routes. You can change this folder for `src/app` and the framework will automatically detect it.

For more detailed examples and documentation, please refer to the [Vulppi Kit Documentation](https://github.com/vulppi-dev/kit).

## Contributing

Contributions are welcome! If you want to contribute to Vulppi Kit, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with descriptive messages.
4. Push your changes to your forked repository.
5. Submit a pull request to the main repository.
6. And that's it! We will review your pull request as soon as possible.
7. Thank you for contributing to Vulppi Kit! 🎉
8. If you have any questions, feel free to contact us.
9. If you want to contribute more, you can [Buy Us a Coffee](https://www.buymeacoffee.com/morbden) ☕️

## License

This project is licensed under the [MIT License](https://github.com/vulppi-dev/kit/blob/main/LICENSE).

## Contact

For any inquiries or questions, you can reach out to the author:

Renato Rodrigues  
Email: renato@vulppi.dev

---

Thank you for using Vulppi Kit! We hope it helps you build powerful and scalable Node.js applications. If you have any feedback or suggestions, feel free to let us know.

Visit the [Vulppi](https://vulppi.dev) organization site for more information about our projects and services.
