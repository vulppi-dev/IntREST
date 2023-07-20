import { dirname, resolve } from 'path'
import { join, normalizePath } from '../utils/path'
import { fileURLToPath } from 'url'
import { cpSync } from 'fs'

export const command = 'create'

export const aliases = ['init', 'new']

export const describe = 'Initialize a new backend project powered by Vulppi'

export const handler = async (): Promise<void> => {
  const projectPath = normalizePath(process.cwd())
  const templateFolder = join(
    dirname(fileURLToPath(import.meta.url)),
    '../..',
    'templates',
    'simple',
  )
  cpSync(templateFolder, projectPath, {
    recursive: true,
  })
  console.log('\nProject created successfully! 🤩🎉\n')
}
