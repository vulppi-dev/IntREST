import ck from 'chalk'
import { build } from 'esbuild'
import { existsSync, rmSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { clearExtension, join } from '../utils/path'

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
        const existsEntry = existsSync(join(input, entry))
        if (!existsEntry) {
          rmSync(join(output, clearExtension(entry) + '.mjs'))
          console.log('Removed %s', ck.bold.red(entry))
          return resolve()
        }

        console.log('Building %s', ck.bold.green(entry))

        const absoluteEntry = join(input, entry)
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
          outdir: output,
        })
        console.log('Done %s', ck.bold.green(entry))
        resolve()
      }, 250),
    )
  })
}