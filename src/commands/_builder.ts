import ck from 'chalk'
import { build, type Plugin } from 'esbuild'
import { cpSync, existsSync, readFileSync, rmSync } from 'fs'
import { dirname, resolve, basename } from 'path'
import { fileURLToPath } from 'url'
import { clearExtension, escapePath, join } from '../utils/path'
import { defaultPaths } from '../utils/constants'
import { execSync } from 'child_process'

const urlPath = import.meta.url
// Url in dist/commands folder
const basePath = resolve(fileURLToPath(urlPath), '../..')
const typeDef = join(dirname(basePath), 'types/index.d.ts')

interface CallBuildProps {
  input: string
  output: string
  entry: string
}

const timeoutMap: Map<string, NodeJS.Timeout> = new Map()
const promiseMap: Map<string, VoidFunction> = new Map()

export async function callBuild({ input, output, entry }: CallBuildProps) {
  return new Promise<void>((resolve) => {
    if (timeoutMap.has(entry)) {
      clearTimeout(timeoutMap.get(entry)!)
      timeoutMap.delete(entry)
    }
    if (promiseMap.has(entry)) {
      promiseMap.get(entry)!()
      promiseMap.delete(entry)
    }
    promiseMap.set(entry, resolve)
    timeoutMap.set(
      entry,
      setTimeout(async () => {
        timeoutMap.delete(entry)
        promiseMap.delete(entry)
        const generatedPath = join(output, defaultPaths.compiledGenerated)
        const appPath = join(output, defaultPaths.compiledApp)
        const absoluteEntry = join(input, entry)

        const existsEntry = existsSync(absoluteEntry)
        if (!existsEntry) {
          const existsGenerated = existsSync(join(generatedPath, entry))
          const existsApp = existsSync(
            join(appPath, clearExtension(entry) + '.mjs'),
          )
          existsGenerated && rmSync(join(generatedPath, entry))
          existsApp && rmSync(join(appPath, clearExtension(entry) + '.mjs'))
          console.log('Removed %s', ck.bold.red(entry))
          return resolve()
        }

        console.log('Building %s', ck.bold.green(entry))

        await build({
          entryPoints: {
            [clearExtension(entry)]: absoluteEntry,
          },
          bundle: true,
          minify: false,
          packages: 'external',
          target: 'node18',
          platform: 'node',
          format: 'esm',
          outExtension: { '.js': '.mjs' },
          outdir: appPath,
          // plugins: [
          //   transformValidationPlugin(
          //     join(generatedPath, dirname(entry)),
          //     join(appPath, dirname(entry)),
          //   ),
          // ],
        })
        console.log('Done %s', ck.bold.green(entry))
        resolve()
      }, 250),
    )
  })
}

// function transformValidationPlugin(generatedPath: string, appPath: string) {
//   return {
//     name: 'transform-validation',
//     async setup(build) {
//       build.onLoad({ filter: /\.ts$/ }, async (args) => {
//         const generated = join(generatedPath, basename(args.path))
//         cpSync(args.path, generated, {
//           force: true,
//           recursive: true,
//         })
//         execSync(`typia generate --input "${generated}" --output ${generated}`)
//         return { contents: readFileSync(generated) }
//       })
//     },
//   } as Plugin
// }
