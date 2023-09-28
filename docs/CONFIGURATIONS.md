# Vulppi - IntREST

## Configuration

IntREST uses a configuration file to define the application's settings, but is optional. The configuration file must be named `intrest.config.mjs` and must be located in the root directory of the project. Here's an example of a configuration file:

```javascript
/**
 * @type {import('@vulppi/intrest').Config}
 */
export default {
  port: 4000,
  removeUploadFilesAfterResponse: false,
  folders: {
    uploadTemp: '.tmp',
    tsConfig: 'tsconfig.json',
  },
  limits: {
    bodyMaxSize: '10mb',
    allowOrigin: undefined, // Can be enable by setting `string` or `string[]`
    allowHeaders: undefined, // Can be enable by setting `string[]`
    minWorkerPoolSize: 5
    maxWorkerPoolSize: 20,
    middleware: {
      timeout: 5000,
    }
  },
  messages: {
    INTERNAL_SERVER_ERROR: 'Internal server error',
    NOT_FOUND: 'Not found',
    METHOD_NOT_ALLOWED: 'Method not allowed',
    REQUEST_TOO_LONG: 'Request entity too large',
    UNSUPPORTED_MEDIA_TYPE: 'Unsupported media type',
  },
  env: {
    NODE_ENV: 'development',
    HOST: 'localhost',
  },
}
```

## Next Steps

[API Reference](./API_REFERENCE.md)
