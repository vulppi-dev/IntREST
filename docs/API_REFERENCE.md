# Vulppi - IntREST

## API Reference

The IntREST API is simple and easy to use. Has 4 main interfaces:

### Interfaces

- [`IntRequest`](#intrequest)
- [`IntResponse`](#intresponse)
- [`MiddlewareNext`](#middlewarenext)

### Methods

- `assetsStream`: The function to get a file stream from the `assets` folder, founded in root directory of the project. Receive two parameters:
  - `path`: The path of the file in `assets` folder.
  - `compress`: Possible values are `gzip`, `deflate`, `gzip, deflate` and `deflate, gzip`. If you don't want to compress the file, just set nothing in this parameter.
- `assetsRawContent`: The function to get a file raw content (`Buffer`) from the `assets` folder, founded in root directory of the project. Receive two parameters:
  - `path`: The path of the file in `assets` folder.
  - `compress`: Possible values are `gzip`, `deflate`, `gzip, deflate` and `deflate, gzip`. If you don't want to compress the file, just set nothing in this parameter.
- `assetsContent`: The function to get a file content (`string`) from the `assets` folder, founded in root directory of the project.
- `parseCompressBuffer`: The function to parse a compressed buffer. Receive two parameters:
  - `buffer`: The buffer to parse.
  - `encoding`: Is a array of values `gzip` and `deflate`.
- `parseCompressStream`: The function to parse a compressed stream piping. Receive two parameters:
  - `stream`: The stream to parse.
  - `encoding`: Is a array of values `gzip` and `deflate`.
- `parseDecompressBuffer`: The function to parse a decompressed buffer. Receive two parameters:
  - `buffer`: The buffer to parse.
  - `encoding`: Is a array of values `gzip` and `deflate`.
- `parseDecompressStream`: The function to parse a decompressed stream piping. Receive two parameters:
  - `stream`: The stream to parse.
  - `encoding`: Is a array of values `gzip` and `deflate`.

## IntRequest

The `IntRequest` interface is the input interface of IntREST. It contains all the information about the request.

### Properties

- `method`: The HTTP method of the request. They are `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- `path`: The path of the request.
- `params`: The object of parameters of the request.
- `query`: The object of query parameters of the request. Using `URLSearchParams` API.
- `headers`: The object of headers of the request.
- `body`: The body of the request. It's a `object`.
  - The `body` property is only available if the request has a body and the method is not `GET`.
  - If the request `Content-Type` is `multipart/form-data` and contains upload files, the `body` property will be contains a file metadata stored with name of the field. The metadata interface is `FileMetadata`.
  - If the request `Content-Type` is `application/xml`, the `body` property will be contains a object with the XML data following the type `import('@vulppi/intrest).XMLBody`.
- `cookies`: The object of cookies of the request. Using `cookie` API.
- `cookiesMeta`: The object of cookies metadata of the request. Using `cookie` API.
- `custom`: The object of custom properties of the request. You can use this for share data between middlewares and route handlers.
- `origin`: The origin of the request. It's a `object` containing the `url` and `ip` properties.
  - `url`: The origin URL of the request. It's a `URL` object.
  - `ip`: The origin IP of the request. It's a `string`.

## IntResponse

The `IntResponse` interface is the output interface of IntREST. It contains all the information about the response.

### Properties

- `status`: The HTTP status code of the response.
- `headers`: The object of headers of the response.
- `body`: The body of the response. Can be a `string`, `object`, `Buffer` or `ReadableStream`.
  - The `body` property is only available if the response has a body.
  - If the response `body` is a `object`, the `Content-Type` header will be set to `application/json` if not exists.
  - If the response `body` is a `Buffer` or a `string`, the `Content-Type` header will be set to `plain/text` if not exists.
  - If the response `body` is a `ReadableStream`, the `Content-Type` header will be set to `application/octet-stream` if not exists.
- `cookies`: The object of cookies of the response.
- `clearCookie`: The object of clear cookies of the response.

## MiddlewareNext

The `MiddlewareNext` interface call the next middleware or route handler. If you send object in this function, the object will be merged with the property `custom` of the `IntRequest` interface. The `MiddlewareNext` return a `Promise` with the `IntResponse` interface and this **response must be returned** in the middleware.

### Properties

- `custom`: The object of custom properties of the request. You can use this for share data between middlewares and route handlers.

## Next Steps

[Troubleshooting](./TROUBLESHOOTING.md)
