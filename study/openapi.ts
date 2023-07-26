import { createReadStream, readFileSync } from 'fs'
import { StatusCodes } from 'http-status-codes'
import type { OpenAPIV3_1 } from 'openapi-types'
import { pathToFileURL } from 'url'
import { parentPort } from 'worker_threads'
import { join } from '../src/utils/path'
import { findRoutePathnames, sendResponseAll } from '../src/utils/router-tools'

parentPort!.on(
  'message',
  async ({ config, basePath, data, requestId }: WorkerProps) => {
    const context = {
      ...data,
      params: {},
      query: new URLSearchParams(data.query || ''),
      assetsStream: (path: string) => {
        return createReadStream(join(basePath, 'assets', path))
      },
      assetsRawContent: (path: string) => {
        return readFileSync(join(basePath, 'assets', path))
      },
      assetsContent: (path: string) => {
        return readFileSync(join(basePath, 'assets', path)).toString()
      },
    } as IntREST.IntRequest

    let pkg: any
    try {
      pkg = JSON.parse(readFileSync(join(basePath, 'package.json')).toString())
    } catch (err) {
      pkg = {}
    }

    const routesPaths = await findRoutePathnames(basePath)

    const openApi = {
      openapi: '3.1.0',
      info: {
        title: config.openapi?.title || pkg.name,
        version: pkg.version,
        description: pkg.description,
        license: {
          name: config.openapi?.license || pkg.license,
          url: config.openapi?.licenseUrl,
          identifier: config.openapi?.license || pkg.license,
        },
        contact: config.openapi?.contact || {
          name: pkg.author?.name || pkg.author,
          url: pkg.author?.url,
          email: pkg.author?.email,
        },
        termsOfService: config.openapi?.termsOfService,
        summary: config.openapi?.summary,
      },
      servers: config.openapi?.server && [config.openapi?.server],
      components: {
        schemas: {
          GeneralError: {
            required: ['message'],
            type: 'object',
            description: 'A general error object',
            properties: {
              message: {
                type: 'string',
                description: 'The error message',
              },
            },
            additionalProperties: true,
          },
          GenericRecord: {
            type: 'object',
            description: 'A generic record with any properties',
            additionalProperties: true,
          },
        },
      },
      paths: await routesPaths.reduce(async (promise, r) => {
        const acc = await promise
        const isCatchAll = /\[\.\.\.[A-zÀ-ú0-9-_\$]+\]$/.test(r.route)
        const module = await import(pathToFileURL(r.pathname).toString()).catch(
          () => ({}),
        )
        const keys = Object.keys(module)

        const apiRoute = r.route.replace(
          /\[(?:\.\.\.)?([A-zÀ-ú0-9-_\$]+)\]/g,
          '{$1}',
        )
        const pathData = acc[apiRoute] || (acc[apiRoute] = {})

        // Parse route params to OpenAPI
        pathData.parameters = r.vars
          .map((k, i, l) => {
            const lastIndex = l.length - 1
            return {
              name: k,
              in: 'path',
              required: lastIndex !== i || !isCatchAll,
              schema: {
                type: 'string',
              },
            } as OpenAPIV3_1.ParameterObject
          })
          .concat(
            ...((pathData.parameters || []) as OpenAPIV3_1.ParameterObject[]),
          )

        // Parse methods to OpenAPI
        for (const key of keys) {
          if (key === 'default') continue
          const method = key.toLowerCase() as Lowercase<IntREST.RequestMethods>
          if (!['get', 'post', 'put', 'patch', 'delete'].includes(method))
            continue

          pathData[method] = {
            responses: {
              '200': {
                description: 'Success response',
                content: {
                  '*/*': {},
                },
              },
              default: {
                description: 'Error payload',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/GeneralError',
                    },
                  },
                },
              },
            },
          } as OpenAPIV3_1.OperationObject<any>

          if (method !== 'get')
            pathData[method]!.requestBody = {
              required: false,
              description: 'Request generic body',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/GenericRecord',
                  },
                },
              },
            }
        }

        return acc
      }, Promise.resolve({} as OpenAPIV3_1.PathsObject)),
    } as OpenAPIV3_1.Document

    if (/^\/__api\/api\.json\/?$/.test(data.path)) {
      return sendResponseAll(
        {
          status: StatusCodes.OK,
          body: openApi,
        },
        context.headers,
        requestId,
      )
    }
    if (/^\/__api(?:\/index\.html)?\/?$/.test(data.path)) {
      return sendResponseAll(
        {
          status: StatusCodes.OK,
          headers: {
            'Content-Type': 'text/html',
          },
          body: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta
    name="description"
    content="SwaggerUI"
  />
  <title>SwaggerUI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.2.0/swagger-ui.css" />
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5.2.0/swagger-ui-bundle.js" crossorigin></script>
<script>
  window.onload = () => {
    window.ui = SwaggerUIBundle({
      url: '/__api/api.json',
      dom_id: '#swagger-ui',
    });
  };
</script>
</body>
</html>`,
        },
        context.headers,
        requestId,
      )
    }

    return sendResponseAll(
      {
        status: StatusCodes.NOT_FOUND,
        body: {
          message: 'Not found',
        },
      },
      context.headers,
      requestId,
    )
  },
)
