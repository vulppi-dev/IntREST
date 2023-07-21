# Vulppi - IntREST

## Core Concepts

1. [Routes](#routes)
2. [Middleware](#middleware)

### Application Structure

IntREST projects follow a specific structure to ensure that your application is easy to understand and maintain. The following diagram shows the basic structure of a IntREST project:

```
assets
├── file.txt
└── image.png
routes
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

The `routes` folder contains all of your application's routes. Each route is defined in a file named `route.ts` inside a folder with the same name as the route. For example, the `routes/my-route/route.ts` file defines the `/my-route` route.

#### Route Parameters

You can define routes with parameters by creating a folder with the parameter name inside the `routes` folder. For example, the `routes/[param]/route.ts` file defines the `/[param]` route and you can access the parameter value using `ctx.params.param`.

#### Catch-All Routes

You can define catch-all routes by creating a folder with the parameter name prefixed with three dots inside the `routes` folder. For example, the `routes/[...catchParam]/route.ts` file defines the `/[...catchParam]` route and you can access the parameter value using `ctx.params.catchParam`.

#### Route Groups

You can define route groups by creating a folder with the group name prefixed with parentheses inside the `routes` folder. For example, the `routes/(my-group)/group/route.ts` file defines the `/group` route. **Note:** If multiple routes conflict because groups and the system finds multiple methods, it will use the first one found.

### Middleware

You can define middleware for a route by creating a file named `middleware.ts` inside the route's folder. For example, the `routes/my-route/middleware.ts` file defines middleware for the `/my-route` route.

The middleware behavior is different from route handlers. Middleware is executed in chain order, and the route handler is executed after all middleware has been executed and call `next` method. If a middleware returns a response, the route handler will not be executed.

## Next Steps

[Usage Guide](./USAGE_GUIDE.md)
