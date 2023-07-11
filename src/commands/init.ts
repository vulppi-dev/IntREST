import type { Options } from 'yargs'

export const command = 'init [projectPath]'

export const describe = 'Initialize a new backend project powered by Vulppi'

export const builder: Record<string, Options> = {
  projectPath: {
    type: 'string',
    alias: 'p',
    describe: 'The path to the project',
    default: '.',
  },
}

export const handler = async (argv: any): Promise<void> => {
  console.log('Not implemented yet')
}
