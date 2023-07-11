import type { Options } from 'yargs'

export const command = 'serve'

export const aliases = ['start', 'server']

export const describe = 'Start the server'

export const builder: Record<string, Options> = {
  port: {
    type: 'number',
    describe: 'The port to listen on',
    default: '4000',
  },
}

export const handler = async (argv: any): Promise<void> => {
  console.log('Not implemented yet')
}
