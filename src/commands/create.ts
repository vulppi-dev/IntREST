import { dirname, resolve } from 'path'
import { join, normalizePath } from '../utils/path'
import { fileURLToPath } from 'url'
import { cpSync } from 'fs'

const urlPath = import.meta.url
// Url in dist/commands folder
const basePath = resolve(fileURLToPath(urlPath), '../..')
const __dirname = dirname(basePath)

export const command = 'create'

export const aliases = ['init', 'new']

export const describe = 'Initialize a new backend project powered by Vulppi'

export const handler = async (): Promise<void> => {
  const projectPath = normalizePath(process.cwd())
  const templateFolder = join(__dirname, 'templates', 'simple')
  cpSync(templateFolder, projectPath, {
    recursive: true,
  })
  console.log('Project created successfully!')
}
