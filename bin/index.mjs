#!/usr/bin/env node

import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'
import * as commands from '../dist/commands/index.mjs'

yargs(hideBin(process.argv))
  .scriptName('intrest')
  .usage('irest <cmd> [args]')
  .command(Object.values(commands))
  .help()
  .recommendCommands()
  .parse()
