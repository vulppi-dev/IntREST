#!/usr/bin/env node

import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'
import * as commands from '../dist/commands/index.mjs'

yargs(hideBin(process.argv))
  .scriptName('vulppi')
  .command(Object.values(commands))
  .help()
  .recommendCommands()
  .parse()
