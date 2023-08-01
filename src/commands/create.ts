import ck from 'chalk'
import { cpSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { join, normalizePath } from '../utils/path'

export const command = 'create'

export const aliases = ['init', 'new']

export const describe = 'Initialize a new backend project powered by Vulppi'

export const handler = async (): Promise<void> => {
  // Get the project root path
  const projectPath = normalizePath(process.cwd())
  console.log('Project folder: %s\n', ck.cyan(projectPath))

  // Get the template project folder
  const templateFolder = fileURLToPath(
    new URL(join('../..', 'templates', 'simple'), import.meta.url),
  )

  // Copy the template project folder to the project root path
  cpSync(templateFolder, projectPath, {
    recursive: true,
    filter: () => true,
  })
  writeFileSync(
    join(projectPath, '.gitignore'),
    `# Vulppi
# package
node_modules/
npm-debug.log

# IDE
.idea/
.vscode/

# OS files
.DS_Store
Thumbs.db

# log
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
pnpm-debug.log*

# lock
package-lock.json
pnpm-lock.yaml
yarn.lock

# build
.intrest/
build/
dist/
*.gem
*.egg

# temporary
*.swp
*temp/
*tmp/

# test
coverage/
.nyc_output/

# typescript
*.tsbuildinfo
`,
    {
      flag: 'w+',
    },
  )
  console.log('Project created successfully! 🤩🎉\n')
}
