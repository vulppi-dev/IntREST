# Vulppi Kit

[![npm version](https://badge.fury.io/js/%40vulppi%2Fkit.svg)](https://www.npmjs.com/package/@vulppi/kit)
[![npm downloads](https://img.shields.io/npm/dm/%40vulppi%2Fkit.svg)](https://www.npmjs.com/package/@vulppi/kit)
[![GitHub issues](https://img.shields.io/github/issues/vulppi-dev/kit.svg)](https://github.com/vulppi-dev/kit/issues)
[![GitHub license](https://img.shields.io/github/license/vulppi-dev/kit.svg)](https://github.com/vulppi-dev/kit/blob/main/LICENSE)

**Attention:** Please note that the current version of this framework is in the _alpha stage_ and is **not recommended** for production use. We strongly advise against using this version in live environments or critical systems.

A more stable and feature-complete beta version of the framework will be released shortly, which will be better suited for production scenarios. We encourage you to wait for the beta release to ensure a more reliable and robust experience.

In the meantime, you are welcome to explore and experiment with the alpha version for testing and evaluation purposes. Your feedback and suggestions during this phase will be greatly appreciated as they can help us enhance and improve the framework before the final release.

Thank you for your understanding and support as we work towards delivering a high-quality framework for your programming needs.

## Table of Contents

1. [Introduction](#Introduction)
   1. [Key Features](#Key%20Features)
2. [Getting Started](#Getting%20Started)
   1. [Prerequisites](#Prerequisites)
   2. [Automatic Installation](#Automatic%20Installation)
   3. [Manual Installation](#Manual%20Installation)
3. [Core Concepts](#Core%20Concepts)
   1. [Routes](#Routes)
   2. [Middleware](#Middleware)
4. Usage Guide
5. Configuration
6. API Reference
7. Troubleshooting
8. Best Practices and Tips
9. Contributing and Community

## Introduction

Vulppi Kit is a versatile backend framework written in TypeScript, specifically tailored for Node.js (version >= 18.0.0). It provides a range of tools and utilities that streamline the development of RESTful APIs. By employing a file-system-based approach, Vulppi Kit simplifies route handling by mapping the application's routes to its file structure, enhancing code organization and promoting simplicity.

### Key Features

- **Thread Workers:** Divides requests into thread workers, optimizing resource utilization and improving overall performance.
- **RESTful API Development:** Simplifies the process of building robust and efficient RESTful APIs.
- **File-System Based Routing:** Routes within the application are determined by the file structure, ensuring a clean and intuitive approach to defining API endpoints.
- **Performance and Scalability:** Enhances the performance and scalability of Node.js applications, accommodating high volumes of traffic seamlessly.
- **CORS Handling:** Automatically manages Cross-Origin Resource Sharing (CORS) requests, simplifying integration with external clients.
- **Request Parsing:** Automatically detects and parses JSON and URL-encoded requests, eliminating the need for manual parsing.
- **Response Type Detection:** Intelligently identifies the response type, supporting JSON, Buffer, String, or ReadableStream, facilitating integration with various client applications.

With Vulppi Kit, you can expedite your backend development, streamline code organization through file-system-based routing, and deliver high-performance RESTful APIs effortlessly. Let's delve into the details of utilizing this framework to harness its true potential.

## Getting Started

### Prerequisites

Before you begin, ensure that your system meets the following requirements:

- [Node.js 18.0.0](https://nodejs.org/) or a later version.
- Supported operating systems include macOS, Windows (including WSL), and Linux.

### Automatic Installation

Follow the steps below to set up a Vulppi Kit project using your preferred package manager:

#### 1. Create a Directory

Create a directory for your project and navigate into it:

```bash
mkdir <your-project-folder>
cd <your-project-folder>
```

#### 2. Initialize the Project

Use your chosen package manager to initialize a new Vulppi Kit project:

With npm:

```bash
npx @vulppi/kit create
```

With pnpm:

```bash
pnpx @vulppi/kit create
```

With yarn:

```bash
npx @vulppi/kit create --yarn
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

The development server will spin up, and you can now start building your Vulppi Kit application.

By following these steps, you'll have a Vulppi Kit project up and running, ready for you to begin developing your RESTful APIs with ease.

---

### Manual Installation

To manually install `@vulppi/kit`, follow these steps:

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
  "exclude": ["node_modules", ".vulppi"],
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

#### 4. Install Vulppi Kit

Install `@vulppi/kit` using your chosen package manager:

With npm:

```bash
npm install @vulppi/kit
```

With pnpm:

```bash
pnpm install @vulppi/kit
```

With yarn:

```bash
yarn add @vulppi/kit
```

This will install Vulppi Kit as a dependency in your project.

#### 5. Add Scripts

Open your `package.json` file and add the `"type": "module"` field to enable ES modules. Then, add the following scripts to the `"scripts"` section:

```json
{
  // ...
  "type": "module",
  "scripts": {
    "dev": "vulppi dev",
    "build": "vulppi build",
    "start": "vulppi start"
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

import type { RequestContext, ResponseMessage } from '@vulppi/kit'

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

With these steps, you've manually installed Vulppi Kit, configured TypeScript, and set up your first route. You can now start building your Vulppi Kit application and explore the framework's capabilities.

<!-- TODO: -->

## Core Concepts

Vulppi Kit uses file-system routing, which means how you structure your files determines the routes in your application.

```
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
```

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

export async function GET(ctx: RequestContext): Promise<ResponseMessage> {
  // in ${projectRoot}/assets/video.mp4
  const stream = ctx.fileStream('video.mp4')

  return {
    status: 200,
    body: stream,
    headers: {
      'Content-Type': 'video/mp4',
    },
  }
}
```

The `GET` function above returns a response with a ReadableStream as the body (you can use other types of `Readable`, as long as it is an extension of the `import('stream').Readable` class). You can use the `fileStream` function from the `fs` module to create the stream.

The routes above are just examples of how to use Vulppi Kit.
You can use them as a starting point for your own routes.
The folder structure of your app should look like this:

```
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
