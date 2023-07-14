# Vulppi - IntREST

[![npm version](https://badge.fury.io/js/%40vulppi%2Fintrest.svg)](https://www.npmjs.com/package/@vulppi/intrest)
[![npm downloads](https://img.shields.io/npm/dm/%40vulppi%2Fintrest.svg)](https://www.npmjs.com/package/@vulppi/intrest)
[![GitHub issues](https://img.shields.io/github/issues/vulppi-dev/intrest.svg)](https://github.com/vulppi-dev/intrest/issues)
[![GitHub license](https://img.shields.io/github/license/vulppi-dev/intrest.svg)](https://github.com/vulppi-dev/intrest/blob/main/LICENSE)

**Attention:** Please note that the current version of this framework is in the _alpha stage_ and is **not recommended** for production use. We strongly advise against using this version in live environments or critical systems.

A more stable and feature-complete beta version of the framework will be released shortly, which will be better suited for production scenarios. We encourage you to wait for the beta release to ensure a more reliable and robust experience.

In the meantime, you are welcome to explore and experiment with the alpha version for testing and evaluation purposes. Your feedback and suggestions during this phase will be greatly appreciated as they can help us enhance and improve the framework before the final release.

Thank you for your understanding and support as we work towards delivering a high-quality framework for your programming needs.

## Table of Contents

1. [Introduction](#introduction)
   1. [Key Features](#key-features)
2. [Getting Started](#getting-started)
   1. [Prerequisites](#prerequisites)
   2. [Automatic Installation](#automatic-installation)
   3. [Manual Installation](#manual-installation)
3. [Core Concepts](#core-concepts)
   1. [Routes](#routes)
   2. [Middleware](#middleware)
4. [Usage Guide](#usage-guide)
5. [Configuration](#configuration)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices and Tips](#best-practices-and-tips)
9. [Contributing and Community](#contributing-and-community)
10. [License](#license)
11. [Contact](#contact)

## Introduction

IntREST is a versatile backend framework written in TypeScript, specifically tailored for Node.js (version >= 18.0.0). It provides a range of tools and utilities that streamline the development of RESTful APIs. By employing a file-system-based approach, IntREST simplifies route handling by mapping the application's routes to its file structure, enhancing code organization and promoting simplicity.

### Key Features

- **Thread Workers:** Divides requests into thread workers, optimizing resource utilization and improving overall performance.
- **RESTful API Development:** Simplifies the process of building robust and efficient RESTful APIs.
- **File-System Based Routing:** Routes within the application are determined by the file structure, ensuring a clean and intuitive approach to defining API endpoints.
- **Performance and Scalability:** Enhances the performance and scalability of Node.js applications, accommodating high volumes of traffic seamlessly.
- **CORS Handling:** Automatically manages Cross-Origin Resource Sharing (CORS) requests, simplifying integration with external clients.
- **Request Parsing:** Automatically detects and parses JSON and URL-encoded requests, eliminating the need for manual parsing.
- **Response Type Detection:** Intelligently identifies the response type, supporting JSON, Buffer, String, or ReadableStream, facilitating integration with various client applications.

With IntREST, you can expedite your backend development, streamline code organization through file-system-based routing, and deliver high-performance RESTful APIs effortlessly. Let's delve into the details of utilizing this framework to harness its true potential.

## Getting Started

### Prerequisites

Before you begin, ensure that your system meets the following requirements:

- [Node.js 18.0.0](https://nodejs.org/) or a later version.
- Supported operating systems include macOS, Windows (including WSL), and Linux.

### Automatic Installation

Follow the steps below to set up a IntREST project using your preferred package manager:

#### 1. Create a Directory

Create a directory for your project and navigate into it:

```bash
mkdir <your-project-folder>
cd <your-project-folder>
```

#### 2. Initialize the Project

Use your chosen package manager to initialize a new IntREST project:

With npm:

```bash
npx @vulppi/intrest create
```

With pnpm:

```bash
pnpx @vulppi/intrest create
```

With yarn:

```bash
npx @vulppi/intrest create --yarn
```

This command sets up the necessary project structure and installs the required dependencies.

#### 3. Run the Development Server

Start the development server by running the `dev` script with your package manager:

With npm:

```bash
npm run dev
```

With pnpm:

```bash
pnpm dev
```

With yarn:

```bash
yarn dev
```

The development server will spin up, and you can now start building your IntREST application.

By following these steps, you'll have a IntREST project up and running, ready for you to begin developing your RESTful APIs with ease.

---

### Manual Installation

To manually install `@vulppi/intrest`, follow these steps:

#### 1. Create a New Project

Start by creating a new Node.js project using the following terminal commands:

```bash
mkdir <your-project-folder>
cd <your-project-folder>
npm init -y
```

This will create a new directory for your project and initialize a `package.json` file.

#### 2. Install TypeScript

Next, install TypeScript and the TypeScript types for Node.js using your preferred package manager. Run one of the following commands:

With npm:

```bash
npm install -D typescript @types/node
```

With pnpm:

```bash
pnpm install -D typescript @types/node
```

With yarn:

```bash
yarn add -D typescript @types/node
```

This will install TypeScript as a development dependency and ensure that you have the necessary types for Node.js.

#### 3. Configure TypeScript

In the root of your project, create a `tsconfig.json` file by running the following command:

```bash
touch tsconfig.json
```

Open the `tsconfig.json` file and add the following configuration:

```json
{
  "include": ["**/*.ts"],
  "exclude": ["node_modules", ".intrest"],
  "compilerOptions": {
    "module": "ESNext",
    "target": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "strict": true,
    "verbatimModuleSyntax": true,
    "declaration": true,
    "emitDeclarationOnly": true,
    "allowJs": true,
    "checkJs": false
  }
}
```

This configuration ensures that TypeScript is set up correctly for your project.

#### 4. Install IntREST

Install `@vulppi/intrest` using your chosen package manager:

With npm:

```bash
npm install @vulppi/intrest
```

With pnpm:

```bash
pnpm install @vulppi/intrest
```

With yarn:

```bash
yarn add @vulppi/intrest
```

This will install IntREST as a dependency in your project.

#### 5. Add Scripts

Open your `package.json` file and add the `"type": "module"` field to enable ES modules. Then, add the following scripts to the `"scripts"` section:

```json
{
  // ...
  "type": "module",
  "scripts": {
    "dev": "irest dev",
    "build": "irest build",
    "start": "irest start"
  }
  // ...
}
```

These scripts will enable you to run the development server, build your project, and start the server.

#### 6. Create Your First Route

Create a file called `route.ts` inside a folder named `app` in your project directory:

```
app
└── route.ts
package.json
tsconfig.json
```

Open the `route.ts` file and add the following content:

```ts
// ./app/route.ts

import type { RequestContext, ResponseMessage } from '@vulppi/intrest'

export async function GET(ctx: RequestContext): Promise<ResponseMessage> {
  return {
    status: 200,
    body: 'Hello World!',
  }
}
```

This code defines a basic route handler that responds with a "Hello World!" message.

#### 7. Run the Development Server

Start the development server by running the `dev` script using your package manager of choice:

With npm:

```bash
npm run dev
```

With pnpm:

```bash
pnpm dev
```

With yarn:

```bash
yarn dev
```

The development server will start, and you can access your application at the specified port.

With these steps, you've manually installed IntREST, configured TypeScript, and set up your first route. You can now start building your IntREST application and explore the framework's capabilities.

## Core Concepts

### Application Structure

IntREST projects follow a specific structure to ensure that your application is easy to understand and maintain. The following diagram shows the basic structure of a IntREST project:

```
assets
├── file.txt
└── image.png
app
├── route.ts
├── my-route
│   ├── route.ts
│   └── middleware.ts
├── my-other-route
│   ├── route.ts
│   └── middleware.ts
├── [param]
│   ├── route.ts
│   └── middleware.ts
├── [...catchParam]
│   ├── route.ts
│   └── middleware.ts
├── (my-reader-group)
│   └── group
│       └── route.ts (GET)
└── (my-writer-group)
    └── group
        └── route.ts (POST, PUT, DELETE)
package.json
tsconfig.json
intrest.config.mjs (optional)

```

### Routes

The `app` folder contains all of your application's routes. Each route is defined in a file named `route.ts` inside a folder with the same name as the route. For example, the `app/my-route/route.ts` file defines the `/my-route` route.

#### Route Parameters

You can define routes with parameters by creating a folder with the parameter name inside the `app` folder. For example, the `app/[param]/route.ts` file defines the `/[param]` route and you can access the parameter value using `ctx.params.param`.

#### Catch-All Routes

You can define catch-all routes by creating a folder with the parameter name prefixed with three dots inside the `app` folder. For example, the `app/[...catchParam]/route.ts` file defines the `/[...catchParam]` route and you can access the parameter value using `ctx.params.catchParam`.

#### Route Groups

You can define route groups by creating a folder with the group name prefixed with parentheses inside the `app` folder. For example, the `app/(my-group)/group/route.ts` file defines the `/group` route. **Note:** If multiple routes conflict because groups, if the system finds multiple methods, it will throw an error.

### Middleware

You can define middleware for a route by creating a file named `middleware.ts` inside the route's folder. For example, the `app/my-route/middleware.ts` file defines middleware for the `/my-route` route.

The middleware behavior is different from route handlers. Middleware is executed in chain order, and the route handler is executed after all middleware has been executed and call `next` method. If a middleware returns a response, the route handler will not be executed.

## Usage Guide

To start using IntREST, you need create routes in app folder. Here's a simple example of routes:

```typescript
import type { RequestContext, ResponseMessage } from '@vulppi/intrest'

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
import type { RequestContext, ResponseMessage } from '@vulppi/intrest'

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
import type { RequestContext, ResponseMessage } from '@vulppi/intrest'

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
import type { RequestContext, ResponseMessage } from '@vulppi/intrest'

export async function GET(ctx: RequestContext): Promise<ResponseMessage> {
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

The `GET` function above returns a response with a ReadableStream as the body (you can use other types of `Readable`, as long as it is an extension of the `import('stream').Readable` class). You can use the `assetsStream` function from the `fs` module to create the stream.

The routes above are just examples of how to use IntREST.

## Configuration

IntREST uses a configuration file to define the application's settings, but is optional. The configuration file must be named `intrest.config.mjs` and must be located in the root directory of the project. Here's an example of a configuration file:

```javascript
/**
 * @type {import('@vulppi/intrest').Config}
 */
export default {
  port: 4000,
  folders: {
    uploadTemp: '.tmp',
  },
  limits: {
    bodyMaxSize: '1mb',
    cors: ['*'],
  },
  messages: {
    INTERNAL_SERVER_ERROR: 'Internal Server Error',
    NOT_FOUND: 'Not Found',
    METHOD_NOT_ALLOWED: 'Method Not Allowed',
    MULTIPLE_ROUTES: 'Multiple routes found',
    REQUEST_TOO_LONG: 'Request entity too large',
  },
  env: {
    NODE_ENV: 'development',
    HOST: 'localhost',
  },
}
```

## API Reference

The IntREST API is simple and easy to use. Has 4 main interfaces:

- `RequestContext`
- `ResponseMessage`
- `MiddlewareNext`

### RequestContext

The `RequestContext` interface is the input interface of IntREST. It contains all the information about the request.

#### Properties

- `method`: The HTTP method of the request. They are `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- `path`: The path of the request.
- `params`: The object of parameters of the request.
- `query`: The object of query parameters of the request. Using `URLSearchParams` API.
- `headers`: The object of headers of the request.
- `body`: The body of the request. Can be a `string` or `object`.
  - The `body` property is only available if the request has a body and the method is not `GET`.
  - If the request `Content-Type` is `multipart/form-data` and contains upload files, the `body` property will be contains a file metadata stored with name of the field. The metadata interface is `FileMetadata`.
- `assetsStream`: The function to get a file stream from the `assets` folder, fonded in root directory of the project.
- `cookies`: The object of cookies of the request. Using `cookie` API.
- `custom`: The object of custom properties of the request. You can use this for share data between middlewares and route handlers.

### ResponseMessage

The `ResponseMessage` interface is the output interface of IntREST. It contains all the information about the response.

#### Properties

- `status`: The HTTP status code of the response.
- `headers`: The object of headers of the response.
- `body`: The body of the response. Can be a `string`, `object`, `Buffer` or `ReadableStream`.
  - The `body` property is only available if the response has a body.
  - If the response `body` is a `object`, the `Content-Type` header will be set to `application/json` if not exists.
  - If the response `body` is a `Buffer` or a `string`, the `Content-Type` header will be set to `plain/text` if not exists.
  - If the response `body` is a `ReadableStream`, the `Content-Type` header will be set to `application/octet-stream` if not exists.
- `cookies`: The object of cookies of the response.
- `clearCookie`: The object of clear cookies of the response.

### MiddlewareNext

The `MiddlewareNext` interface call the next middleware or route handler. If you send object in this function, the object will be merged with the property `custom` of the `RequestContext` interface.

#### Properties

- `custom`: The object of custom properties of the request. You can use this for share data between middlewares and route handlers.

## Troubleshooting

No troubleshooting yet. If you have any problems, please contact us.

## Best Practices and Tips

- Use package `http-status-codes` for HTTP status codes. It's a simple and easy to use package and turn your code more readable.

## Contributing and Community

Contributions are welcome! If you want to contribute to IntREST, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with descriptive messages.
4. Push your changes to your forked repository.
5. Submit a pull request to the main repository.
6. And that's it! We will review your pull request as soon as possible.
7. Thank you for contributing to IntREST! 🎉
8. If you have any questions, feel free to contact us.
9. If you want to contribute more, you can [Buy Us a Coffee](https://www.buymeacoffee.com/morbden) ☕️

## License

This project is licensed under the [MIT License](https://github.com/vulppi-dev/intrest/blob/main/LICENSE).

## Contact

For any inquiries or questions, you can reach out to the author:

Renato Rodrigues  
Email: renato@vulppi.dev

---

Thank you for using IntREST! We hope it helps you build powerful and scalable Node.js applications. If you have any feedback or suggestions, feel free to let us know.

Visit the [Vulppi](https://vulppi.dev) organization site for more information about our projects and services.
