# Vulppi - IntREST

## Core Concepts

1. [Routes](#routes)
2. [Middleware](#middleware)
3. [Bootstrap](#bootstrap)
4. [Assets files](#assets-files)
5. [Static files](#static-files)

### Application Structure

IntREST projects follow a specific structure to ensure that your application is easy to understand and maintain. The following diagram shows the basic structure of a IntREST project:

```
assets (optional)
├── file.txt
└── image.png
static (optional)
├── file.txt
└── image.png
routes
├── bootstrap.ts
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
app.d.ts (optional)
intrest.config.mjs (optional)

```

### Routes

The `routes` folder contains all of your application's entries. Each route is defined in a file named `route.ts` inside a folder with the same name as the route. For example, the `routes/my-route/route.ts` or `src/routes/my-route/route.ts` file defines the `/my-route` route.

#### Route Methods

You can define multiple methods for a route by exporting multiple functions from the route file. For example, the `routes/my-route/route.ts` file defines the `/my-route` route with `GET` and `POST` methods in example below.

```ts
// src/routes/my-route/route.ts

import type { IntRequest, IntResponse } from '@vulppi/intrest'

export async function GET(ctx: IntRequest): Promise<IntResponse> {
  return {
    status: 200,
    body: 'Hello World!',
  }
}

export async function POST(ctx: IntRequest): Promise<IntResponse> {
  return {
    status: 200,
    body: 'Hello World!',
  }
}
```

#### Route Parameters

You can define routes with parameters by creating a folder with the parameter name inside the `routes` folder. For example, the `routes/[param]/route.ts` file defines the `/[param]` route and you can access the parameter value using `ctx.params.param`.

#### Catch-All Routes

You can define catch-all routes by creating a folder with the parameter name prefixed with three dots inside the `routes` folder. For example, the `routes/[...catchParam]/route.ts` file defines the `/[...catchParam]` route and you can access the parameter value using `ctx.params.catchParam`.

#### Route Groups

You can define route groups by creating a folder with the group name prefixed with parentheses inside the `routes` folder. For example, the `routes/(my-group)/group/route.ts` file defines the `/group` route. **Note:** If multiple routes conflict because groups and the system finds multiple methods, it will use the first one found.

### Middleware

Middleware is a entry too in the `routes` folder. You can define middleware for a route by creating a file named `middleware.ts` inside the route's folder. For example, the `routes/my-route/middleware.ts` file defines middleware for the `/my-route` route.

The middleware behavior is different from route handlers. Middleware is executed in chain order, and the route handler is executed after all middleware has been executed and call `next` method. **The middleware must be return a response**, came from `next` method or not. When middleware not call `next` method, the chain is broken and the route handler is not executed. And if the `next` method is not called, it's throw an error of timeout. The default timeout is `5` seconds, but you can change it in the `intrest.config.mjs` file.

Simple middleware example:

```ts
// src/routes/my-route/middleware.ts

import type { IntRequest, IntResponse, MiddlewareNext } from '@vulppi/intrest'

export async function middleware(
  ctx: IntRequest,
  next: MiddlewareNext,
): Promise<IntResponse | void> {
  if (ctx.query.has('error')) {
    return {
      status: 400,
      body: 'Bad Request',
    }
  }
  // Call next middleware or route handler
  return next()
  // Or send custom data to next middleware or route handler
  return next({ user: { name: 'John' } })
}
```

### Bootstrap

You can define bootstrap by creating a file named `bootstrap.ts` inside the route's root folder. For example, the `routes/bootstrap.ts` or `src/routes/bootstrap.ts`. File defines bootstrap exported function with name `bootstrap`.

> **Note:** In your projects you can only have one bootstrap file!
> Bootstrap is executed before the server starts and only once. If you want to execute something before each request, use middleware.

Simple bootstrap example:

```ts
// src/routes/bootstrap.ts

import type { Config } from '@vulppi/intrest'

export async function bootstrap(config: Config): Promise<void> {
  // Do something
}
```

## Assets files

The `assets` folder contains all of your application's assets files. For example, the `assets/file.txt` or `src/assets/file.txt` file defines the `/file.txt` route.

You can access the file using the methods in this package.
Are they: [assetsStream](./API_REFERENCE.md), [assetsRawContent](./API_REFERENCE.md), [assetsContent](./API_REFERENCE.md).

## Static files

The `static` folder contains all of your application's static files. For example, the `static/file.txt` or `src/static/file.txt` file defines the `/file.txt` route.

## Next Steps

[Usage Guide](./USAGE_GUIDE.md)
