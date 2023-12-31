import ck from 'chalk'
import { cpSync, writeFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { normalizePath } from '../controllers/path'

export const command = 'create'

export const aliases = ['init', 'new']

export const describe = 'Initialize a new backend project powered by Vulppi'

export const handler = async (): Promise<void> => {
  // Get the project root path
  const projectPath = normalizePath(process.cwd())
  console.log('Project folder: %s\n', ck.cyan(projectPath))

  // Get the template project folder
  const templateFolder = fileURLToPath(
    new URL(
      normalizePath(join('../..', 'templates', 'starter')),
      import.meta.url,
    ),
  )

  // Copy the template project folder to the project root path
  cpSync(templateFolder, projectPath, {
    recursive: true,
    filter: () => true,
  })
  writeFileSync(
    normalizePath(join(projectPath, '.gitignore')),
    `# Vulppi ignore template

# package
node_modules/
npm-debug.log

# IDE
.idea/

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
bun.lock*

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
*.env.*
*.env

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
