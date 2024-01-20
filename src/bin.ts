#!/usr/bin/env node

import { build } from './index.js'
import { compile } from 'tsconfig-utils'

const cwd = process.cwd()
const args = process.argv.slice(2)

Promise.all([
  compile(args),
  build(cwd, args),
]).then(([code]) => process.exit(code))
