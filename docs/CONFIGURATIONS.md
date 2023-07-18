# Vulppi - IntREST

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
    minWorkerPoolSize: 5
    maxWorkerPoolSize: 20,
  },
  messages: {
    INTERNAL_SERVER_ERROR: 'Internal Server Error',
    NOT_FOUND: 'Not Found',
    METHOD_NOT_ALLOWED: 'Method Not Allowed',
    REQUEST_TOO_LONG: 'Request entity too large',
  },
  env: {
    NODE_ENV: 'development',
    HOST: 'localhost',
  },
}
```

## Next Steps

[API Reference](./API_REFERENCE.md)
