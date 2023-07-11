import type { Options } from 'yargs'

export const command = 'build'

export const describe = 'Build the project'

export const builder: Record<string, Options> = {}

export const handler = async (argv: any): Promise<void> => {
  console.log('Not implemented yet')
}
