import { dirname, resolve } from 'path'
import { join, normalizePath } from '../utils/path'
import { fileURLToPath } from 'url'
import { cpSync } from 'fs'
import ck from 'chalk'

export const command = 'create'

export const aliases = ['init', 'new']

export const describe = 'Initialize a new backend project powered by Vulppi'

export const handler = async (): Promise<void> => {
  const projectPath = normalizePath(process.cwd())
  console.log('Project folder: %s\n', ck.blue(projectPath))

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
