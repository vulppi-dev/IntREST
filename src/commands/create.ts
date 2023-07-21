import ck from 'chalk'
import { cpSync } from 'fs'
import { fileURLToPath } from 'url'
import { join, normalizePath } from '../utils/path'

export const command = 'create'

export const aliases = ['init', 'new']

export const describe = 'Initialize a new backend project powered by Vulppi'

export const handler = async (): Promise<void> => {
  const projectPath = normalizePath(process.cwd())
  console.log('Project folder: %s\n', ck.blue(projectPath))

  const templateFolder = fileURLToPath(
    new URL(join('../..', 'templates', 'simple'), import.meta.url),
  )

  cpSync(templateFolder, projectPath, {
    recursive: true,
    filter: () => true,
  })
  console.log('\nProject created successfully! 🤩🎉\n')
}
