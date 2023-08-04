# Vulppi - IntREST

## Best Practices and Tips

- Use package `http-status-codes` for HTTP status codes. It's a simple and easy to use package and turn your code more readable.
- User middleware for Authorization and Authentication forwards for route handlers the user data.
- Use `async` and `await` for asynchronous operations.
- Use `parseCompressBuffer` and `parseCompressStream` for parsing and compressing data like images and texts.
- Don't use global variables. This framework has many workers and each worker has its own global variables and they are not shared between workers.
- If you want to use global variables, use `-s` or `--single-mode` flag for running the framework. This flag runs the framework in single mode and the application runs in a single worker.

## Next Steps

[Contributing and Community](../README.md#contributing-and-community)
