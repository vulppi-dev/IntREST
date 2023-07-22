import ck from 'chalk'
import { cpSync } from 'fs'
import { fileURLToPath } from 'url'
import { join, normalizePath } from '../utils/path'

export const command = 'create'

export const aliases = ['init', 'new']

export const describe = 'Initialize a new backend project powered by Vulppi'

export const handler = async (): Promise<void> => {
  // Get the project root path
  const projectPath = normalizePath(process.cwd())
  console.log('Project folder: %s\n', ck.blue(projectPath))

  // Get the template project folder
  const templateFolder = fileURLToPath(
    new URL(join('../..', 'templates', 'simple'), import.meta.url),
  )

  // Copy the template project folder to the project root path
  cpSync(templateFolder, projectPath, {
    recursive: true,
    filter: () => true,
  })
  console.log('\nProject created successfully! 🤩🎉\n')
}
