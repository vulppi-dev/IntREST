import type { Options } from 'yargs'

export const command = 'tools'

export const describe = 'Tools for the project'

export const builder: Record<string, Options> = {}

export const handler = async (argv: any): Promise<void> => {
  console.log('Not implemented yet')
}
